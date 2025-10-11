"""Data tables/sheets ORM models."""

from __future__ import annotations

import uuid
from typing import Optional, List

from sqlalchemy import Boolean, CheckConstraint, Column, DateTime, ForeignKey, Integer, String, Text, ARRAY
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from .base import Base


class DataTable(Base):
    __tablename__ = "data_tables"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String, nullable=False)
    slug: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[Optional[str ]] = mapped_column(Text)
    icon: Mapped[str] = mapped_column(String, default="table", server_default="table")
    color: Mapped[str] = mapped_column(String, default="#10B981", server_default="#10B981")
    settings: Mapped[dict] = mapped_column(JSONB, default=dict, server_default="{}")
    import_source: Mapped[Optional[str ]] = mapped_column(String)
    import_metadata: Mapped[dict] = mapped_column(JSONB, default=dict, server_default="{}")
    is_archived: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    row_count: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    created_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    workspace: Mapped["Workspace"] = relationship(back_populates="data_tables")
    columns: Mapped[list["TableColumn"]] = relationship(
        back_populates="table", 
        cascade="all, delete-orphan",
        foreign_keys="[TableColumn.table_id]"
    )
    rows: Mapped[list["TableRow"]] = relationship(back_populates="table", cascade="all, delete-orphan")
    views: Mapped[list["TableView"]] = relationship(back_populates="table", cascade="all, delete-orphan")
    source_links: Mapped[list["TableLink"]] = relationship(
        foreign_keys="[TableLink.source_table_id]", back_populates="source_table"
    )
    target_links: Mapped[list["TableLink"]] = relationship(
        foreign_keys="[TableLink.target_table_id]", back_populates="target_table"
    )


class TableColumn(Base):
    __tablename__ = "table_columns"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    table_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("data_tables.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String, nullable=False)
    label: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[Optional[str ]] = mapped_column(Text)
    column_type: Mapped[str] = mapped_column(String, nullable=False)
    settings: Mapped[dict] = mapped_column(JSONB, default=dict, server_default="{}")
    validation: Mapped[dict] = mapped_column(JSONB, default=dict, server_default="{}")
    formula: Mapped[Optional[str ]] = mapped_column(Text)
    formula_dependencies: Mapped[Optional[List[str]]] = mapped_column(ARRAY(String))
    linked_table_id: Mapped[Optional[uuid.UUID ]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("data_tables.id")
    )
    linked_column_id: Mapped[Optional[uuid.UUID ]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("table_columns.id")
    )
    rollup_function: Mapped[Optional[str ]] = mapped_column(String)
    position: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    width: Mapped[int] = mapped_column(Integer, default=150, server_default="150")
    is_visible: Mapped[bool] = mapped_column(Boolean, default=True, server_default="true")
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    table: Mapped[DataTable] = relationship(
        back_populates="columns",
        foreign_keys=[table_id]
    )


class TableRow(Base):
    __tablename__ = "table_rows"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    table_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("data_tables.id", ondelete="CASCADE"), nullable=False
    )
    data: Mapped[dict] = mapped_column(JSONB, default=dict, server_default="{}")
    metadata_: Mapped[dict] = mapped_column("metadata", JSONB, default=dict, server_default="{}")
    is_archived: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    position: Mapped[Optional[float ]] = mapped_column()
    created_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    updated_by: Mapped[Optional[uuid.UUID ]] = mapped_column(UUID(as_uuid=True))
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    table: Mapped[DataTable] = relationship(back_populates="rows")
    comments: Mapped[list["TableComment"]] = relationship(back_populates="row", cascade="all, delete-orphan")
    attachments: Mapped[list["TableAttachment"]] = relationship(
        back_populates="row", cascade="all, delete-orphan"
    )


