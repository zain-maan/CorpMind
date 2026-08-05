"""
A specialist agent for one KnowledgeDomain. Retrieves chunks from ONLY
its own domain's Qdrant collection and answers strictly grounded in
that context — never from general knowledge, never from other domains.
"""
from app.core.grok_client import call_grok, call_grok_stream
from app.core.retrieval import retrieve_chunks
from app.models.document import KnowledgeDomain

SYSTEM_PROMPT = """You are a {domain} policy assistant for a company.
Answer the user's question using ONLY the context provided below.
Do not use outside knowledge. If the context does not contain enough
information to answer, say clearly that you could not find relevant
information in the {domain} documents.
Always mention which document title(s) your answer is based on.

CONTEXT:
{context}
"""


async def answer_domain_question(question: str, domain: KnowledgeDomain, branch_id: str) -> dict:
    chunks = await retrieve_chunks(question, domain, branch_id, top_k=5)

    if not chunks:
        return {
            "domain": domain.value,
            "answer": f"I couldn't find any relevant information in the {domain.value} documents.",
            "sources": [],
        }

    context = "\n\n".join(
        f"[Source: {c['title']}]\n{c['chunk_text']}" for c in chunks
    )

    system_prompt = SYSTEM_PROMPT.format(domain=domain.value, context=context)

    answer = await call_grok(
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": question},
        ]
    )

    sources = [
        {"title": c["title"], "document_id": c["document_id"]} for c in chunks
    ]

    return {"domain": domain.value, "answer": answer, "sources": sources}


async def stream_domain_answer(question: str, domain: KnowledgeDomain, branch_id: str):
    """
    Streaming variant of answer_domain_question. Same retrieval, same
    grounding, same SYSTEM_PROMPT — only the generation call is streamed.

    Yields {"type": "token", "text": <delta>} events as text arrives, then
    a final {"type": "done", "domain": ..., "answer": <full text>,
    "sources": [...]} event once the response is complete.
    """
    chunks = await retrieve_chunks(question, domain, branch_id, top_k=5)

    if not chunks:
        full_answer = f"I couldn't find any relevant information in the {domain.value} documents."
        yield {"type": "token", "text": full_answer}
        yield {
            "type": "done",
            "domain": domain.value,
            "answer": full_answer,
            "sources": [],
        }
        return

    context = "\n\n".join(
        f"[Source: {c['title']}]\n{c['chunk_text']}" for c in chunks
    )

    system_prompt = SYSTEM_PROMPT.format(domain=domain.value, context=context)

    full_answer = ""
    async for delta in call_grok_stream(
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": question},
        ]
    ):
        full_answer += delta
        yield {"type": "token", "text": delta}

    sources = [
        {"title": c["title"], "document_id": c["document_id"]} for c in chunks
    ]

    yield {
        "type": "done",
        "domain": domain.value,
        "answer": full_answer,
        "sources": sources,
    }