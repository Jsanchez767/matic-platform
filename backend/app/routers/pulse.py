"""
Pulse Module Router
Event check-in API endpoints
"""

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..db.session import get_session
from ..models.pulse import PulseEnabledTable, PulseCheckIn, PulseScannerSession
from ..schemas.pulse import (
    PulseEnabledTableCreate,
    PulseEnabledTableRead,
    PulseEnabledTableUpdate,
    PulseCheckInCreate,
    PulseCheckInRead,
    PulseScannerSessionCreate,
    PulseScannerSessionRead,
    PulseScannerSessionUpdate,
    PulseDashboardStats,
)

router = APIRouter(prefix="/pulse", tags=["pulse"])


# ============================================================================
# PULSE ENABLED TABLES - Configuration endpoints
# ============================================================================

@router.post("", response_model=PulseEnabledTableRead)
async def enable_pulse(
    config: PulseEnabledTableCreate,
    session: AsyncSession = Depends(get_session),
):
    """Enable Pulse check-in on a data table"""
    # Check if already enabled
    stmt = select(PulseEnabledTable).where(PulseEnabledTable.table_id == config.table_id)
    result = await session.execute(stmt)
    existing = result.scalar_one_or_none()
    
    if existing:
        raise HTTPException(status_code=400, detail="Pulse already enabled for this table")
    
    # Create configuration
    pulse_table = PulseEnabledTable(
        table_id=config.table_id,
        workspace_id=config.workspace_id,
        check_in_column_id=config.check_in_column_id,
        display_columns=config.display_columns,
        settings=config.settings.dict() if config.settings else None,
    )
    session.add(pulse_table)
    await session.commit()
    await session.refresh(pulse_table)
    
    return pulse_table


@router.get("/{table_id}", response_model=PulseEnabledTableRead)
async def get_pulse_config(
    table_id: UUID,
    session: AsyncSession = Depends(get_session),
):
    """Get Pulse configuration for a table"""
    stmt = select(PulseEnabledTable).where(PulseEnabledTable.table_id == table_id)
    result = await session.execute(stmt)
    pulse_table = result.scalar_one_or_none()
    
    if not pulse_table:
        raise HTTPException(status_code=404, detail="Pulse not enabled for this table")
    
    return pulse_table


@router.patch("/{table_id}", response_model=PulseEnabledTableRead)
async def update_pulse_config(
    table_id: UUID,
    updates: PulseEnabledTableUpdate,
    session: AsyncSession = Depends(get_session),
):
    """Update Pulse configuration"""
    stmt = select(PulseEnabledTable).where(PulseEnabledTable.table_id == table_id)
    result = await session.execute(stmt)
    pulse_table = result.scalar_one_or_none()
    
    if not pulse_table:
        raise HTTPException(status_code=404, detail="Pulse not enabled for this table")
    
    # Update fields
    if updates.enabled is not None:
        pulse_table.enabled = updates.enabled
    if updates.check_in_column_id is not None:
        pulse_table.check_in_column_id = updates.check_in_column_id
    if updates.display_columns is not None:
        pulse_table.display_columns = updates.display_columns
    if updates.settings is not None:
        pulse_table.settings = updates.settings.dict()
    
    pulse_table.updated_at = datetime.utcnow()
    
    await session.commit()
    await session.refresh(pulse_table)
    
    return pulse_table


@router.delete("/{table_id}")
async def disable_pulse(
    table_id: UUID,
    session: AsyncSession = Depends(get_session),
):
    """Disable Pulse for a table (cascade deletes check-ins and sessions)"""
    stmt = select(PulseEnabledTable).where(PulseEnabledTable.table_id == table_id)
    result = await session.execute(stmt)
    pulse_table = result.scalar_one_or_none()
    
    if not pulse_table:
        raise HTTPException(status_code=404, detail="Pulse not enabled for this table")
    
    await session.delete(pulse_table)
    await session.commit()
    
    return {"message": "Pulse disabled successfully"}


# ============================================================================
# CHECK-INS - Core check-in endpoints
# ============================================================================

@router.post("/check-ins", response_model=PulseCheckInRead)
async def create_check_in(
    check_in: PulseCheckInCreate,
    session: AsyncSession = Depends(get_session),
):
    """Create a check-in event (for scanner)"""
    # Verify Pulse is enabled
    stmt = select(PulseEnabledTable).where(PulseEnabledTable.id == check_in.pulse_table_id)
    result = await session.execute(stmt)
    pulse_table = result.scalar_one_or_none()
    
    if not pulse_table or not pulse_table.enabled:
        raise HTTPException(status_code=400, detail="Pulse not enabled for this table")
    
    # Check for duplicate scans
    if not pulse_table.settings.get("allow_duplicate_scans", False):
        stmt = select(PulseCheckIn).where(
            and_(
                PulseCheckIn.pulse_table_id == check_in.pulse_table_id,
                PulseCheckIn.row_id == check_in.row_id
            )
        )
        result = await session.execute(stmt)
        existing = result.scalar_one_or_none()
        
        if existing:
            # Update check-in count
            existing.check_in_count += 1
            existing.check_in_time = datetime.utcnow()
            await session.commit()
            await session.refresh(existing)
            return existing
    
    # Create new check-in
    new_check_in = PulseCheckIn(
        pulse_table_id=check_in.pulse_table_id,
        table_id=check_in.table_id,
        row_id=check_in.row_id,
        barcode_scanned=check_in.barcode_scanned,
        scanner_user_name=check_in.scanner_user_name,
        scanner_user_email=check_in.scanner_user_email,
        scanner_device_id=check_in.scanner_device_id,
        row_data=check_in.row_data,
        is_walk_in=check_in.is_walk_in,
        notes=check_in.notes,
    )
    session.add(new_check_in)
    await session.commit()
    await session.refresh(new_check_in)
    
    # Note: update_pulse_stats() trigger will automatically update cached stats
    
    return new_check_in


@router.get("/check-ins", response_model=List[PulseCheckInRead])
async def get_check_ins(
    table_id: UUID,
    limit: int = Query(100, le=500),
    offset: int = Query(0, ge=0),
    session: AsyncSession = Depends(get_session),
):
    """Get check-ins for a table (paginated, most recent first)"""
    stmt = (
        select(PulseCheckIn)
        .where(PulseCheckIn.table_id == table_id)
        .order_by(PulseCheckIn.check_in_time.desc())
        .limit(limit)
        .offset(offset)
    )
    result = await session.execute(stmt)
    check_ins = result.scalars().all()
    
    return check_ins


@router.get("/check-ins/{check_in_id}", response_model=PulseCheckInRead)
async def get_check_in(
    check_in_id: UUID,
    session: AsyncSession = Depends(get_session),
):
    """Get a specific check-in"""
    stmt = select(PulseCheckIn).where(PulseCheckIn.id == check_in_id)
    result = await session.execute(stmt)
    check_in = result.scalar_one_or_none()
    
    if not check_in:
        raise HTTPException(status_code=404, detail="Check-in not found")
    
    return check_in


# ============================================================================
# SCANNER SESSIONS - Mobile scanner management
# ============================================================================

@router.post("/sessions", response_model=PulseScannerSessionRead)
async def create_scanner_session(
    session_data: PulseScannerSessionCreate,
    session: AsyncSession = Depends(get_session),
):
    """Create a scanner session (for mobile scanner pairing)"""
    scanner_session = PulseScannerSession(
        pulse_table_id=session_data.pulse_table_id,
        pairing_code=session_data.pairing_code,
        scanner_name=session_data.scanner_name,
        scanner_email=session_data.scanner_email,
        device_id=session_data.device_id,
    )
    session.add(scanner_session)
    await session.commit()
    await session.refresh(scanner_session)
    
    return scanner_session


@router.get("/sessions", response_model=List[PulseScannerSessionRead])
async def get_scanner_sessions(
    table_id: UUID,
    active_only: bool = Query(False),
    session: AsyncSession = Depends(get_session),
):
    """Get scanner sessions for a table"""
    # Get pulse_table_id first
    stmt = select(PulseEnabledTable.id).where(PulseEnabledTable.table_id == table_id)
    result = await session.execute(stmt)
    pulse_table_id = result.scalar_one_or_none()
    
    if not pulse_table_id:
        raise HTTPException(status_code=404, detail="Pulse not enabled for this table")
    
    stmt = select(PulseScannerSession).where(
        PulseScannerSession.pulse_table_id == pulse_table_id
    )
    
    if active_only:
        stmt = stmt.where(PulseScannerSession.is_active == True)
    
    stmt = stmt.order_by(PulseScannerSession.started_at.desc())
    
    result = await session.execute(stmt)
    sessions = result.scalars().all()
    
    return sessions


@router.patch("/sessions/{session_id}", response_model=PulseScannerSessionRead)
async def update_scanner_session(
    session_id: UUID,
    updates: PulseScannerSessionUpdate,
    session: AsyncSession = Depends(get_session),
):
    """Update a scanner session (e.g., end session)"""
    stmt = select(PulseScannerSession).where(PulseScannerSession.id == session_id)
    result = await session.execute(stmt)
    scanner_session = result.scalar_one_or_none()
    
    if not scanner_session:
        raise HTTPException(status_code=404, detail="Scanner session not found")
    
    if updates.is_active is not None:
        scanner_session.is_active = updates.is_active
        if not updates.is_active:
            scanner_session.ended_at = datetime.utcnow()
    
    if updates.total_scans is not None:
        scanner_session.total_scans = updates.total_scans
    
    if updates.last_scan_at is not None:
        scanner_session.last_scan_at = updates.last_scan_at
    
    await session.commit()
    await session.refresh(scanner_session)
    
    return scanner_session


# ============================================================================
# DASHBOARD - Real-time stats endpoint
# ============================================================================

@router.get("/dashboard/{table_id}", response_model=PulseDashboardStats)
async def get_dashboard_stats(
    table_id: UUID,
    recent_limit: int = Query(10, le=50),
    session: AsyncSession = Depends(get_session),
):
    """Get real-time dashboard statistics"""
    # Get Pulse config with cached stats
    stmt = select(PulseEnabledTable).where(PulseEnabledTable.table_id == table_id)
    result = await session.execute(stmt)
    pulse_table = result.scalar_one_or_none()
    
    if not pulse_table:
        raise HTTPException(status_code=404, detail="Pulse not enabled for this table")
    
    # Get active scanner count
    stmt = select(func.count(PulseScannerSession.id)).where(
        and_(
            PulseScannerSession.pulse_table_id == pulse_table.id,
            PulseScannerSession.is_active == True
        )
    )
    result = await session.execute(stmt)
    active_scanners = result.scalar() or 0
    
    # Get recent check-ins
    stmt = (
        select(PulseCheckIn)
        .where(PulseCheckIn.pulse_table_id == pulse_table.id)
        .order_by(PulseCheckIn.check_in_time.desc())
        .limit(recent_limit)
    )
    result = await session.execute(stmt)
    recent_check_ins = result.scalars().all()
    
    # Calculate check-in rate
    check_in_rate = (
        (pulse_table.checked_in_count / pulse_table.total_rsvps * 100)
        if pulse_table.total_rsvps > 0
        else 0.0
    )
    
    return PulseDashboardStats(
        total_rsvps=pulse_table.total_rsvps,
        checked_in_count=pulse_table.checked_in_count,
        walk_in_count=pulse_table.walk_in_count,
        check_in_rate=round(check_in_rate, 1),
        last_check_in_at=pulse_table.last_check_in_at,
        active_scanners=active_scanners,
        recent_check_ins=recent_check_ins,
    )
