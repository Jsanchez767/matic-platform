"""
Pulse Module Models
Event check-in system for real-time attendance tracking
"""

import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import Boolean, Integer, String, Text, ARRAY, ForeignKey, Index, text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base


class PulseEnabledTable(Base):
    """Configuration for Pulse check-in on a data table"""
    __tablename__ = "pulse_enabled_tables"
    
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    table_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("data_tables.id", ondelete="CASCADE"), unique=True, nullable=False)
    workspace_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    
    # Configuration
    enabled: Mapped[bool] = mapped_column(Boolean, default=True, server_default="true")
    check_in_column_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("table_columns.id"))
    display_columns: Mapped[Optional[list[uuid.UUID]]] = mapped_column(ARRAY(UUID(as_uuid=True)))
    
    # Settings
    settings: Mapped[dict] = mapped_column(
        JSONB, 
        default={
            "show_popup": True,
            "play_sound": False,
            "highlight_checked_in": True,
            "allow_duplicate_scans": False,
            "scan_mode": "rapid",
            "offline_mode": True,
            "guest_scanning_enabled": True
        },
        server_default=text("""'{
            "show_popup": true,
            "play_sound": false,
            "highlight_checked_in": true,
            "allow_duplicate_scans": false,
            "scan_mode": "rapid",
            "offline_mode": true,
            "guest_scanning_enabled": true
        }'::jsonb""")
    )
    
    # Cached stats
    total_rsvps: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    checked_in_count: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    walk_in_count: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    last_check_in_at: Mapped[Optional[datetime]]
    
    # Audit
    created_at: Mapped[datetime] = mapped_column(server_default=text("NOW()"))
    updated_at: Mapped[datetime] = mapped_column(server_default=text("NOW()"))
    created_by: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("auth.users.id"))
    
    # Relationships
    check_ins: Mapped[list["PulseCheckIn"]] = relationship("PulseCheckIn", back_populates="pulse_table", cascade="all, delete-orphan")
    scanner_sessions: Mapped[list["PulseScannerSession"]] = relationship("PulseScannerSession", back_populates="pulse_table", cascade="all, delete-orphan")


class PulseCheckIn(Base):
    """Individual check-in event"""
    __tablename__ = "pulse_check_ins"
    __table_args__ = (
        Index('idx_pulse_checkins_table', 'table_id'),
        Index('idx_pulse_checkins_row', 'row_id'),
        Index('idx_pulse_checkins_time', 'check_in_time', postgresql_ops={'check_in_time': 'DESC'}),
    )
    
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    pulse_table_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("pulse_enabled_tables.id", ondelete="CASCADE"), nullable=False)
    table_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("data_tables.id", ondelete="CASCADE"), nullable=False)
    row_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("table_rows.id", ondelete="CASCADE"), nullable=False)
    
    # Check-in metadata
    barcode_scanned: Mapped[str] = mapped_column(String, nullable=False)
    scanner_user_name: Mapped[Optional[str]] = mapped_column(Text)
    scanner_user_email: Mapped[Optional[str]] = mapped_column(Text)
    scanner_device_id: Mapped[Optional[str]] = mapped_column(Text)
    check_in_time: Mapped[datetime] = mapped_column(server_default=text("NOW()"))
    check_in_count: Mapped[int] = mapped_column(Integer, default=1, server_default="1")
    
    # Row data snapshot
    row_data: Mapped[Optional[dict]] = mapped_column(JSONB)
    
    # Context
    is_walk_in: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    notes: Mapped[Optional[str]] = mapped_column(Text)
    
    # Audit
    created_at: Mapped[datetime] = mapped_column(server_default=text("NOW()"))
    created_by: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("auth.users.id"))
    
    # Relationships
    pulse_table: Mapped["PulseEnabledTable"] = relationship("PulseEnabledTable", back_populates="check_ins")


class PulseScannerSession(Base):
    """Track active scanner sessions"""
    __tablename__ = "pulse_scanner_sessions"
    __table_args__ = (
        Index('idx_pulse_sessions_table', 'pulse_table_id'),
        Index('idx_pulse_sessions_active', 'is_active', 'pulse_table_id'),
    )
    
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    pulse_table_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("pulse_enabled_tables.id", ondelete="CASCADE"), nullable=False)
    
    # Scanner info
    pairing_code: Mapped[str] = mapped_column(String, nullable=False)
    scanner_name: Mapped[str] = mapped_column(String, nullable=False)
    scanner_email: Mapped[Optional[str]] = mapped_column(String)
    device_id: Mapped[Optional[str]] = mapped_column(String)
    
    # Status
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, server_default="true")
    last_scan_at: Mapped[Optional[datetime]]
    total_scans: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    
    # Timing
    started_at: Mapped[datetime] = mapped_column(server_default=text("NOW()"))
    ended_at: Mapped[Optional[datetime]]
    
    # Relationships
    pulse_table: Mapped["PulseEnabledTable"] = relationship("PulseEnabledTable", back_populates="scanner_sessions")
