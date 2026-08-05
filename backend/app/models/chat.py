"""
Conversation = one chat thread belonging to exactly one user.
Message = one turn in that thread (user question or assistant answer).

PRIVACY NOTE: there is no admin-override relationship here on purpose.
Access to a Conversation/Message must always be checked against
`conversation.user_id == current_user.id` in the API layer (Phase 3/6) —
even a super_admin has no query path to another user's chat.
"""
import enum

from sqlalchemy import String, ForeignKey, Enum, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import UUIDPrimaryKeyMixin, TimestampMixin


class MessageRole(str, enum.Enum):
    USER = "user"
    ASSISTANT = "assistant"


class Conversation(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "conversations"

    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    title: Mapped[str] = mapped_column(String(255), default="New chat")

    user: Mapped["User"] = relationship(back_populates="conversations")
    messages: Mapped[list["Message"]] = relationship(
        back_populates="conversation",
        cascade="all, delete-orphan",
        order_by="Message.created_at",
    )


class Message(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "messages"

    conversation_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False
    )
    role: Mapped[MessageRole] = mapped_column(Enum(MessageRole, name="message_role"), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)

    # Which domain(s)/agent(s) handled this message, e.g. ["hr", "finance"]
    # Useful for showing "Answered by: HR + Finance" badges in the UI.
    routed_domains: Mapped[list | None] = mapped_column(JSON, nullable=True)

    # Source citations: [{"document_id": ..., "title": ..., "chunk_text": ...}]
    sources: Mapped[list | None] = mapped_column(JSON, nullable=True)

    conversation: Mapped["Conversation"] = relationship(back_populates="messages")
