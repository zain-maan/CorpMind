from pydantic import BaseModel, EmailStr, Field

from app.models.user import UserRole


class UserCreateRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=255)
    email: EmailStr
    password: str = Field(min_length=8)
    role: UserRole
    # Required when the creator is super_admin creating a branch_admin/hr/employee.
    # Ignored (auto-filled) when a branch_admin/hr creates someone in their own branch.
    branch_id: str | None = None


class UserListResponse(BaseModel):
    id: str
    full_name: str
    email: str
    role: UserRole
    branch_id: str | None
    is_active: bool

    model_config = {"from_attributes": True}