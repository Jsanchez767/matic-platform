"""Database engine and session factory."""

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import get_settings

_settings = get_settings()

# Environment-aware database configuration
if _settings.environment == "production":
    # Production settings for Supabase Session mode
    engine_kwargs = {
        "pool_size": 1,
        "max_overflow": 0,
        "pool_recycle": 300,  # 5 minutes
        "pool_timeout": 10,
        "connect_args": {
            "ssl": "require",
            "server_settings": {"application_name": "matic-platform"},
            "command_timeout": 5,
            "connect_timeout": 10,
        }
    }
else:
    # Development settings - more lenient
    engine_kwargs = {
        "pool_size": 3,
        "max_overflow": 2,
        "pool_recycle": 3600,  # 1 hour
        "pool_timeout": 30,
        "connect_args": {
            "ssl": "require" if "amazonaws.com" in _settings.database_url or "supabase.co" in _settings.database_url else "prefer",
            "server_settings": {"application_name": "matic-platform"},
        }
    }

engine = create_async_engine(
    _settings.database_url,
    echo=_settings.debug,
    future=True,
    pool_pre_ping=True,
    **engine_kwargs
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_session() -> AsyncSession:
    """Yield a SQLAlchemy session for FastAPI dependencies."""
    
    session = AsyncSessionLocal()
    try:
        yield session
        await session.commit()
    except Exception:
        await session.rollback()
        raise
    finally:
        await session.close()
