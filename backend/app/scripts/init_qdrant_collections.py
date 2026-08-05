"""
One-time setup script: creates the 4 domain collections in Qdrant,
plus a payload index on branch_id so we can filter by it during search.
Run manually with: python -m app.scripts.init_qdrant_collections
"""
from qdrant_client.models import Distance, VectorParams, PayloadSchemaType

from app.core.qdrant_client import get_qdrant_client
from app.core.config import settings

DOMAIN_COLLECTIONS = ["hr", "finance", "it", "legal"]


def init_collections():
    client = get_qdrant_client()
    existing = {c.name for c in client.get_collections().collections}

    for domain in DOMAIN_COLLECTIONS:
        collection_name = f"corpmind_{domain}"

        if collection_name not in existing:
            client.create_collection(
                collection_name=collection_name,
                vectors_config=VectorParams(
                    size=settings.QDRANT_VECTOR_SIZE,
                    distance=Distance.COSINE,
                ),
            )
            print(f"✨ Created collection '{collection_name}'.")
        else:
            print(f"✅ Collection '{collection_name}' already exists — skipping creation.")

        # Create (or confirm) a keyword index on branch_id — required
        # for filtering by branch_id in query_points(). Safe to call
        # even if it already exists.
        client.create_payload_index(
            collection_name=collection_name,
            field_name="branch_id",
            field_schema=PayloadSchemaType.KEYWORD,
        )
        print(f"🔑 Ensured index on 'branch_id' for '{collection_name}'.")


if __name__ == "__main__":
    init_collections()
    print("Done — all domain collections ready.")