"""
Central app configuration.
Loads everything from environment variables (.env file locally).
Every other module should import `settings` from here instead of
reading os.environ directly — keeps config in one place.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str

    # JWT
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # Qdrant (optional for now — required starting Phase 4b when we add
    # embeddings/semantic search; app runs fine without it until then)
    QDRANT_URL: str
    QDRANT_API_KEY: str
    QDRANT_VECTOR_SIZE: int = 384

    # Grok
    GROK_API_KEY: str
    GROK_API_BASE: str = "https://api.x.ai/v1"
    GROK_MODEL: str = "grok-2-latest"

    # App
    ENVIRONMENT: str = "development"
    CORS_ORIGINS: str = "http://localhost:5173"

    # Local file storage (Phase 4a) — where uploaded documents are saved
    # on disk before/alongside being embedded into Qdrant (Phase 4b).
    STORAGE_DIR: str = "storage"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]


settings = Settings()