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
    # redirect_slashes=True is the default, so we don't need to disable it
)

# Configure CORS - Allow specific origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://maticsapp.com",
        "https://www.maticsapp.com",
        "https://matic-platform-git-main-jesus-sanchezs-projects-9cb2de52.vercel.app",
        "https://matic-platform-19oudptn8-jesus-sanchezs-projects-9cb2de52.vercel.app",
        "http://localhost:3000",
    ],
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
