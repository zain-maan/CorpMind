"""
User management with role-based creation rules, mirroring the pitch's
hierarchy: super_admin creates branch_admins, branch_admin creates HR,
HR/branch_admin create employees.

  POST /api/users -> create a subordinate account (rules enforced below)
  GET  /api/users -> list users in the caller's scope
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.security import hash_password
from app.models.branch import Branch
from app.models.user import User, UserRole
from app.schemas.user import UserCreateRequest, UserListResponse

router = APIRouter()

# Who is allowed to create which role
CREATION_RULES: dict[UserRole, set[UserRole]] = {
    UserRole.SUPER_ADMIN: {UserRole.BRANCH_ADMIN},
    UserRole.BRANCH_ADMIN: {UserRole.HR, UserRole.EMPLOYEE},
    UserRole.HR: {UserRole.EMPLOYEE},
}


@router.post("/", response_model=UserListResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    payload: UserCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    allowed_roles = CREATION_RULES.get(current_user.role, set())
    if payload.role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"A {current_user.role.value} cannot create a {payload.role.value} account",
        )

    if current_user.role == UserRole.SUPER_ADMIN:
        if not payload.branch_id:
            raise HTTPException(status_code=400, detail="branch_id is required")
        branch_result = await db.execute(
            select(Branch).where(
                Branch.id == payload.branch_id, Branch.company_id == current_user.company_id
            )
        )
        if branch_result.scalar_one_or_none() is None:
            raise HTTPException(status_code=404, detail="Branch not found in your company")
        target_branch_id = payload.branch_id
    else:
        # branch_admin / hr can only create people in THEIR OWN branch —
        # branch_id is forced, not taken from the request.
        target_branch_id = current_user.branch_id

    existing = await db.execute(select(User).where(User.email == payload.email))
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = User(
        company_id=current_user.company_id,
        branch_id=target_branch_id,
        full_name=payload.full_name,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        role=payload.role,
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return new_user


@router.get("/", response_model=list[UserListResponse])
async def list_users(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role == UserRole.SUPER_ADMIN:
        query = select(User).where(User.company_id == current_user.company_id)
    elif current_user.role in (UserRole.BRANCH_ADMIN, UserRole.HR):
        query = select(User).where(User.branch_id == current_user.branch_id)
    else:
        raise HTTPException(status_code=403, detail="Not authorized to list users")

    result = await db.execute(query)
    return result.scalars().all()