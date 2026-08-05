"""
Document management — Phase 4a (local storage only, no embeddings yet).

  POST   /api/documents         -> HR uploads a file, tags it to a domain
  GET    /api/documents         -> list documents (scoped to caller's branch/company)
  DELETE /api/documents/{id}    -> soft-delete (keeps the file + row for
                                    citation history, just hides it from
                                    future retrieval)

Phase 4b will add: after saving the file here, also chunk + embed it and
push those chunks into the matching Qdrant collection (one collection per
KnowledgeDomain), plus save DocumentChunk rows so search hits can be
traced back to a source passage.
"""
import os
import shutil
import uuid

from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_role
from app.models.branch import Branch
from app.models.document import Document, KnowledgeDomain
from app.models.user import User, UserRole
from app.schemas.document import DocumentResponse
from app.core.indexing import index_document
router = APIRouter()


@router.post("/", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    title: str = Form(...),
    domain: KnowledgeDomain = Form(...),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.HR)),
):
    if not current_user.branch_id:
        raise HTTPException(status_code=400, detail="HR account must belong to a branch")

    doc_id = str(uuid.uuid4())
    branch_dir = os.path.join(settings.STORAGE_DIR, current_user.branch_id)
    os.makedirs(branch_dir, exist_ok=True)

    ext = os.path.splitext(file.filename)[1]
    storage_path = os.path.join(branch_dir, f"{doc_id}{ext}")

    with open(storage_path, "wb") as out_file:
        shutil.copyfileobj(file.file, out_file)

    document = Document(
        id=doc_id,
        branch_id=current_user.branch_id,
        uploaded_by=current_user.id,
        title=title,
        domain=domain,
        original_filename=file.filename,
        storage_path=storage_path,
    )
    db.add(document)
    await db.commit()
    await db.refresh(document)
    try:
        await index_document(document, db)
    except ValueError:
        # unsupported file type for text extraction — file is still
        # saved on disk, just won't be searchable yet
        pass

    return document


@router.get("/", response_model=list[DocumentResponse])
async def list_documents(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role == UserRole.SUPER_ADMIN:
        # every active document across every branch in their company
        query = (
            select(Document)
            .join(Branch, Document.branch_id == Branch.id)
            .where(Branch.company_id == current_user.company_id, Document.is_active == True)  # noqa: E712
        )
    else:
        # branch_admin, hr, employee — only their own branch's active docs
        query = select(Document).where(
            Document.branch_id == current_user.branch_id, Document.is_active == True  # noqa: E712
        )

    result = await db.execute(query)
    return result.scalars().all()


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    document_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.HR, UserRole.BRANCH_ADMIN)),
):
    result = await db.execute(select(Document).where(Document.id == document_id))
    document = result.scalar_one_or_none()

    if document is None:
        raise HTTPException(status_code=404, detail="Document not found")
    if document.branch_id != current_user.branch_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this document")

    # Soft-delete: keeps the file on disk and the row in the DB, so any
    # past chat message that cited this document still resolves correctly.
    document.is_active = False
    await db.commit()