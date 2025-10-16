"""Health check endpoints for monitoring service status."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session

router = APIRouter(prefix="/health", tags=["health"])


@router.get("/")
async def health_check():
    """Basic health check endpoint."""
    return {"status": "healthy", "service": "matic-platform-api"}


@router.get("/database")
async def database_health_check(session: AsyncSession = Depends(get_session)):
    """Check database connectivity and performance."""
    try:
        # Simple query to test connection
        result = await session.execute(text("SELECT 1 as health_check"))
        row = result.fetchone()
        
        if row and row[0] == 1:
            return {"status": "healthy", "database": "connected"}
        else:
            raise HTTPException(status_code=503, detail="Database query failed")
            
    except Exception as e:
        raise HTTPException(
            status_code=503, 
            detail=f"Database connection failed: {str(e)}"
        )


@router.get("/detailed")
async def detailed_health_check(session: AsyncSession = Depends(get_session)):
    """Detailed health check with database and connection pool info."""
    try:
        # Test database connection
        result = await session.execute(text("SELECT version() as db_version"))
        db_version = result.fetchone()[0] if result.rowcount > 0 else "unknown"
        
        # Get basic connection pool info
        from app.db.session import engine
        pool = engine.pool
        
        pool_info = {
            "size": pool.size(),
            "checked_in": pool.checkedin(),
            "checked_out": pool.checkedout(),
            "overflow": pool.overflow(),
        }
        
        return {
            "status": "healthy",
            "database": {
                "connected": True,
                "version": db_version
            },
            "connection_pool": pool_info
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=f"Health check failed: {str(e)}"
        )