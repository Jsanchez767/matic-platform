"""
Enhanced table links API with real-time capabilities
"""

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import and_, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from pydantic import BaseModel

from ..db.session import get_session
from ..models import DataTable, TableColumn, TableRow
from .realtime import broadcast_table_update

router = APIRouter()

# Enhanced schemas for proper linking
class TableLinkCreate(BaseModel):
    source_table_id: UUID
    source_column_id: UUID
    target_table_id: UUID
    target_column_id: Optional[UUID] = None
    link_type: str = "one_to_many"

class TableLinkRead(BaseModel):
    id: UUID
    source_table_id: UUID
    source_column_id: UUID
    target_table_id: UUID
    target_column_id: Optional[UUID]
    link_type: str

    class Config:
        from_attributes = True

class TableRowLinkCreate(BaseModel):
    link_id: UUID
    source_row_id: UUID
    target_row_id: UUID

class TableRowLinkRead(BaseModel):
    id: UUID
    link_id: UUID
    source_row_id: UUID
    target_row_id: UUID
    target_row: Optional[dict] = None  # Populated with actual row data

    class Config:
        from_attributes = True

class LinkedRecordsResponse(BaseModel):
    records: List[dict]
    total_count: int
    has_more: bool

@router.get("/{table_id}/links", response_model=List[TableLinkRead])
async def get_table_links(
    table_id: UUID,
    session: AsyncSession = Depends(get_session),
):
    """Get all links for a table (where it's source or target)."""
    # Note: This would use proper TableLink model when implemented
    # For now, we'll simulate the response
    return []

@router.post("/{table_id}/links", response_model=TableLinkRead)
async def create_table_link(
    table_id: UUID,
    link_data: TableLinkCreate,
    session: AsyncSession = Depends(get_session),
):
    """Create a new link between tables."""
    # Implementation would create actual TableLink record
    # For now, return mock response
    raise HTTPException(status_code=501, detail="Not implemented - needs TableLink model")

@router.get("/{table_id}/rows/{row_id}/links", response_model=LinkedRecordsResponse)
async def get_row_links(
    table_id: UUID,
    row_id: UUID,
    column_id: Optional[UUID] = None,
    limit: int = 50,
    offset: int = 0,
    session: AsyncSession = Depends(get_session),
):
    """Get linked records for a specific row and column."""
    try:
        # For now, we'll work with the existing JSONB approach
        # but return it in a format that mimics proper relations
        
        stmt = select(TableRow).where(TableRow.id == row_id)
        result = await session.execute(stmt)
        row = result.scalar_one_or_none()
        
        if not row:
            raise HTTPException(status_code=404, detail="Row not found")
        
        # Get the column to find linked table
        if column_id:
            col_stmt = select(TableColumn).where(TableColumn.id == column_id)
            col_result = await session.execute(col_stmt)
            column = col_result.scalar_one_or_none()
            
            if not column or column.column_type != 'link':
                return LinkedRecordsResponse(records=[], total_count=0, has_more=False)
            
            # Get linked record IDs from the row data
            linked_ids = row.data.get(column.name, [])
            if not isinstance(linked_ids, list):
                linked_ids = [linked_ids] if linked_ids else []
            
            # Fetch the actual linked records
            if linked_ids and column.linked_table_id:
                linked_stmt = select(TableRow).where(
                    and_(
                        TableRow.table_id == column.linked_table_id,
                        TableRow.id.in_(linked_ids)
                    )
                ).offset(offset).limit(limit)
                
                linked_result = await session.execute(linked_stmt)
                linked_rows = linked_result.scalars().all()
                
                records = []
                for linked_row in linked_rows:
                    records.append({
                        "id": str(linked_row.id),
                        "data": linked_row.data,
                        "created_at": linked_row.created_at.isoformat(),
                        "updated_at": linked_row.updated_at.isoformat()
                    })
                
                return LinkedRecordsResponse(
                    records=records,
                    total_count=len(records),
                    has_more=len(records) == limit
                )
        
        return LinkedRecordsResponse(records=[], total_count=0, has_more=False)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{table_id}/rows/{row_id}/links")
