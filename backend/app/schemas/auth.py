"""
Pydantic schemas for auth endpoints.
"""
from pydantic import BaseModel, EmailStr, Field

from app.models.user import UserRole


class CompanySignupRequest(BaseModel):
    company_name: str = Field(min_length=2, max_length=255)
    admin_full_name: str = Field(min_length=2, max_length=255)
    admin_email: EmailStr
    admin_password: str = Field(min_length=8)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: str
    company_id: str
    company_name: str
    branch_id: str | None
    full_name: str
    email: str
    role: UserRole
    is_active: bool

    model_config = {"from_attributes": True}