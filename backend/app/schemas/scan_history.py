"""Pydantic schemas for barcode scan history."""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class ScanStatus(str, Enum):
    SUCCESS = "success"
    FAILURE = "failure"


class ScanHistoryBase(BaseModel):
    workspace_id: UUID
    table_id: UUID
    column_id: Optional[UUID] = None
    column_name: Optional[str] = None
    barcode: str = Field(..., min_length=1)
    status: ScanStatus = ScanStatus.SUCCESS
    matched_row_ids: List[UUID] = Field(default_factory=list)
    matched_rows: List[Any] = Field(default_factory=list)
    source: str = "mobile"
    metadata: dict = Field(default_factory=dict)
    created_by: Optional[UUID] = None


class ScanHistoryCreate(ScanHistoryBase):
    pass


class ScanHistoryRead(ScanHistoryBase):
    id: UUID
    created_at: datetime

    class Config:
        orm_mode = True
