"""WebSocket endpoints for real-time table updates."""

import json
from typing import Dict, List
from uuid import UUID

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter()

# In-memory connection store (for demo; use Redis or similar for production)
table_connections: Dict[str, List[WebSocket]] = {}


@router.websocket("/ws/tables/{table_id}")
async def table_updates_ws(websocket: WebSocket, table_id: str):
    """WebSocket endpoint for real-time table updates."""
    await websocket.accept()
    
    # Add connection to table's connection list
    if table_id not in table_connections:
        table_connections[table_id] = []
    table_connections[table_id].append(websocket)
    
    print(f"Client connected to table {table_id}. Total connections: {len(table_connections[table_id])}")
    
    try:
        while True:
            # Wait for a message from client
            data = await websocket.receive_text()
            message = json.loads(data)
            
            print(f"Broadcasting to table {table_id}: {message}")
            
            # Broadcast to all other clients for this table (except sender)
            disconnected_clients = []
            for conn in table_connections[table_id]:
                if conn != websocket:
                    try:
                        await conn.send_text(data)
                    except:
                        # Connection is dead, mark for removal
                        disconnected_clients.append(conn)
            
            # Clean up dead connections
            for dead_conn in disconnected_clients:
                table_connections[table_id].remove(dead_conn)
                
    except WebSocketDisconnect:
        # Remove connection when client disconnects
        table_connections[table_id].remove(websocket)
        print(f"Client disconnected from table {table_id}. Remaining: {len(table_connections[table_id])}")
        
        # Clean up empty table connection lists
        if not table_connections[table_id]:
            del table_connections[table_id]


async def broadcast_table_update(table_id: str, update_data: dict):
    """Helper function to broadcast updates from API endpoints."""
    if table_id in table_connections:
        message = json.dumps(update_data)
        disconnected_clients = []
        
        for conn in table_connections[table_id]:
            try:
                await conn.send_text(message)
            except:
                disconnected_clients.append(conn)
        
        # Clean up dead connections
        for dead_conn in disconnected_clients:
            table_connections[table_id].remove(dead_conn)