async def create_row_link(
    table_id: UUID,
    row_id: UUID,
    column_id: UUID,
    target_row_id: UUID,
    session: AsyncSession = Depends(get_session),
):
    """Create a link between two rows."""
    try:
        # Get the source row and column
        row_stmt = select(TableRow).where(TableRow.id == row_id)
        row_result = await session.execute(row_stmt)
        row = row_result.scalar_one_or_none()
        
        if not row:
            raise HTTPException(status_code=404, detail="Row not found")
        
        col_stmt = select(TableColumn).where(TableColumn.id == column_id)
        col_result = await session.execute(col_stmt)
        column = col_result.scalar_one_or_none()
        
        if not column or column.column_type != 'link':
            raise HTTPException(status_code=400, detail="Invalid link column")
        
        # Update the row data to include the new link
        current_links = row.data.get(column.name, [])
        if not isinstance(current_links, list):
            current_links = [current_links] if current_links else []
        
        target_row_id_str = str(target_row_id)
        if target_row_id_str not in current_links:
            current_links.append(target_row_id_str)
            
            # Update the row
            row.data = {**row.data, column.name: current_links}
            await session.commit()
            
            # Broadcast the update
            await broadcast_table_update({
                "type": "row_updated",
                "table_id": str(table_id),
                "row_id": str(row_id),
                "data": row.data,
                "column_id": str(column_id),
                "linked_row_id": target_row_id_str
            })
        
        return {"success": True, "links": current_links}
        
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{table_id}/rows/{row_id}/links/{target_row_id}")
async def remove_row_link(
    table_id: UUID,
    row_id: UUID,
    column_id: UUID,
    target_row_id: UUID,
    session: AsyncSession = Depends(get_session),
):
    """Remove a link between two rows."""
    try:
        # Get the source row and column
        row_stmt = select(TableRow).where(TableRow.id == row_id)
        row_result = await session.execute(row_stmt)
        row = row_result.scalar_one_or_none()
        
        if not row:
            raise HTTPException(status_code=404, detail="Row not found")
        
        col_stmt = select(TableColumn).where(TableColumn.id == column_id)
        col_result = await session.execute(col_stmt)
        column = col_result.scalar_one_or_none()
        
        if not column or column.column_type != 'link':
            raise HTTPException(status_code=400, detail="Invalid link column")
        
        # Update the row data to remove the link
        current_links = row.data.get(column.name, [])
        if not isinstance(current_links, list):
            current_links = [current_links] if current_links else []
        
        target_row_id_str = str(target_row_id)
        if target_row_id_str in current_links:
            current_links.remove(target_row_id_str)
            
            # Update the row
            row.data = {**row.data, column.name: current_links}
            await session.commit()
            
            # Broadcast the update
            await broadcast_table_update({
                "type": "row_updated",
                "table_id": str(table_id),
                "row_id": str(row_id),
                "data": row.data,
                "column_id": str(column_id),
                "unlinked_row_id": target_row_id_str
            })
        
        return {"success": True, "links": current_links}
        
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{table_id}/columns/{column_id}/available-records")
async def get_available_records_for_linking(
    table_id: UUID,
    column_id: UUID,
    search: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    session: AsyncSession = Depends(get_session),
):
    """Get available records from the linked table for a link column."""
    try:
        # Get the column to find the linked table
        col_stmt = select(TableColumn).where(TableColumn.id == column_id)
        col_result = await session.execute(col_stmt)
        column = col_result.scalar_one_or_none()
        
        if not column or column.column_type != 'link' or not column.linked_table_id:
            raise HTTPException(status_code=400, detail="Invalid link column")
        
        # Build query for linked table records
        stmt = select(TableRow).where(TableRow.table_id == column.linked_table_id)
        
        # Add search filter if provided
        if search:
            # Search across all text fields in the data JSONB
            # This is a simplified search - could be enhanced with full-text search
            pass  # TODO: Add JSONB search logic
        
        stmt = stmt.offset(offset).limit(limit)
        result = await session.execute(stmt)
        rows = result.scalars().all()
        
        records = []
        for row in rows:
            # Get display name from first text field
            display_name = None
            for value in row.data.values():
                if isinstance(value, str) and value.strip():
                    display_name = value
                    break
            
            if not display_name:
                display_name = f"Record {str(row.id)[:8]}"
            
            records.append({
                "id": str(row.id),
                "display_name": display_name,
                "data": row.data,
                "created_at": row.created_at.isoformat()
            })
        
        return {
            "records": records,
            "total_count": len(records),
            "has_more": len(records) == limit
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))