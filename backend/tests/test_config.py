from app.core.config import get_settings


def test_settings_defaults():
    settings = get_settings()
    assert settings.database_url.startswith("postgresql+asyncpg://")
    assert settings.debug is False
