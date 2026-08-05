from qdrant_client import QdrantClient
from app.core.config import settings

_qdrant_client: QdrantClient | None = None


def get_qdrant_client() -> QdrantClient:
    """Singleton Qdrant client — reused across the app."""
    global _qdrant_client
    if _qdrant_client is None:
        _qdrant_client = QdrantClient(
            url=settings.QDRANT_URL,
            api_key=settings.QDRANT_API_KEY,
        )
    return _qdrant_client