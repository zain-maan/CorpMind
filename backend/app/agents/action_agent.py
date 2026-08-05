"""
Detects when an employee's chat message is actually a REQUEST TO TAKE AN
ACTION (draft + submit a leave application or expense request) rather than
a question to be answered from documents — and if so, drafts the content.

This runs BEFORE the document-grounded orchestrator (see
app/modules/chat/router.py) so action requests never get treated as
document Q&A and vice versa.
"""
import json

from app.core.grok_client import call_grok
from app.models.action import ActionType

DETECTION_PROMPT = """You are an intent classifier for a company assistant.
Decide if the user's message is a REQUEST TO TAKE AN ACTION (drafting and
submitting a leave application, or an expense reimbursement request) as
opposed to a QUESTION asking for information.

If it IS an action request, respond with ONLY this JSON:
{"is_action": true, "action_type": "leave" or "expense", "draft": "<a professionally worded draft of the leave application or expense request, written in first person as if the employee is submitting it, based on the details given>"}

If any detail is missing to write a real draft (e.g. leave dates, leave
reason, expense amount, expense purpose), still draft it but use reasonable
bracketed placeholders like [DATE] where information is missing — don't
ask a follow-up question yourself.

If it is NOT an action request (a normal question), respond with ONLY:
{"is_action": false}

Examples:
User: "Can you draft a leave application for 3 days starting Monday, I have a family event"
{"is_action": true, "action_type": "leave", "draft": "Dear HR,\\n\\nI would like to request 3 days of leave starting Monday due to a family event. Kindly approve.\\n\\nThank you."}

User: "What is our leave policy?"
{"is_action": false}

User: "I spent 5000 on a client dinner, can you submit an expense request"
{"is_action": true, "action_type": "expense", "draft": "Dear Finance,\\n\\nI am submitting an expense claim of PKR 5000 for a client dinner. Please review and process reimbursement.\\n\\nThank you."}

User: "Can I expense a client dinner?"
{"is_action": false}

Respond with ONLY the JSON object — no markdown, no explanation.
"""


async def detect_and_draft_action(message: str) -> dict | None:
    """Returns {"action_type": ActionType, "draft": str} or None if this isn't an action request."""
    raw = await call_grok(
        messages=[
            {"role": "system", "content": DETECTION_PROMPT},
            {"role": "user", "content": message},
        ],
        temperature=0.2,
    )

    cleaned = raw.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`")
        if cleaned.lower().startswith("json"):
            cleaned = cleaned[4:]
    cleaned = cleaned.strip()

    print(f"ACTION DETECTOR RAW: {raw!r}")

    try:
        parsed = json.loads(cleaned)
    except json.JSONDecodeError:
        return None

    if not isinstance(parsed, dict) or not parsed.get("is_action"):
        return None

    action_type_raw = parsed.get("action_type", "")
    draft = parsed.get("draft", "")

    if action_type_raw not in (ActionType.LEAVE.value, ActionType.EXPENSE.value) or not draft:
        return None

    return {"action_type": ActionType(action_type_raw), "draft": draft}