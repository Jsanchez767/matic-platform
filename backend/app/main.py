"""FastAPI application entrypoint."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.db.session import engine
from app.models.base import Base
from app.routers import api_router

# Force Render redeploy - Pulse endpoints added in routers/__init__.py
settings = get_settings()

app = FastAPI(
    title="Matic Platform API", 
    version="1.0.2",  # Bumped version to trigger Render redeploy with Pulse endpoints
    debug=settings.debug,
    redirect_slashes=False,  # Disable 307 redirects - use exact paths
)

# Configure CORS - Production + local development origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001", 
        "https://maticsapp.com",
        "https://www.maticsapp.com",
        "https://matic-platform-git-main-jesus-sanchezs-projects-9cb2de52.vercel.app",
        "https://matic-platform-19oudptn8-jesus-sanchezs-projects-9cb2de52.vercel.app",
        # Add new Vercel preview URLs as needed
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
    # Disabled: Supabase schema is managed externally
    # Creating tables on startup can cause connection pool exhaustion
    # async with engine.begin() as conn:
    #     await conn.run_sync(Base.metadata.create_all)
    pass


@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring."""
    return {
        "status": "healthy",
        "service": "Matic Platform API",
        "version": "1.0.0"
    }


app.include_router(api_router, prefix="/api")
