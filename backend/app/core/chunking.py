"""
Splits extracted text into overlapping word-based chunks.
Overlap helps avoid cutting a relevant sentence exactly at a chunk boundary.
"""


def chunk_text(text: str, chunk_size: int = 300, overlap: int = 50) -> list[str]:
    """
    chunk_size and overlap are in WORDS, not characters.
    e.g. chunk_size=300, overlap=50 -> each chunk shares its last 50 words
    with the start of the next chunk.
    """
    words = text.split()
    if not words:
        return []

    chunks = []
    start = 0
    while start < len(words):
        end = start + chunk_size
        chunk = " ".join(words[start:end])
        chunks.append(chunk)
        if end >= len(words):
            break
        start = end - overlap

    return chunks