"""
Import every model here so that:
1. `Base.metadata` knows about all tables (required for Alembic autogenerate)
2. Other code can do `from app.models import User` instead of deep imports
"""
from app.models.company import Company
from app.models.branch import Branch
from app.models.user import User, UserRole
from app.models.document import Document, DocumentChunk, KnowledgeDomain
from app.models.chat import Conversation, Message, MessageRole
from app.models.action import ActionRequest, ActionType, ActionStatus

__all__ = [
    "Company",
    "Branch",
    "User",
    "UserRole",
    "Document",
    "DocumentChunk",
    "KnowledgeDomain",
    "Conversation",
    "Message",
    "MessageRole",
    "ActionRequest",
    "ActionType",
    "ActionStatus",
]