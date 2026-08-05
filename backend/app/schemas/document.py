from pydantic import BaseModel

from app.models.document import KnowledgeDomain


class DocumentResponse(BaseModel):
    id: str
    branch_id: str
    uploaded_by: str
    title: str
    domain: KnowledgeDomain
    original_filename: str
    is_active: bool

    model_config = {"from_attributes": True}