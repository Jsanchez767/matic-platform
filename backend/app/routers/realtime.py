"""
Realtime stub - WebSocket functionality removed.
Real-time updates now handled by Supabase Realtime on the frontend.
This file kept for compatibility with existing imports.
"""

from fastapi import APIRouter

router = APIRouter()


async def broadcast_table_update(table_id: str, update_data: dict):
    """
    Stub function for backward compatibility.
    Real-time updates are now handled by Supabase Realtime.
    This function does nothing but prevents import errors.
    """
    pass