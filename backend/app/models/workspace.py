"""Workspace ORM models."""

from __future__ import annotations
from typing import Optional

import uuid

from sqlalchemy import Boolean, CheckConstraint, Column, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from .base import Base


class Workspace(Base):
    __tablename__ = "workspaces"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String, nullable=False)
    slug: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[Optional[str ]] = mapped_column(String)
    color: Mapped[str] = mapped_column(String, default="#3B82F6", server_default="#3B82F6")
    icon: Mapped[str] = mapped_column(String, default="folder", server_default="folder")
    settings: Mapped[dict] = mapped_column(JSONB, default=dict, server_default="{}")
    is_archived: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    created_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    __table_args__ = ()

    organization: Mapped["Organization"] = relationship(back_populates="workspaces")
    members: Mapped[list["WorkspaceMember"]] = relationship(
        back_populates="workspace", cascade="all, delete-orphan"
    )
    forms: Mapped[list["Form"]] = relationship(back_populates="workspace", cascade="all, delete-orphan")
    data_tables: Mapped[list["DataTable"]] = relationship(
        back_populates="workspace", cascade="all, delete-orphan"
    )
    request_hubs: Mapped[list["RequestHub"]] = relationship(
        back_populates="workspace", cascade="all, delete-orphan"
    )


class WorkspaceMember(Base):
    __tablename__ = "workspace_members"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    role: Mapped[str] = mapped_column(String, default="editor", server_default="editor")
    permissions: Mapped[dict] = mapped_column(JSONB, default=dict, server_default="{}")
    added_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        CheckConstraint(
            "role IN ('admin', 'editor', 'viewer')",
            name="workspace_members_role_check",
        ),
    )

    workspace: Mapped[Workspace] = relationship(back_populates="members")