class TableView(Base):
    __tablename__ = "table_views"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    table_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("data_tables.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[Optional[str ]] = mapped_column(Text)
    view_type: Mapped[str] = mapped_column(String, default="grid", server_default="grid")
    settings: Mapped[dict] = mapped_column(JSONB, default=dict, server_default="{}")
    filters: Mapped[list] = mapped_column(JSONB, default=list, server_default="[]")
    sorts: Mapped[list] = mapped_column(JSONB, default=list, server_default="[]")
    grouping: Mapped[dict] = mapped_column(JSONB, default=dict, server_default="{}")
    is_shared: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    is_locked: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    created_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    __table_args__ = (
        CheckConstraint(
            "view_type IN ('grid', 'kanban', 'calendar', 'gallery', 'timeline', 'form')",
            name="table_views_view_type_check",
        ),
    )

    table: Mapped[DataTable] = relationship(back_populates="views")


class TableLink(Base):
    __tablename__ = "table_links"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    source_table_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("data_tables.id", ondelete="CASCADE"), nullable=False
    )
    source_column_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("table_columns.id", ondelete="CASCADE"), nullable=False
    )
    target_table_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("data_tables.id", ondelete="CASCADE"), nullable=False
    )
    target_column_id: Mapped[Optional[uuid.UUID ]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("table_columns.id")
    )
    link_type: Mapped[str] = mapped_column(String, default="one_to_many", server_default="one_to_many")
    settings: Mapped[dict] = mapped_column(JSONB, default=dict, server_default="{}")
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        CheckConstraint(
            "link_type IN ('one_to_one', 'one_to_many', 'many_to_many')",
            name="table_links_link_type_check",
        ),
    )

    source_table: Mapped[DataTable] = relationship(
        foreign_keys=[source_table_id], back_populates="source_links"
    )
    target_table: Mapped[DataTable] = relationship(
        foreign_keys=[target_table_id], back_populates="target_links"
    )
    row_links: Mapped[list["TableRowLink"]] = relationship(
        back_populates="link", cascade="all, delete-orphan"
    )


class TableRowLink(Base):
    __tablename__ = "table_row_links"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    link_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("table_links.id", ondelete="CASCADE"), nullable=False
    )
    source_row_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("table_rows.id", ondelete="CASCADE"), nullable=False
    )
    target_row_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("table_rows.id", ondelete="CASCADE"), nullable=False
    )
    metadata_: Mapped[dict] = mapped_column("metadata", JSONB, default=dict, server_default="{}")
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    link: Mapped[TableLink] = relationship(back_populates="row_links")


class FormTableConnection(Base):
    __tablename__ = "form_table_connections"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    form_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("forms.id", ondelete="CASCADE"), nullable=False
    )
    table_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("data_tables.id", ondelete="CASCADE"), nullable=False
    )
    connection_type: Mapped[str] = mapped_column(String, nullable=False)
    field_mappings: Mapped[dict] = mapped_column(JSONB, default=dict, server_default="{}")
    filters: Mapped[list] = mapped_column(JSONB, default=list, server_default="[]")
    settings: Mapped[dict] = mapped_column(JSONB, default=dict, server_default="{}")
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    __table_args__ = (
        CheckConstraint(
            "connection_type IN ('write', 'read', 'update')",
            name="form_table_connections_connection_type_check",
        ),
    )

    form: Mapped["Form"] = relationship(back_populates="table_connections")
    table: Mapped[DataTable] = relationship()


class TableAttachment(Base):
    __tablename__ = "table_attachments"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    table_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("data_tables.id", ondelete="CASCADE"), nullable=False
    )
    row_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("table_rows.id", ondelete="CASCADE"), nullable=False
    )
    column_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("table_columns.id", ondelete="CASCADE"), nullable=False
    )
    file_name: Mapped[str] = mapped_column(String, nullable=False)
    file_type: Mapped[str] = mapped_column(String, nullable=False)
    file_size: Mapped[int] = mapped_column(Integer, nullable=False)
    file_url: Mapped[str] = mapped_column(String, nullable=False)
    thumbnail_url: Mapped[Optional[str ]] = mapped_column(String)
    metadata_: Mapped[dict] = mapped_column("metadata", JSONB, default=dict, server_default="{}")
    uploaded_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    uploaded_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    row: Mapped[TableRow] = relationship(back_populates="attachments")


class TableComment(Base):
    __tablename__ = "table_comments"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    table_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("data_tables.id", ondelete="CASCADE"), nullable=False
    )
    row_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("table_rows.id", ondelete="CASCADE"), nullable=False
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)
    parent_comment_id: Mapped[Optional[uuid.UUID ]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("table_comments.id", ondelete="CASCADE")
    )
    created_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    row: Mapped[TableRow] = relationship(back_populates="comments")
    parent: Mapped["TableComment | None"] = relationship(
        remote_side=[id], back_populates="replies"
    )
    replies: Mapped[list["TableComment"]] = relationship(
        back_populates="parent", cascade="all, delete-orphan"
    )
