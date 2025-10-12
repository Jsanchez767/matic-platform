"""Database engine and session factory."""

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import get_settings

_settings = get_settings()

engine = create_async_engine(
    _settings.database_url,
    echo=_settings.debug,
    future=True,
    pool_size=3,  # Limit connections for Supabase Session mode
    max_overflow=2,  # Allow 2 extra connections if needed
    pool_pre_ping=True,  # Verify connections before use
    pool_recycle=3600,  # Recycle connections after 1 hour
    connect_args={
        "ssl": "require",
        "server_settings": {
            "application_name": "matic-platform"
        }
    }
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_session() -> AsyncSession:
    """Yield a SQLAlchemy session for FastAPI dependencies."""

    async with AsyncSessionLocal() as session:
        yield session
