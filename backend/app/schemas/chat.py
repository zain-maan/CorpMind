from datetime import datetime

from pydantic import BaseModel

from app.models.chat import MessageRole


class MessageResponse(BaseModel):
    id: str
    role: MessageRole
    content: str
    routed_domains: list[str] | None = None
    sources: list[dict] | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ConversationResponse(BaseModel):
    id: str
    title: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ConversationDetailResponse(ConversationResponse):
    messages: list[MessageResponse] = []


class AskRequest(BaseModel):
    question: str


class ConversationCreateRequest(BaseModel):
    title: str | None = None