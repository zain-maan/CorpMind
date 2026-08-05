from datetime import datetime

from pydantic import BaseModel

from app.models.action import ActionType, ActionStatus


class ActionRequestResponse(BaseModel):
    id: str
    employee_id: str
    branch_id: str
    action_type: ActionType
    draft_content: str
    status: ActionStatus
    hr_notes: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class ActionReviewRequest(BaseModel):
    status: ActionStatus  # expected: approved or rejected
    hr_notes: str | None = None


class ActionCreateRequest(BaseModel):
    """
    Sent by the frontend only when the employee explicitly confirms a
    chatbot-drafted leave/expense request ("Send to HR for review").
    The draft itself was never persisted before this call — it only
    existed inside the chat message's `sources` payload.
    """
    action_type: ActionType
    draft_content: str
    conversation_id: str | None = None