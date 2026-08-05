"""
Branch = a physical/organizational branch within a company
(e.g. "Lahore Office", "Karachi Office"). Documents and users are
scoped to a branch — this is how CorpMind isolates data structurally.
"""
from sqlalchemy import String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import UUIDPrimaryKeyMixin, TimestampMixin


class Branch(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "branches"

    company_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)

    company: Mapped["Company"] = relationship(back_populates="branches")
    users: Mapped[list["User"]] = relationship(
        back_populates="branch", cascade="all, delete-orphan"
    )
    documents: Mapped[list["Document"]] = relationship(
        back_populates="branch", cascade="all, delete-orphan"
    )
