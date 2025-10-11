"""FastAPI application entrypoint."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.db.session import engine
from app.models.base import Base
from app.routers import api_router

settings = get_settings()

app = FastAPI(
    title="Matic Platform API", 
    debug=settings.debug,
    redirect_slashes=False  # Disable automatic slash redirects
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https://.*\.vercel\.app|https://maticsapp\.com|http://localhost:\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)


@app.on_event("startup")
async def on_startup() -> None:
    """Ensure database schema exists on startup."""

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


app.include_router(api_router, prefix="/api")
