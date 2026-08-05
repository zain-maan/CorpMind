"""
Retrieves the top-k most relevant chunks for a question from a single
domain's Qdrant collection — scoped to the caller's branch_id, so a
user never gets context from another branch's documents.
"""
from qdrant_client.models import Filter, FieldCondition, MatchValue

from app.core.embeddings import embed_text
from app.core.qdrant_client import get_qdrant_client
from app.models.document import KnowledgeDomain


async def retrieve_chunks(
    query: str,
    domain: KnowledgeDomain,
    branch_id: str,
    top_k: int = 5,
) -> list[dict]:
    vector = embed_text(query)
    collection_name = f"corpmind_{domain.value.lower()}"
    client = get_qdrant_client()

    results = client.query_points(
        collection_name=collection_name,
        query=vector,
        query_filter=Filter(
            must=[FieldCondition(key="branch_id", match=MatchValue(value=branch_id))]
        ),
        limit=top_k,
    ).points

    return [
        {
            "chunk_text": r.payload.get("chunk_text", ""),
            "title": r.payload.get("title", "Untitled"),
            "document_id": r.payload.get("document_id"),
            "score": r.score,
        }
        for r in results
    ]