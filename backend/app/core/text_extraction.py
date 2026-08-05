"""
Extracts plain text from uploaded documents based on file extension.
Supports: .pdf, .docx, .txt
"""
import os

from pypdf import PdfReader
from docx import Document as DocxDocument

def extract_text(storage_path: str) -> str:
    ext = os.path.splitext(storage_path)[1].lower()

    if ext == ".pdf":
        return _extract_pdf(storage_path)
    elif ext == ".docx":
        return _extract_docx(storage_path)
    elif ext == ".txt":
        return _extract_txt(storage_path)
    else:
        raise ValueError(f"Unsupported file type for text extraction: {ext}")


def _extract_pdf(path: str) -> str:
    reader = PdfReader(path)
    pages_text = [page.extract_text() or "" for page in reader.pages]
    return "\n".join(pages_text).strip()


def _extract_docx(path: str) -> str:
    doc = DocxDocument(path)
    paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
    return "\n".join(paragraphs).strip()


def _extract_txt(path: str) -> str:
    with open(path, "r", encoding="utf-8", errors="ignore") as f:
        return f.read().strip()