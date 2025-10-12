"""Pydantic schemas for data tables/sheets."""

from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class TableColumnSchema(BaseModel):
    id: Optional[UUID] = None
    name: str
    label: str
    description: Optional[str] = None
    column_type: str
    settings: Dict[str, Any] = Field(default_factory=dict)
    validation: Dict[str, Any] = Field(default_factory=dict)
    formula: Optional[str] = None
    formula_dependencies: Optional[List[str]] = None
    linked_table_id: Optional[UUID] = None
    linked_column_id: Optional[UUID] = None
    rollup_function: Optional[str] = None
    position: int = 0
    width: int = 150
    is_visible: bool = True
    is_primary: bool = False

    class Config:
        from_attributes = True


class TableColumnCreate(BaseModel):
    """Schema for creating a new column."""
    name: str
    label: str
    description: Optional[str] = None
    column_type: str
    settings: Dict[str, Any] = Field(default_factory=dict)
    validation: Dict[str, Any] = Field(default_factory=dict)
    formula: Optional[str] = None
    formula_dependencies: Optional[List[str]] = None
    linked_table_id: Optional[UUID] = None
    linked_column_id: Optional[UUID] = None
    rollup_function: Optional[str] = None
    position: int = 0
    width: int = 150
    is_visible: bool = True
    is_primary: bool = False


class TableColumnUpdate(BaseModel):
    """Schema for updating a column."""
    name: Optional[str] = None
    label: Optional[str] = None
    description: Optional[str] = None
    column_type: Optional[str] = None
    settings: Optional[Dict[str, Any]] = None
    validation: Optional[Dict[str, Any]] = None
    formula: Optional[str] = None
    formula_dependencies: Optional[List[str]] = None
    linked_table_id: Optional[UUID] = None
    linked_column_id: Optional[UUID] = None
    rollup_function: Optional[str] = None
    position: Optional[int] = None
    width: Optional[int] = None
    is_visible: Optional[bool] = None
    is_primary: Optional[bool] = None



class TableRowSchema(BaseModel):
    id: Optional[UUID] = None
    data: Dict[str, Any] = Field(default_factory=dict)
    metadata_: Dict[str, Any] = Field(default_factory=dict)
    is_archived: bool = False
    position: Optional[float] = None
    created_by: Optional[UUID] = None
    updated_by: Optional[UUID] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class TableViewSchema(BaseModel):
    id: Optional[UUID] = None
    name: str
    description: Optional[str] = None
    view_type: str = "grid"
    settings: Dict[str, Any] = Field(default_factory=dict)
    filters: List[Any] = Field(default_factory=list)
    sorts: List[Any] = Field(default_factory=list)
    grouping: Dict[str, Any] = Field(default_factory=dict)
    is_shared: bool = False
    is_locked: bool = False
    created_by: Optional[UUID] = None

    class Config:
        from_attributes = True


class DataTableBase(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    icon: str = "table"
    color: str = "#10B981"
    settings: Dict[str, Any] = Field(default_factory=dict)
    import_source: Optional[str] = None
    import_metadata: Dict[str, Any] = Field(default_factory=dict)
    is_archived: bool = False


class DataTableCreate(DataTableBase):
    workspace_id: UUID
    created_by: UUID
    columns: List[TableColumnSchema] = Field(default_factory=list)


class DataTableUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    settings: Optional[Dict[str, Any]] = None
    is_archived: Optional[bool] = None


class DataTableRead(DataTableBase):
    id: UUID
    workspace_id: UUID
    row_count: int
    created_by: UUID
    created_at: datetime
    updated_at: datetime
    columns: List[TableColumnSchema] = Field(default_factory=list)

    class Config:
        from_attributes = True


class DataTableWithRows(DataTableRead):
    rows: List[TableRowSchema] = Field(default_factory=list)


class TableRowCreate(BaseModel):
    data: Dict[str, Any] = Field(default_factory=dict)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created_by: UUID
    position: Optional[float] = None

    class Config:
        fields = {'metadata': 'metadata_'}


class TableRowUpdate(BaseModel):
    data: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None
    is_archived: Optional[bool] = None
    position: Optional[float] = None
    updated_by: UUID

    class Config:
        fields = {'metadata': 'metadata_'}


class TableRowBulkCreate(BaseModel):
    rows: List[Dict[str, Any]]  # List of data dicts
    created_by: UUID


class TableViewCreate(BaseModel):
    table_id: UUID
    name: str
    description: Optional[str] = None
    view_type: str = "grid"
    settings: Dict[str, Any] = Field(default_factory=dict)
    filters: List[Any] = Field(default_factory=list)
    sorts: List[Any] = Field(default_factory=list)
    grouping: Dict[str, Any] = Field(default_factory=dict)
    created_by: UUID


class TableViewUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    settings: Optional[Dict[str, Any]] = None
    filters: Optional[List[Any]] = None
    sorts: Optional[List[Any]] = None
    grouping: Optional[Dict[str, Any]] = None
    is_shared: Optional[bool] = None
    is_locked: Optional[bool] = None


class FormTableConnectionSchema(BaseModel):
    id: Optional[UUID] = None
    form_id: UUID
    table_id: UUID
    connection_type: str  # 'write', 'read', 'update'
    field_mappings: Dict[str, UUID] = Field(default_factory=dict)  # form_field_id -> table_column_id
    filters: List[Any] = Field(default_factory=list)
    settings: Dict[str, Any] = Field(default_factory=dict)

    class Config:
        from_attributes = True


class TableCommentCreate(BaseModel):
    table_id: UUID
    row_id: UUID
    content: str
    parent_comment_id: Optional[UUID] = None
    created_by: UUID


class TableCommentRead(BaseModel):
    id: UUID
    table_id: UUID
    row_id: UUID
    content: str
    parent_comment_id: Optional[UUID] = None
    created_by: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
