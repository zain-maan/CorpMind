"""
Auth endpoints:
  POST /api/auth/signup  -> creates a new Company + its first super_admin user
  POST /api/auth/login    -> verifies credentials, returns a JWT
  GET  /api/auth/me       -> returns the currently logged-in user
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.security import hash_password, verify_password, create_access_token
from app.models.company import Company
from app.models.user import User, UserRole
from app.schemas.auth import CompanySignupRequest, LoginRequest, TokenResponse, UserResponse

router = APIRouter()


@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def signup(payload: CompanySignupRequest, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(User).where(User.email == payload.admin_email))
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    company = Company(name=payload.company_name)
    db.add(company)
    await db.flush()  # assigns company.id without committing yet

    admin_user = User(
        company_id=company.id,
        branch_id=None,  # super_admin is company-wide, not tied to a branch
        full_name=payload.admin_full_name,
        email=payload.admin_email,
        hashed_password=hash_password(payload.admin_password),
        role=UserRole.SUPER_ADMIN,
    )
    db.add(admin_user)
    await db.commit()
    await db.refresh(admin_user)

    return UserResponse(
        id=admin_user.id,
        company_id=admin_user.company_id,
        company_name=company.name,
        branch_id=admin_user.branch_id,
        full_name=admin_user.full_name,
        email=admin_user.email,
        role=admin_user.role,
        is_active=admin_user.is_active,
    )


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()

    if user is None or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is deactivated")

    token = create_access_token(data={"sub": user.id, "role": user.role.value})
    return TokenResponse(access_token=token)


@router.get("/me", response_model=UserResponse)
async def get_me(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    company = await db.get(Company, current_user.company_id)
    return UserResponse(
        id=current_user.id,
        company_id=current_user.company_id,
        company_name=company.name if company else "",
        branch_id=current_user.branch_id,
        full_name=current_user.full_name,
        email=current_user.email,
        role=current_user.role,
        is_active=current_user.is_active,
    )