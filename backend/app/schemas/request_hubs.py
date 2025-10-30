"""Request Hub Pydantic schemas."""

from datetime import datetime
from typing import Any, Dict, List, Literal, Optional
from uuid import UUID

from pydantic import BaseModel, Field


# ============================================================================
# Tab Schemas
# ============================================================================

class RequestHubTabBase(BaseModel):
    """Base schema for Request Hub Tab."""
    
    name: str = Field(..., min_length=1, max_length=255)
    slug: str = Field(..., min_length=1, max_length=255)
    type: Literal[
        "dashboard",
        "my-requests", 
        "new-request",
        "approvals",
        "all-requests",
        "analytics",
        "custom"
    ]
    icon: Optional[str] = None
    position: int = Field(default=0, ge=0)
    is_visible: bool = True
    config: Dict[str, Any] = Field(default_factory=dict)


class RequestHubTabCreate(RequestHubTabBase):
    """Schema for creating a Request Hub Tab."""
    pass


class RequestHubTabUpdate(BaseModel):
    """Schema for updating a Request Hub Tab."""
    
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    slug: Optional[str] = Field(None, min_length=1, max_length=255)
    type: Optional[Literal[
        "dashboard",
        "my-requests",
        "new-request", 
        "approvals",
        "all-requests",
        "analytics",
        "custom"
    ]] = None
    icon: Optional[str] = None
    position: Optional[int] = Field(None, ge=0)
    is_visible: Optional[bool] = None
    config: Optional[Dict[str, Any]] = None


class RequestHubTabRead(RequestHubTabBase):
    """Schema for reading a Request Hub Tab."""
    
    id: UUID
    hub_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============================================================================
# Hub Schemas
# ============================================================================

class RequestHubBase(BaseModel):
    """Base schema for Request Hub."""
    
    name: str = Field(..., min_length=1, max_length=255)
    slug: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    settings: Dict[str, Any] = Field(default_factory=dict)
    is_active: bool = True


class RequestHubCreate(RequestHubBase):
    """Schema for creating a Request Hub."""
    
    workspace_id: UUID


class RequestHubUpdate(BaseModel):
    """Schema for updating a Request Hub."""
    
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    slug: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    settings: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None


class RequestHubRead(RequestHubBase):
    """Schema for reading a Request Hub without tabs."""
    
    id: UUID
    workspace_id: UUID
    created_by: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class RequestHubReadWithTabs(RequestHubRead):
    """Schema for reading a Request Hub with tabs."""
    
    tabs: List[RequestHubTabRead] = []

    class Config:
        from_attributes = True


# ============================================================================
# Batch Operations
# ============================================================================

class TabReorderItem(BaseModel):
    """Schema for reordering tabs."""
    
    id: UUID
    position: int = Field(..., ge=0)


class TabsReorderRequest(BaseModel):
    """Schema for batch reordering tabs."""
    
    tabs: List[TabReorderItem]
