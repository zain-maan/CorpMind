"""
Phase 6/8: real chat API + action-request detection.

Every conversation belongs to exactly one user. Every read/write below
checks conversation.user_id == current_user.id explicitly — there is
no super_admin bypass anywhere in this file, on purpose (see the
privacy note in app/models/chat.py).

Phase 8 addition: before routing a message to the document-grounded
orchestrator, we first check whether it's actually an ACTION request
(draft + submit a leave/expense request) rather than a question. If so,
we create an ActionRequest row (routed to HR for review) instead of
searching documents.
"""
import json

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.agents.action_agent import detect_and_draft_action
from app.agents.orchestrator import route_and_answer, stream_route_and_answer
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.action import ActionRequest, ActionStatus
from app.models.chat import Conversation, Message, MessageRole
from app.models.user import User
from app.schemas.chat import (
    AskRequest,
    ConversationCreateRequest,
    ConversationDetailResponse,
    ConversationResponse,
)

router = APIRouter()


def _sse(event: str, data: dict) -> str:
    """Format one Server-Sent Event frame."""
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"


async def _get_owned_conversation(
    conversation_id: str, current_user: User, db: AsyncSession
) -> Conversation:
    """Fetch a conversation and hard-fail if it doesn't belong to current_user."""
    result = await db.execute(
        select(Conversation)
        .options(selectinload(Conversation.messages))
        .where(Conversation.id == conversation_id)
    )
    conversation = result.scalar_one_or_none()

    if conversation is None:
        raise HTTPException(status_code=404, detail="Conversation not found")
    if conversation.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Conversation not found")

    return conversation


@router.post("/conversations", response_model=ConversationResponse, status_code=status.HTTP_201_CREATED)
async def create_conversation(
    request: ConversationCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conversation = Conversation(
        user_id=current_user.id,
        title=request.title or "New chat",
    )
    db.add(conversation)
    await db.commit()
    await db.refresh(conversation)
    return conversation


@router.get("/conversations", response_model=list[ConversationResponse])
async def list_conversations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Conversation)
        .where(Conversation.user_id == current_user.id)
        .order_by(Conversation.updated_at.desc())
    )
    return result.scalars().all()


