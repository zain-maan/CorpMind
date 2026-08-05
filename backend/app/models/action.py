"""
ActionRequest = a leave/expense draft the chatbot wrote on an employee's
behalf (see app/agents/action_agent.py), waiting for HR review — this is
the "chatbot does things for you" part of the pitch, not just Q&A.
"""
import enum

from sqlalchemy import String, ForeignKey, Enum, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import UUIDPrimaryKeyMixin, TimestampMixin


class ActionType(str, enum.Enum):
    LEAVE = "leave"
    EXPENSE = "expense"


class ActionStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class ActionRequest(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "action_requests"

    employee_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    branch_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("branches.id", ondelete="CASCADE"), nullable=False
    )
    conversation_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("conversations.id", ondelete="SET NULL"), nullable=True
    )

    action_type: Mapped[ActionType] = mapped_column(Enum(ActionType, name="action_type"), nullable=False)
    draft_content: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[ActionStatus] = mapped_column(
        Enum(ActionStatus, name="action_status"), nullable=False, default=ActionStatus.PENDING
    )

    reviewed_by: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)
    hr_notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    employee: Mapped["User"] = relationship(foreign_keys=[employee_id])