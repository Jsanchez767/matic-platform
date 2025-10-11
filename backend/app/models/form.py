"""Form and collaboration models."""

from __future__ import annotations
from typing import Optional

import uuid

from sqlalchemy import Boolean, CheckConstraint, Column, DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from .base import Base


class Form(Base):
    __tablename__ = "forms"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[Optional[str ]] = mapped_column(Text)
    slug: Mapped[str] = mapped_column(String, nullable=False)
    settings: Mapped[dict] = mapped_column(JSONB, default=dict, server_default="{}")
    submit_settings: Mapped[dict] = mapped_column(JSONB, default=dict, server_default="{}")
    status: Mapped[str] = mapped_column(String, default="draft", server_default="draft")
    version: Mapped[int] = mapped_column(default=1, server_default="1")
    is_public: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    created_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
    published_at: Mapped[Optional[DateTime ]] = mapped_column(DateTime(timezone=True))

    __table_args__ = (
        CheckConstraint(
            "status IN ('draft', 'published', 'archived', 'paused')",
            name="forms_status_check",
        ),
    )

    workspace: Mapped["Workspace"] = relationship(back_populates="forms")
    fields: Mapped[list["FormField"]] = relationship(
        back_populates="form", cascade="all, delete-orphan"
    )
    submissions: Mapped[list["FormSubmission"]] = relationship(
        back_populates="form", cascade="all, delete-orphan"
    )
    activity_logs: Mapped[list["ActivityLog"]] = relationship(back_populates="form")
    sessions: Mapped[list["ActiveSession"]] = relationship(back_populates="form")
    table_connections: Mapped[list["FormTableConnection"]] = relationship(
        back_populates="form", cascade="all, delete-orphan"
    )


class FormField(Base):
    __tablename__ = "form_fields"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    form_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("forms.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String, nullable=False)
    label: Mapped[str] = mapped_column(String, nullable=False)
    placeholder: Mapped[Optional[str ]] = mapped_column(String)
    description: Mapped[Optional[str ]] = mapped_column(Text)
    field_type: Mapped[str] = mapped_column(String, nullable=False)
    settings: Mapped[dict] = mapped_column(JSONB, default=dict, server_default="{}")
    validation: Mapped[dict] = mapped_column(JSONB, default=dict, server_default="{}")
    options: Mapped[list] = mapped_column(JSONB, default=list, server_default="[]")
    position: Mapped[int] = mapped_column(default=0, server_default="0")
    width: Mapped[str] = mapped_column(String, default="full", server_default="full")
    is_visible: Mapped[bool] = mapped_column(default=True, server_default="true")
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    __table_args__ = (
        CheckConstraint(
            "width IN ('full', 'half', 'third', 'quarter')",
            name="form_fields_width_check",
        ),
    )

    form: Mapped[Form] = relationship(back_populates="fields")


class FormSubmission(Base):
    __tablename__ = "form_submissions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    form_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("forms.id", ondelete="CASCADE"), nullable=False
    )
    data: Mapped[dict] = mapped_column(JSONB, default=dict, server_default="{}")
    metadata_: Mapped[dict] = mapped_column("metadata", JSONB, default=dict, server_default="{}")
    status: Mapped[str] = mapped_column(String, default="submitted", server_default="submitted")
    submitted_by: Mapped[Optional[uuid.UUID ]] = mapped_column(UUID(as_uuid=True))
    email: Mapped[Optional[str ]] = mapped_column(String)
    submitted_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    reviewed_at: Mapped[Optional[DateTime ]] = mapped_column(DateTime(timezone=True))
    reviewed_by: Mapped[Optional[uuid.UUID ]] = mapped_column(UUID(as_uuid=True))

    __table_args__ = (
        CheckConstraint(
            "status IN ('submitted', 'reviewed', 'approved', 'rejected')",
            name="form_submissions_status_check",
        ),
    )

    form: Mapped[Form] = relationship(back_populates="submissions")


class ActiveSession(Base):
    __tablename__ = "active_sessions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    workspace_id: Mapped[Optional[uuid.UUID ]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE")
    )
    form_id: Mapped[Optional[uuid.UUID ]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("forms.id", ondelete="CASCADE")
    )
    cursor_position: Mapped[dict] = mapped_column(JSONB, default=dict, server_default="{}")
    selected_element: Mapped[Optional[str ]] = mapped_column(String)
    user_agent: Mapped[Optional[str ]] = mapped_column(String)
    started_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    last_activity: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    workspace: Mapped[Optional["Workspace" ]] = relationship()
    form: Mapped[Optional[Form ]] = relationship(back_populates="sessions")


class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id: Mapped[Optional[uuid.UUID ]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE")
    )
    form_id: Mapped[Optional[uuid.UUID ]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("forms.id", ondelete="CASCADE")
    )
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    action: Mapped[str] = mapped_column(String, nullable=False)
    entity_type: Mapped[str] = mapped_column(String, nullable=False)
    entity_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    details: Mapped[dict] = mapped_column(JSONB, default=dict, server_default="{}")
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    form: Mapped[Optional[Form ]] = relationship(back_populates="activity_logs")
