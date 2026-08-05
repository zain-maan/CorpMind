"""
Shared mixins for all models:
- UUIDPrimaryKeyMixin: every table gets a UUID string as its `id` (not an
  auto-increment int). This is safer for a multi-tenant system — IDs are
  not guessable/sequential across companies.
- TimestampMixin: every table auto-tracks created_at / updated_at.
"""
import uuid
from datetime import datetime

from sqlalchemy import DateTime, String
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func


def generate_uuid() -> str:
    return str(uuid.uuid4())


class UUIDPrimaryKeyMixin:
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
