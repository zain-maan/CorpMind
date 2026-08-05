"""
Phase 4b: after a document is saved to disk, this extracts its text,
chunks it, embeds each chunk, and pushes vectors into the matching
Qdrant collection (one per KnowledgeDomain) — plus saves DocumentChunk
rows in Postgres so search hits can be traced back to a source document.
"""
import uuid

from qdrant_client.models import PointStruct
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.chunking import chunk_text
from app.core.embeddings import embed_texts
from app.core.qdrant_client import get_qdrant_client
from app.core.text_extraction import extract_text
from app.models.document import Document, DocumentChunk


async def index_document(document: Document, db: AsyncSession) -> int:
    """
    Returns the number of chunks indexed.
    Raises ValueError if the file type isn't supported for extraction.
    """
    text = extract_text(document.storage_path)
    if not text:
        return 0

    chunks = chunk_text(text)
    if not chunks:
        return 0

    vectors = embed_texts(chunks)

    collection_name = f"corpmind_{document.domain.value.lower()}"
    client = get_qdrant_client()

    points = []
    chunk_rows = []

    for idx, (chunk, vector) in enumerate(zip(chunks, vectors)):
        point_id = str(uuid.uuid4())

        points.append(
            PointStruct(
                id=point_id,
                vector=vector,
                payload={
                    "document_id": document.id,
                    "branch_id": document.branch_id,
                    "chunk_index": idx,
                    "chunk_text": chunk,
                    "title": document.title,
                },
            )
        )

        chunk_rows.append(
            DocumentChunk(
                id=str(uuid.uuid4()),
                document_id=document.id,
                qdrant_point_id=point_id,
                chunk_text=chunk,
                chunk_index=idx,
            )
        )

    client.upsert(collection_name=collection_name, points=points)

    db.add_all(chunk_rows)
    await db.commit()

    return len(chunks)