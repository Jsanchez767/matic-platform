"""Request Hub ORM models."""

from __future__ import annotations
from typing import Optional

import uuid

from sqlalchemy import Boolean, CheckConstraint, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from .base import Base


class RequestHub(Base):
    """Request Hub model - customizable request management hub."""
    
    __tablename__ = "request_hubs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(Text, nullable=False)
    slug: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    settings: Mapped[dict] = mapped_column(JSONB, default=dict, server_default="{}")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, server_default="true")
    created_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    workspace: Mapped["Workspace"] = relationship(back_populates="request_hubs")
    tabs: Mapped[list["RequestHubTab"]] = relationship(
        back_populates="hub", 
        cascade="all, delete-orphan",
        order_by="RequestHubTab.position"
    )


class RequestHubTab(Base):
    """Request Hub Tab model - configurable tab within a hub."""
    
    __tablename__ = "request_hub_tabs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    hub_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("request_hubs.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(Text, nullable=False)
    slug: Mapped[str] = mapped_column(Text, nullable=False)
    type: Mapped[str] = mapped_column(Text, nullable=False)  # dashboard, my-requests, etc.
    icon: Mapped[Optional[str]] = mapped_column(Text)
    position: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    is_visible: Mapped[bool] = mapped_column(Boolean, default=True, server_default="true")
    config: Mapped[dict] = mapped_column(JSONB, default=dict, server_default="{}")
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    __table_args__ = (
        CheckConstraint(
            "type IN ('dashboard', 'my-requests', 'new-request', 'approvals', 'all-requests', 'analytics', 'custom')",
            name="request_hub_tabs_type_check",
        ),
    )

    # Relationships
    hub: Mapped["RequestHub"] = relationship(back_populates="tabs")
