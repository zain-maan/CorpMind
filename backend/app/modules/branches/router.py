"""
Branch management:
  POST /api/branches -> super_admin creates a new branch under their own company
  GET  /api/branches -> list branches (scoped to current user's company)
"""
from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import require_role, get_current_user
from app.models.branch import Branch
from app.models.user import User, UserRole
from app.schemas.branch import BranchCreateRequest, BranchResponse

router = APIRouter()


@router.post("/", response_model=BranchResponse, status_code=status.HTTP_201_CREATED)
async def create_branch(
    payload: BranchCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN)),
):
    branch = Branch(company_id=current_user.company_id, name=payload.name)
    db.add(branch)
    await db.commit()
    await db.refresh(branch)
    return branch


@router.get("/", response_model=list[BranchResponse])
async def list_branches(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Branch).where(Branch.company_id == current_user.company_id))
    return result.scalars().all()