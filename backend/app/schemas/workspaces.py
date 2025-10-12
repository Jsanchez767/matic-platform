"""Pydantic schemas for workspace resources."""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class WorkspaceCreate(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    owner_id: UUID


class WorkspaceSummary(BaseModel):
    id: UUID
    name: str
    slug: str
    description: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None

    class Config:
        from_attributes = True


class WorkspaceRead(WorkspaceSummary):
    organization_id: UUID
    settings: dict
    is_archived: bool
    created_by: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
