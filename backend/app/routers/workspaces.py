"""Workspace API routes."""

from __future__ import annotations

from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.models.organization import Organization, OrganizationMember
from app.models.workspace import Workspace, WorkspaceMember
from app.schemas.workspaces import WorkspaceCreate, WorkspaceRead, WorkspaceSummary

router = APIRouter()


@router.get("/", response_model=List[WorkspaceSummary])
async def list_workspaces(
    user_id: UUID = Query(..., description="Authenticated user identifier."),
    session: AsyncSession = Depends(get_session),
) -> List[WorkspaceSummary]:
    stmt = (
        select(Workspace)
        .join(WorkspaceMember, WorkspaceMember.workspace_id == Workspace.id)
        .where(WorkspaceMember.user_id == user_id)
        .order_by(Workspace.created_at.desc())
    )

    result = await session.execute(stmt)
    workspaces = result.scalars().unique().all()
    return workspaces


@router.get("/by-slug/{slug}", response_model=WorkspaceRead)
async def get_workspace_by_slug(
    slug: str,
    session: AsyncSession = Depends(get_session),
) -> WorkspaceRead:
    """Get workspace by slug."""
    stmt = select(Workspace).where(Workspace.slug == slug)
    result = await session.execute(stmt)
    workspace = result.scalars().first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    return workspace


@router.get("/{workspace_id}", response_model=WorkspaceRead)
async def get_workspace(
    workspace_id: UUID,
    session: AsyncSession = Depends(get_session),
) -> WorkspaceRead:
    stmt = select(Workspace).where(Workspace.id == workspace_id)
    result = await session.execute(stmt)
    workspace = result.scalars().first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    return workspace


@router.post("/", response_model=WorkspaceRead, status_code=201)
async def create_workspace(
    workspace_data: WorkspaceCreate,
    session: AsyncSession = Depends(get_session),
) -> WorkspaceRead:
    """Create a new workspace and add the owner as a member."""
    
    # Check if user has an organization, or create one
    stmt = (
        select(Organization)
        .join(OrganizationMember, OrganizationMember.organization_id == Organization.id)
        .where(OrganizationMember.user_id == workspace_data.owner_id)
    )
    result = await session.execute(stmt)
    organization = result.scalars().first()
    
    if not organization:
        # Create a default organization for this user
        organization = Organization(
            name=f"{workspace_data.name} Organization",
            slug=f"{workspace_data.slug}-org",
            description="Personal organization",
        )
        session.add(organization)
        await session.flush()
        
        # Add user as organization member
        org_member = OrganizationMember(
            organization_id=organization.id,
            user_id=workspace_data.owner_id,
            role="owner",
        )
        session.add(org_member)
        await session.flush()
    
    # Create the workspace
    workspace = Workspace(
        name=workspace_data.name,
        slug=workspace_data.slug,
        description=workspace_data.description,
        icon=workspace_data.icon,
        color=workspace_data.color,
        organization_id=organization.id,
        created_by=workspace_data.owner_id,
    )
    
    session.add(workspace)
    await session.flush()  # Get the workspace ID
    
    # Add the owner as a workspace member with admin role
    member = WorkspaceMember(
        workspace_id=workspace.id,
        user_id=workspace_data.owner_id,
        role="admin",
    )
    
    session.add(member)
    await session.commit()
    await session.refresh(workspace)
    
    return workspace
