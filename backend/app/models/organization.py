"""Organization related ORM models."""

from __future__ import annotations

import uuid
from typing import Optional

from sqlalchemy import CheckConstraint, Column, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from .base import Base


class Organization(Base):
    __tablename__ = "organizations"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String, nullable=False)
    slug: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String)
    logo_url: Mapped[Optional[str]] = mapped_column(String)
    settings: Mapped[dict] = mapped_column(JSONB, default=dict, server_default="{}")
    subscription_tier: Mapped[str] = mapped_column(String, default="free", server_default="free")
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    __table_args__ = (
        CheckConstraint(
            "subscription_tier IN ('free', 'pro', 'enterprise')",
            name="organizations_subscription_tier_check",
        ),
    )

    members: Mapped[list["OrganizationMember"]] = relationship(
        back_populates="organization", cascade="all, delete-orphan"
    )
    workspaces: Mapped[list["Workspace"]] = relationship(back_populates="organization")


class OrganizationMember(Base):
    __tablename__ = "organization_members"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    role: Mapped[str] = mapped_column(String, default="member", server_default="member")
    permissions: Mapped[dict] = mapped_column(JSONB, default=dict, server_default="{}")
    joined_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    __table_args__ = (
        CheckConstraint(
            "role IN ('owner', 'admin', 'editor', 'member')",
            name="organization_members_role_check",
        ),
    )

    organization: Mapped[Organization] = relationship(back_populates="members")
