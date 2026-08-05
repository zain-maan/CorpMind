"""
Action requests — HR reviews leave/expense drafts the chatbot created on
an employee's behalf (see app/agents/action_agent.py).

  POST  /api/actions        -> Employee confirms a chatbot-drafted
                                request and submits it for HR review.
  GET   /api/actions        -> HR/branch_admin: all requests in their
                                branch. Employee: only their own requests.
  PATCH /api/actions/{id}   -> HR/branch_admin approves or rejects a
                                request — scoped to their own branch.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_role
from app.models.action import ActionRequest, ActionStatus
from app.models.user import User, UserRole
from app.schemas.action import ActionRequestResponse, ActionReviewRequest, ActionCreateRequest

router = APIRouter()


@router.post("/", response_model=ActionRequestResponse, status_code=status.HTTP_201_CREATED)
async def create_action(
    payload: ActionCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.branch_id:
        raise HTTPException(
            status_code=400,
            detail="Your account isn't linked to a branch, so this can't be routed to HR.",
        )

    action_request = ActionRequest(
        employee_id=current_user.id,
        branch_id=current_user.branch_id,
        conversation_id=payload.conversation_id,
        action_type=payload.action_type,
        draft_content=payload.draft_content,
        status=ActionStatus.PENDING,
    )
    db.add(action_request)
    await db.commit()
    await db.refresh(action_request)
    return action_request


@router.get("/", response_model=list[ActionRequestResponse])
async def list_actions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role in (UserRole.HR, UserRole.BRANCH_ADMIN):
        query = select(ActionRequest).where(ActionRequest.branch_id == current_user.branch_id)
    elif current_user.role == UserRole.EMPLOYEE:
        query = select(ActionRequest).where(ActionRequest.employee_id == current_user.id)
    else:
        raise HTTPException(status_code=403, detail="Not authorized to view action requests")

    query = query.order_by(ActionRequest.created_at.desc())
    result = await db.execute(query)
    return result.scalars().all()


@router.patch("/{action_id}", response_model=ActionRequestResponse)
async def review_action(
    action_id: str,
    payload: ActionReviewRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.HR, UserRole.BRANCH_ADMIN)),
):
    result = await db.execute(select(ActionRequest).where(ActionRequest.id == action_id))
    action = result.scalar_one_or_none()

    if action is None:
        raise HTTPException(status_code=404, detail="Action request not found")
    if action.branch_id != current_user.branch_id:
        raise HTTPException(status_code=404, detail="Action request not found")

    if payload.status not in (ActionStatus.APPROVED, ActionStatus.REJECTED):
        raise HTTPException(status_code=400, detail="status must be 'approved' or 'rejected'")

    action.status = payload.status
    action.reviewed_by = current_user.id
    action.hr_notes = payload.hr_notes

    await db.commit()
    await db.refresh(action)
    return action