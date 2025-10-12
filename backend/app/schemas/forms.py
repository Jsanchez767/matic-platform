"""Pydantic schemas for form resources."""

from datetime import datetime
from typing import Any, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class FormFieldSchema(BaseModel):
    id: Optional[UUID]
    name: str
    label: str
    placeholder: Optional[str] = None
    description: Optional[str] = None
    field_type: str
    settings: dict = Field(default_factory=dict)
    validation: dict = Field(default_factory=dict)
    options: List[Any] = Field(default_factory=list)
    position: int = 0
    width: str = "full"
    is_visible: bool = True

    class Config:
        from_attributes = True


class FormBase(BaseModel):
    name: str
    description: Optional[str] = None
    slug: str
    settings: dict = Field(default_factory=dict)
    submit_settings: dict = Field(default_factory=dict)
    status: str = "draft"
    is_public: bool = False


class FormCreate(FormBase):
    workspace_id: UUID
    created_by: UUID
    fields: List[FormFieldSchema] = Field(default_factory=list)


class FormUpdate(FormBase):
    version: Optional[int] = None
    fields: Optional[List[FormFieldSchema]] = None


class FormRead(FormBase):
    id: UUID
    workspace_id: UUID
    version: int
    created_by: UUID
    created_at: datetime
    updated_at: datetime
    published_at: Optional[datetime] = None
    fields: List[FormFieldSchema] = Field(default_factory=list)

    class Config:
        from_attributes = True
