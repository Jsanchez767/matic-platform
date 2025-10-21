"""Endpoints for barcode scan history."""

from __future__ import annotations

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..db.session import get_session
from ..models import DataTable, ScanHistory, TableColumn
from ..schemas import ScanHistoryCreate, ScanHistoryRead

router = APIRouter(prefix="/scans", tags=["scans"])


@router.post("/", response_model=ScanHistoryRead)
async def create_scan_history(
    payload: ScanHistoryCreate,
    session: AsyncSession = Depends(get_session),
) -> ScanHistory:
    table = await session.get(DataTable, payload.table_id)
    if not table:
        raise HTTPException(status_code=404, detail="Table not found")

    if table.workspace_id != payload.workspace_id:
        raise HTTPException(status_code=400, detail="Workspace mismatch for table")

    if payload.column_id:
        column = await session.get(TableColumn, payload.column_id)
        if not column:
            raise HTTPException(status_code=404, detail="Column not found")
        if column.table_id != payload.table_id:
            raise HTTPException(status_code=400, detail="Column does not belong to table")

    scan = ScanHistory(
        workspace_id=payload.workspace_id,
        table_id=payload.table_id,
        column_id=payload.column_id,
        column_name=payload.column_name,
        barcode=payload.barcode,
        status=payload.status.value if hasattr(payload.status, "value") else payload.status,
        matched_row_ids=payload.matched_row_ids,
        matched_rows=payload.matched_rows,
        source=payload.source,
        metadata_=payload.metadata,
        created_by=payload.created_by,
    )

    session.add(scan)
    await session.commit()
    await session.refresh(scan)
    return scan


@router.get("/", response_model=List[ScanHistoryRead])
async def list_scan_history(
    table_id: UUID = Query(..., description="Table to retrieve history for"),
    column_id: Optional[UUID] = Query(None, description="Filter by column id"),
    column_name: Optional[str] = Query(None, description="Fallback filter using column name"),
    limit: int = Query(100, ge=1, le=500),
    session: AsyncSession = Depends(get_session),
) -> List[ScanHistory]:
    stmt = select(ScanHistory).where(ScanHistory.table_id == table_id)

    if column_id:
        stmt = stmt.where(ScanHistory.column_id == column_id)
    elif column_name:
        stmt = stmt.where(ScanHistory.column_name == column_name)

    stmt = stmt.order_by(ScanHistory.created_at.desc()).limit(limit)

    result = await session.execute(stmt)
    return result.scalars().all()
