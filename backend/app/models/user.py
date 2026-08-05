"""
User = anyone who can log in: super admin, branch admin, HR, or employee.

Role hierarchy (set at creation, drives what a user can see/do):
- SUPER_ADMIN  -> company-wide, not tied to a single branch (branch_id is NULL).
                  Sets up branches and branch admins.
- BRANCH_ADMIN -> manages one branch. Creates HR accounts for that branch.
- HR           -> uploads/manages documents for their branch, reviews
                  employee requests (leave/expense drafts) for their branch.
- EMPLOYEE     -> regular chat user. Can only query documents belonging to
                  their own branch. Cannot see other employees' chats.

IMPORTANT: role + branch_id together are what the retrieval layer checks
before ANY document search happens (Phase 4/5) — this is the "structural"
access control mentioned in the pitch, not just a prompt instruction.
"""
import enum

from sqlalchemy import String, ForeignKey, Enum, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import UUIDPrimaryKeyMixin, TimestampMixin


class UserRole(str, enum.Enum):
    SUPER_ADMIN = "super_admin"
    BRANCH_ADMIN = "branch_admin"
    HR = "hr"
    EMPLOYEE = "employee"


class User(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "users"

    company_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False
    )
    # Nullable ONLY for SUPER_ADMIN (company-wide, not scoped to one branch)
    branch_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("branches.id", ondelete="CASCADE"), nullable=True
    )

    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, name="user_role"), nullable=False, default=UserRole.EMPLOYEE
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    company: Mapped["Company"] = relationship(back_populates="users")
    branch: Mapped["Branch | None"] = relationship(back_populates="users")
    conversations: Mapped[list["Conversation"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    uploaded_documents: Mapped[list["Document"]] = relationship(back_populates="uploaded_by_user")
    conversations: Mapped[list["Conversation"]] = relationship(back_populates="user", cascade="all, delete-orphan")
