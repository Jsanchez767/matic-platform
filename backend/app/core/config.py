"""Application configuration helpers."""

from functools import lru_cache
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Load runtime settings from environment variables."""

    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/matic"
    debug: bool = False
    environment: str = "development"  # development, production
    supabase_url: str = ""
    supabase_anon_key: str = ""

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8"
    }


@lru_cache
def get_settings() -> Settings:
    """Return a cached settings instance."""

    return Settings()
