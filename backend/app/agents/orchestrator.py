"""
Orchestrator: classifies an incoming question into one or more
KnowledgeDomains, calls the matching specialist agent(s) in parallel,
and merges their answers into one response.

Also handles greetings/small talk (e.g. "hello", "thanks") with a warm,
non-canned reply instead of the generic "couldn't determine department"
fallback, which only fires for genuinely unclear information questions.
"""
import asyncio
import json

from app.agents.specialist_agent import answer_domain_question, stream_domain_answer
from app.core.grok_client import call_grok, call_grok_stream
from app.models.document import KnowledgeDomain

VALID_DOMAINS = [d.value for d in KnowledgeDomain]

CLASSIFIER_PROMPT = f"""You are a routing classifier for a company internal assistant.
Given a user's question, decide which of these domains it relates to:
{VALID_DOMAINS}

Use the CONTENT and INTENT of the question to infer the domain, even if
the user never says the department's name explicitly. Typical signals:
- hr: employees, staff, CVs/resumes, someone's background/skills/education,
  leave, attendance, hiring, onboarding, performance, salary structure
- finance: expenses, reimbursements, invoices, budgets, payroll amounts,
  procurement, vendor payments
- it: software, hardware, accounts/passwords, VPN, network, access requests,
  tickets, devices
- legal: contracts, compliance, policies with legal implications, NDAs,
  disputes, regulations

A question can belong to more than one domain (e.g. "expense reimbursement
for a legal consultation" touches both finance and legal).

Examples (using this company's domain names):
Q: "Who is Zain and what are his technical skills?"
A: ["hr"]

Q: "How much did we spend on office supplies last month?"
A: ["finance"]

Q: "My laptop won't connect to the VPN, who do I contact?"
A: ["it"]

Q: "What does our NDA say about client data retention?"
A: ["legal"]

Q: "What's the weather today?"
A: []

Respond with ONLY a JSON array of the relevant domain names from this list:
{VALID_DOMAINS}
Use the exact same spelling/casing shown in that list. Nothing else — no
explanation, no markdown formatting.
"""

GREETING_CHECK_PROMPT = """Determine if the user's message is a greeting,
small talk, or general chitchat (e.g. "hello", "hi", "how are you",
"thanks", "good morning", "bye") rather than a real question that needs
information looked up from company documents.

Respond with ONLY the single word "true" or "false" — nothing else, no
punctuation, no explanation.
"""

SMALLTALK_SYSTEM_PROMPT = """You are CorpMind, a friendly internal company
assistant. The user just sent a greeting or small talk, not a real
question. Reply warmly and briefly (1-2 sentences). Briefly mention you
can help with HR, Finance, IT, or Legal questions, or draft a leave or
expense request for them. Do not be overly formal or robotic."""


async def is_greeting_or_chitchat(question: str) -> bool:
    raw = await call_grok(
        messages=[
            {"role": "system", "content": GREETING_CHECK_PROMPT},
            {"role": "user", "content": question},
        ],
        temperature=0.0,
    )
    return raw.strip().lower().startswith("true")


async def generate_smalltalk_reply(question: str) -> str:
    return await call_grok(
        messages=[
            {"role": "system", "content": SMALLTALK_SYSTEM_PROMPT},
            {"role": "user", "content": question},
        ],
        temperature=0.6,
    )


