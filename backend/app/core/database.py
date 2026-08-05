"""
Async SQLAlchemy engine + session.
This is our PostgreSQL connection — used for all relational data
(companies, branches, users, roles, chats, document metadata).

NOTE: Qdrant is a SEPARATE connection (see modules/documents/vector_store.py
in a later phase) — used ONLY for embeddings/semantic search.
"""
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings

engine = create_async_engine(settings.DATABASE_URL, echo=(settings.ENVIRONMENT == "development"))

AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


class Base(DeclarativeBase):
    """Base class every SQLAlchemy model inherits from."""
    pass


async def get_db():
    """FastAPI dependency — yields a DB session per request, auto-closes after."""
    async with AsyncSessionLocal() as session:
        yield session
