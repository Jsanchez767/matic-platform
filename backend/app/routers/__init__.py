"""API routers aggregated for FastAPI app."""

from fastapi import APIRouter

from .workspaces import router as workspaces_router
from .forms import router as forms_router
from .data_tables import router as data_tables_router

api_router = APIRouter()
api_router.include_router(workspaces_router, prefix="/workspaces", tags=["workspaces"])
api_router.include_router(forms_router, prefix="/forms", tags=["forms"])
api_router.include_router(data_tables_router, prefix="/tables", tags=["tables"])