async def classify_domains(question: str) -> list[KnowledgeDomain]:
    raw = await call_grok(
        messages=[
            {"role": "system", "content": CLASSIFIER_PROMPT},
            {"role": "user", "content": question},
        ],
        temperature=0.0,
    )

    cleaned = raw.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`")
        if cleaned.lower().startswith("json"):
            cleaned = cleaned[4:]
    cleaned = cleaned.strip()

    print(f"CLASSIFIER RAW: {raw!r}")
    print(f"CLASSIFIER CLEANED: {cleaned!r}")

    try:
        domain_names = json.loads(cleaned)
    except json.JSONDecodeError:
        return []

    if not isinstance(domain_names, list):
        return []

    valid_lookup = {d.value.lower(): d for d in KnowledgeDomain}
    matched = []
    for name in domain_names:
        if isinstance(name, str) and name.lower() in valid_lookup:
            matched.append(valid_lookup[name.lower()])
    return matched


async def route_and_answer(question: str, branch_id: str) -> dict:
    domains = await classify_domains(question)

    if not domains:
        # Before assuming this is an unclear/unanswerable question, check
        # if it's just a greeting/chitchat — those deserve a warm reply,
        # not the "couldn't determine department" fallback.
        if await is_greeting_or_chitchat(question):
            reply = await generate_smalltalk_reply(question)
            return {
                "routed_domains": [],
                "answer": reply,
                "sources": [],
            }

        return {
            "routed_domains": [],
            "answer": "I couldn't determine which department this question relates to. Could you rephrase it or specify HR, Finance, IT, or Legal?",
            "sources": [],
        }

    results = await asyncio.gather(
        *[answer_domain_question(question, domain, branch_id) for domain in domains]
    )

    if len(results) == 1:
        r = results[0]
        return {
            "routed_domains": [r["domain"]],
            "answer": r["answer"],
            "sources": r["sources"],
        }

    merged_answer = "\n\n".join(
        f"**{r['domain']}:**\n{r['answer']}" for r in results
    )
    merged_sources = [s for r in results for s in r["sources"]]

    return {
        "routed_domains": [r["domain"] for r in results],
        "answer": merged_answer,
        "sources": merged_sources,
    }


async def stream_generate_smalltalk_reply(question: str):
    """Streaming variant of generate_smalltalk_reply. Same prompt/temperature."""
    full_text = ""
    async for delta in call_grok_stream(
        messages=[
            {"role": "system", "content": SMALLTALK_SYSTEM_PROMPT},
            {"role": "user", "content": question},
        ],
        temperature=0.6,
    ):
        full_text += delta
        yield {"type": "token", "text": delta}
    yield {"type": "done", "answer": full_text}


async def stream_route_and_answer(question: str, branch_id: str):
    """
    Streaming variant of route_and_answer. Classification logic
    (classify_domains / is_greeting_or_chitchat) is IDENTICAL to the
    non-streaming version — those calls still need a full JSON/text
    response before they can be parsed, so they are not streamed.

    Only the final answer generation is streamed token-by-token to the
    caller. Yields {"type": "token", "text": ...} events as text is
    generated, and a final {"type": "complete", "routed_domains": [...],
    "answer": ..., "sources": [...]} event shaped exactly like the return
    value of route_and_answer().

    NOTE: route_and_answer() runs multi-domain answers in parallel via
    asyncio.gather(). To forward real tokens to the client as they're
    generated (instead of waiting for everything to finish), multi-domain
    answers are generated one domain at a time here instead of in
    parallel. Prompts, retrieval, and the final merged answer format are
    unchanged.
    """
    domains = await classify_domains(question)

    if not domains:
        if await is_greeting_or_chitchat(question):
            full_text = ""
            async for event in stream_generate_smalltalk_reply(question):
                if event["type"] == "token":
                    yield event
                else:
                    full_text = event["answer"]
            yield {
                "type": "complete",
                "routed_domains": [],
                "answer": full_text,
                "sources": [],
            }
            return

        fallback = (
            "I couldn't determine which department this question relates to. "
            "Could you rephrase it or specify HR, Finance, IT, or Legal?"
        )
        yield {"type": "token", "text": fallback}
        yield {
            "type": "complete",
            "routed_domains": [],
            "answer": fallback,
            "sources": [],
        }
        return

    results = []
    for i, domain in enumerate(domains):
        if len(domains) > 1:
            header = f"**{domain.value}:**\n" if i == 0 else f"\n\n**{domain.value}:**\n"
            yield {"type": "token", "text": header}

        async for event in stream_domain_answer(question, domain, branch_id):
            if event["type"] == "token":
                yield event
            else:
                results.append(event)

    if len(results) == 1:
        r = results[0]
        yield {
            "type": "complete",
            "routed_domains": [r["domain"]],
            "answer": r["answer"],
            "sources": r["sources"],
        }
        return

    merged_answer = "\n\n".join(
        f"**{r['domain']}:**\n{r['answer']}" for r in results
    )
    merged_sources = [s for r in results for s in r["sources"]]

    yield {
        "type": "complete",
        "routed_domains": [r["domain"] for r in results],
        "answer": merged_answer,
        "sources": merged_sources,
    }