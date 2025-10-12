"""Pydantic schemas for table links."""

from datetime import datetime
from typing import Optional, Dict, Any
from uuid import UUID

from pydantic import BaseModel


class TableLinkBase(BaseModel):
    source_table_id: UUID
    source_column_id: UUID
    target_table_id: UUID
    target_column_id: Optional[UUID] = None
    link_type: str = "one_to_many"
    settings: Dict[str, Any] = {}


class TableLinkCreate(TableLinkBase):
    pass


class TableLinkRead(TableLinkBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True


class TableRowLinkBase(BaseModel):
    link_id: UUID
    source_row_id: UUID
    target_row_id: UUID
    metadata_: Dict[str, Any] = {}


class TableRowLinkCreate(BaseModel):
    column_id: UUID
    target_row_id: UUID


class TableRowLinkRead(TableRowLinkBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True


class LinkedRecordRead(BaseModel):
    id: UUID
    display_name: str
    data: Dict[str, Any]

    class Config:
        from_attributes = True


class AvailableRecordsResponse(BaseModel):
    records: list[LinkedRecordRead]
    total: int
    has_more: bool