@router.get("/conversations/{conversation_id}", response_model=ConversationDetailResponse)
async def get_conversation(
    conversation_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conversation = await _get_owned_conversation(conversation_id, current_user, db)
    return conversation


@router.delete("/conversations/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_conversation(
    conversation_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conversation = await _get_owned_conversation(conversation_id, current_user, db)
    await db.delete(conversation)
    await db.commit()


@router.post("/conversations/{conversation_id}/messages", response_model=ConversationDetailResponse)
async def ask_in_conversation(
    conversation_id: str,
    request: AskRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conversation = await _get_owned_conversation(conversation_id, current_user, db)

    user_message = Message(
        conversation_id=conversation.id,
        role=MessageRole.USER,
        content=request.question,
    )
    db.add(user_message)

    # Phase 8: check if this is an action request (draft leave/expense)
    # BEFORE treating it as a document-grounded question.
    action = await detect_and_draft_action(request.question)

    if action is not None:
        if not current_user.branch_id:
            answer_text = (
                "I can draft that, but your account isn't linked to a branch, "
                "so I can't route it to HR. Please contact your admin."
            )
            routed_domains = ["action"]
            sources = []
        else:
            # NOTE: no ActionRequest row is created here anymore. The draft is
            # only carried inside this message's `sources` field until the
            # employee explicitly confirms it via POST /api/actions.
            answer_text = (
                f"I've drafted your {action['action_type'].value} request. "
                f"Review it below and send it to HR when you're ready."
            )
            routed_domains = ["action"]
            sources = [
                {
                    "kind": "pending_action",
                    "action_type": action["action_type"].value,
                    "draft_content": action["draft"],
                }
            ]

        assistant_message = Message(
            conversation_id=conversation.id,
            role=MessageRole.ASSISTANT,
            content=answer_text,
            routed_domains=routed_domains,
            sources=sources,
        )
        db.add(assistant_message)
    else:
        result = await route_and_answer(request.question, current_user.branch_id)

        assistant_message = Message(
            conversation_id=conversation.id,
            role=MessageRole.ASSISTANT,
            content=result["answer"],
            routed_domains=result["routed_domains"],
            sources=result["sources"],
        )
        db.add(assistant_message)

    # auto-title a fresh conversation from its first question
    if conversation.title == "New chat":
        conversation.title = request.question[:80]

    await db.commit()
    result_row = await db.execute(
        select(Conversation)
        .options(selectinload(Conversation.messages))
        .where(Conversation.id == conversation.id)
    )
    conversation = result_row.scalar_one()
    return conversation


@router.post("/conversations/{conversation_id}/messages/stream")
async def ask_in_conversation_stream(
    conversation_id: str,
    request: AskRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Streaming (SSE) twin of POST /conversations/{id}/messages.

    Same action-detection-before-orchestrator logic, same DB writes, same
    auto-title behaviour. The only difference: instead of returning one
    JSON blob after everything finishes, this streams `token` events to
    the client as Grok generates them, then a final `done` event carrying
    the full updated conversation (same shape as ConversationDetailResponse)
    once the assistant message has been saved.

    Event stream:
      event: token   data: {"text": "..."}          (zero or more)
      event: done    data: {...ConversationDetailResponse...}
      event: error   data: {"detail": "..."}         (on failure)
    """
    conversation = await _get_owned_conversation(conversation_id, current_user, db)

    user_message = Message(
        conversation_id=conversation.id,
        role=MessageRole.USER,
        content=request.question,
    )
    db.add(user_message)
    # Commit the user's message right away, before we return the
    # StreamingResponse. Why this matters: FastAPI closes the `get_db()`
    # dependency (the `async with AsyncSessionLocal() as session:` block)
    # as soon as this endpoint *function* returns — which happens the
    # moment we `return StreamingResponse(...)`, i.e. BEFORE Starlette
    # actually starts iterating `event_generator()` to stream the body.
    # If `user_message` is left uncommitted at that point, closing the
    # session rolls it back and it's silently lost — while the assistant
    # message added later, inside the generator, still goes through fine
    # because the (reused) session just opens a fresh transaction for it.
    # Net effect: the user's own message vanishes and only the reply shows.
    # Committing here makes the user's message durable no matter what
    # happens to the session afterwards.
    await db.commit()

    # Phase 8: check if this is an action request (draft leave/expense)
    # BEFORE treating it as a document-grounded question — identical to
    # the non-streaming endpoint. This isn't token-streamed itself since
    # it's a single JSON detection/draft call, not a chat reply.
    action = await detect_and_draft_action(request.question)

    async def event_generator():
        try:
            if action is not None:
                if not current_user.branch_id:
                    answer_text = (
                        "I can draft that, but your account isn't linked to a branch, "
                        "so I can't route it to HR. Please contact your admin."
                    )
                    routed_domains = ["action"]
                    sources = []
                else:
                    # NOTE: no ActionRequest row is created here anymore. The draft
                    # is only carried inside this message's `sources` field until
                    # the employee explicitly confirms it via POST /api/actions.
                    answer_text = (
                        f"I've drafted your {action['action_type'].value} request. "
                        f"Review it below and send it to HR when you're ready."
                    )
                    routed_domains = ["action"]
                    sources = [
                        {
                            "kind": "pending_action",
                            "action_type": action["action_type"].value,
                            "draft_content": action["draft"],
                        }
                    ]

                yield _sse("token", {"text": answer_text})

                assistant_message = Message(
                    conversation_id=conversation.id,
                    role=MessageRole.ASSISTANT,
                    content=answer_text,
                    routed_domains=routed_domains,
                    sources=sources,
                )
                db.add(assistant_message)
            else:
                final = None
                async for event in stream_route_and_answer(request.question, current_user.branch_id):
                    if event["type"] == "token":
                        yield _sse("token", {"text": event["text"]})
                    elif event["type"] == "complete":
                        final = event

                assistant_message = Message(
                    conversation_id=conversation.id,
                    role=MessageRole.ASSISTANT,
                    content=final["answer"],
                    routed_domains=final["routed_domains"],
                    sources=final["sources"],
                )
                db.add(assistant_message)

            # auto-title a fresh conversation from its first question
            if conversation.title == "New chat":
                conversation.title = request.question[:80]

            await db.commit()

            result_row = await db.execute(
                select(Conversation)
                .options(selectinload(Conversation.messages))
                .where(Conversation.id == conversation.id)
            )
            updated_conversation = result_row.scalar_one()
            payload = ConversationDetailResponse.model_validate(updated_conversation)

            yield _sse("done", json.loads(payload.model_dump_json()))
        except Exception as e:
            await db.rollback()
            yield _sse("error", {"detail": str(e)})

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )