"""
Pulse Module Schemas
Event check-in system Pydantic models
"""

from datetime import datetime
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, Field


# Settings schemas
class PulseSettings(BaseModel):
    """Pulse check-in settings"""
    show_popup: bool = True
    play_sound: bool = False
    highlight_checked_in: bool = True
    allow_duplicate_scans: bool = False
    scan_mode: str = "rapid"  # rapid, verification, manual
    offline_mode: bool = True
    guest_scanning_enabled: bool = True


# Pulse Enabled Table schemas
class PulseEnabledTableCreate(BaseModel):
    """Create Pulse configuration for a table"""
    table_id: UUID
    workspace_id: UUID
    check_in_column_id: Optional[UUID] = None
    display_columns: Optional[List[UUID]] = None
    settings: Optional[PulseSettings] = None


class PulseEnabledTableUpdate(BaseModel):
    """Update Pulse configuration"""
    enabled: Optional[bool] = None
    check_in_column_id: Optional[UUID] = None
    display_columns: Optional[List[UUID]] = None
    settings: Optional[PulseSettings] = None


class PulseStatsRead(BaseModel):
    """Cached statistics"""
    total_rsvps: int
    checked_in_count: int
    walk_in_count: int
    last_check_in_at: Optional[datetime]


class PulseEnabledTableRead(BaseModel):
    """Read Pulse configuration"""
    id: UUID
    table_id: UUID
    workspace_id: UUID
    enabled: bool
    check_in_column_id: Optional[UUID]
    display_columns: Optional[List[UUID]]
    settings: dict
    total_rsvps: int
    checked_in_count: int
    walk_in_count: int
    last_check_in_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    created_by: Optional[UUID]
    
    class Config:
        from_attributes = True


# Pulse Check-in schemas
class PulseCheckInCreate(BaseModel):
    """Create a check-in event"""
    pulse_table_id: UUID
    table_id: UUID
    row_id: UUID
    barcode_scanned: str
    scanner_user_name: Optional[str] = None
    scanner_user_email: Optional[str] = None
    scanner_device_id: Optional[str] = None
    row_data: Optional[dict] = None
    is_walk_in: bool = False
    notes: Optional[str] = None


class PulseCheckInRead(BaseModel):
    """Read a check-in event"""
    id: UUID
    pulse_table_id: UUID
    table_id: UUID
    row_id: UUID
    barcode_scanned: str
    scanner_user_name: Optional[str]
    scanner_user_email: Optional[str]
    scanner_device_id: Optional[str]
    check_in_time: datetime
    check_in_count: int
    row_data: Optional[dict]
    is_walk_in: bool
    notes: Optional[str]
    created_at: datetime
    created_by: Optional[UUID]
    
    class Config:
        from_attributes = True


# Scanner Session schemas
class PulseScannerSessionCreate(BaseModel):
    """Create a scanner session"""
    pulse_table_id: UUID
    pairing_code: str
    scanner_name: str
    scanner_email: Optional[str] = None
    device_id: Optional[str] = None


class PulseScannerSessionUpdate(BaseModel):
    """Update a scanner session"""
    is_active: Optional[bool] = None
    total_scans: Optional[int] = None
    last_scan_at: Optional[datetime] = None


class PulseScannerSessionRead(BaseModel):
    """Read a scanner session"""
    id: UUID
    pulse_table_id: UUID
    pairing_code: str
    scanner_name: str
    scanner_email: Optional[str]
    device_id: Optional[str]
    is_active: bool
    last_scan_at: Optional[datetime]
    total_scans: int
    started_at: datetime
    ended_at: Optional[datetime]
    
    class Config:
        from_attributes = True


# Dashboard/stats response
class PulseDashboardStats(BaseModel):
    """Real-time dashboard statistics"""
    total_rsvps: int
    checked_in_count: int
    walk_in_count: int
    check_in_rate: float
    last_check_in_at: Optional[datetime]
    active_scanners: int
    recent_check_ins: List[PulseCheckInRead]
