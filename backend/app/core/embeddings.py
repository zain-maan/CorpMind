from fastembed import TextEmbedding

_embedding_model: TextEmbedding | None = None


def get_embedding_model() -> TextEmbedding:
    """Singleton FastEmbed model — loads once, reused across the app."""
    global _embedding_model
    if _embedding_model is None:
        _embedding_model = TextEmbedding(model_name="BAAI/bge-small-en-v1.5")
    return _embedding_model


def embed_text(text: str) -> list[float]:
    """Embed a single piece of text, returns a 384-dim vector."""
    model = get_embedding_model()
    embeddings = list(model.embed([text]))
    return embeddings[0].tolist()


def embed_texts(texts: list[str]) -> list[list[float]]:
    """Embed a batch of texts — more efficient than one at a time."""
    model = get_embedding_model()
    embeddings = list(model.embed(texts))
    return [e.tolist() for e in embeddings]