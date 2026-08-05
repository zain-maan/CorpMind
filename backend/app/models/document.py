"""
Document = a file HR uploaded (policy PDF, SOP, contract, etc.), tagged
to a knowledge domain. The actual raw file is stored on disk/cloud storage
(storage_path points to it); the searchable content lives in Qdrant as
embeddings — DocumentChunk is the bridge between the two.

DocumentChunk = one embedded passage of a document. When a specialist
agent's Qdrant search returns a hit, we look up the matching DocumentChunk
row to get back the exact source document + passage for citation.
"""
import enum

from sqlalchemy import String, ForeignKey, Enum, Boolean, Text, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import UUIDPrimaryKeyMixin, TimestampMixin


class KnowledgeDomain(str, enum.Enum):
    HR = "hr"
    FINANCE = "finance"
    IT = "it"
    LEGAL = "legal"


class Document(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "documents"

    branch_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("branches.id", ondelete="CASCADE"), nullable=False
    )
    uploaded_by: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    domain: Mapped[KnowledgeDomain] = mapped_column(
        Enum(KnowledgeDomain, name="knowledge_domain"), nullable=False
    )
    original_filename: Mapped[str] = mapped_column(String(500), nullable=False)
    storage_path: Mapped[str] = mapped_column(String(1000), nullable=False)
    # Soft-delete flag — lets HR deprecate a doc without breaking old chat
    # citations that reference it.
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    branch: Mapped["Branch"] = relationship(back_populates="documents")
    uploaded_by_user: Mapped["User"] = relationship(back_populates="uploaded_documents")
    chunks: Mapped[list["DocumentChunk"]] = relationship(
        back_populates="document", cascade="all, delete-orphan"
    )


class DocumentChunk(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "document_chunks"

    document_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False
    )
    # The matching point ID in Qdrant — lets us go Qdrant hit -> this row.
    qdrant_point_id: Mapped[str] = mapped_column(String(36), nullable=False, unique=True)
    chunk_text: Mapped[str] = mapped_column(Text, nullable=False)
    chunk_index: Mapped[int] = mapped_column(Integer, nullable=False)

    document: Mapped["Document"] = relationship(back_populates="chunks")
