"""Request Hubs API router."""

from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import select, update, delete as sql_delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.session import get_session
from app.models.request_hub import RequestHub, RequestHubTab
from app.schemas.request_hubs import (
    RequestHubCreate,
    RequestHubRead,
    RequestHubReadWithTabs,
    RequestHubUpdate,
    RequestHubTabCreate,
    RequestHubTabRead,
    RequestHubTabUpdate,
    TabsReorderRequest,
)

router = APIRouter()


# ============================================================================
# Request Hubs Endpoints
# ============================================================================

@router.get("/workspaces/{workspace_id}/request-hubs", response_model=List[RequestHubRead])
async def list_request_hubs(
    workspace_id: UUID,
    user_id: UUID = Query(..., description="User ID from auth token"),
    include_inactive: bool = False,
    session: AsyncSession = Depends(get_session),
):
    """List all request hubs in a workspace."""
    stmt = select(RequestHub).where(RequestHub.workspace_id == workspace_id)
    
    if not include_inactive:
        stmt = stmt.where(RequestHub.is_active == True)
    
    stmt = stmt.order_by(RequestHub.created_at.desc())
    
    result = await session.execute(stmt)
    hubs = result.scalars().all()
    
    return hubs


@router.get("/workspaces/{workspace_id}/request-hubs/{hub_id}", response_model=RequestHubReadWithTabs)
async def get_request_hub(
    workspace_id: UUID,
    hub_id: UUID,
    user_id: UUID = Query(..., description="User ID from auth token"),
    session: AsyncSession = Depends(get_session),
):
    """Get a specific request hub with its tabs."""
    stmt = (
        select(RequestHub)
        .options(selectinload(RequestHub.tabs))
        .where(
            RequestHub.id == hub_id,
            RequestHub.workspace_id == workspace_id
        )
    )
    
    result = await session.execute(stmt)
    hub = result.scalar_one_or_none()
    
    if not hub:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Request hub {hub_id} not found in workspace {workspace_id}"
        )
    
    return hub


@router.get("/workspaces/{workspace_id}/request-hubs/by-slug/{slug}", response_model=RequestHubReadWithTabs)
async def get_request_hub_by_slug(
    workspace_id: UUID,
    slug: str,
    user_id: UUID = Query(..., description="User ID from auth token"),
    session: AsyncSession = Depends(get_session),
):
    """Get a request hub by its slug."""
    stmt = (
        select(RequestHub)
        .options(selectinload(RequestHub.tabs))
        .where(
            RequestHub.slug == slug,
            RequestHub.workspace_id == workspace_id
        )
    )
    
    result = await session.execute(stmt)
    hub = result.scalar_one_or_none()
    
    if not hub:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Request hub with slug '{slug}' not found in workspace {workspace_id}"
        )
    
    return hub


@router.post("/workspaces/{workspace_id}/request-hubs", response_model=RequestHubReadWithTabs, status_code=status.HTTP_201_CREATED)
async def create_request_hub(
    workspace_id: UUID,
    hub_data: RequestHubCreate,
    user_id: UUID = Query(..., description="User ID from auth token"),
    session: AsyncSession = Depends(get_session),
):
    """Create a new request hub."""
    # Verify workspace_id matches
    if hub_data.workspace_id != workspace_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Workspace ID in path must match workspace_id in request body"
        )
    
    # Check for duplicate slug
    stmt = select(RequestHub).where(
        RequestHub.workspace_id == workspace_id,
        RequestHub.slug == hub_data.slug
    )
    result = await session.execute(stmt)
    existing_hub = result.scalar_one_or_none()
    
    if existing_hub:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Request hub with slug '{hub_data.slug}' already exists in this workspace"
        )
    
    # Create hub
    new_hub = RequestHub(
        **hub_data.model_dump(),
        created_by=user_id
    )
    
    session.add(new_hub)
    await session.commit()
    await session.refresh(new_hub, ["tabs"])
    
    return new_hub


@router.patch("/workspaces/{workspace_id}/request-hubs/{hub_id}", response_model=RequestHubReadWithTabs)
async def update_request_hub(
    workspace_id: UUID,
    hub_id: UUID,
    hub_data: RequestHubUpdate,
    user_id: UUID = Query(..., description="User ID from auth token"),
    session: AsyncSession = Depends(get_session),
):
    """Update a request hub."""
    # Get existing hub
    stmt = (
        select(RequestHub)
        .options(selectinload(RequestHub.tabs))
        .where(
            RequestHub.id == hub_id,
            RequestHub.workspace_id == workspace_id
        )
    )
    result = await session.execute(stmt)
    hub = result.scalar_one_or_none()
    
    if not hub:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Request hub {hub_id} not found in workspace {workspace_id}"
        )
    
    # Check for slug conflicts if updating slug
    if hub_data.slug and hub_data.slug != hub.slug:
        stmt = select(RequestHub).where(
            RequestHub.workspace_id == workspace_id,
            RequestHub.slug == hub_data.slug,
            RequestHub.id != hub_id
        )
        result = await session.execute(stmt)
        existing_hub = result.scalar_one_or_none()
        
        if existing_hub:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Request hub with slug '{hub_data.slug}' already exists in this workspace"
            )
    
    # Update fields
    update_data = hub_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(hub, field, value)
    
    await session.commit()
    await session.refresh(hub, ["tabs"])
    
    return hub


@router.delete("/workspaces/{workspace_id}/request-hubs/{hub_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_request_hub(
    workspace_id: UUID,
    hub_id: UUID,
    user_id: UUID = Query(..., description="User ID from auth token"),
    session: AsyncSession = Depends(get_session),
):
    """Delete a request hub."""
    stmt = select(RequestHub).where(
        RequestHub.id == hub_id,
        RequestHub.workspace_id == workspace_id
    )
    result = await session.execute(stmt)
    hub = result.scalar_one_or_none()
    
    if not hub:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Request hub {hub_id} not found in workspace {workspace_id}"
        )
    
    await session.delete(hub)
    await session.commit()


# ============================================================================
# Request Hub Tabs Endpoints
# ============================================================================

@router.get("/workspaces/{workspace_id}/request-hubs/{hub_id}/tabs", response_model=List[RequestHubTabRead])
async def list_request_hub_tabs(
    workspace_id: UUID,
    hub_id: UUID,
    user_id: UUID = Query(..., description="User ID from auth token"),
    include_hidden: bool = False,
    session: AsyncSession = Depends(get_session),
):
    """List all tabs for a request hub."""
    # Verify hub exists and belongs to workspace
    stmt = select(RequestHub).where(
        RequestHub.id == hub_id,
        RequestHub.workspace_id == workspace_id
    )
    result = await session.execute(stmt)
    hub = result.scalar_one_or_none()
    
    if not hub:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Request hub {hub_id} not found in workspace {workspace_id}"
        )
    
    # Get tabs
    stmt = select(RequestHubTab).where(RequestHubTab.hub_id == hub_id)
    
    if not include_hidden:
        stmt = stmt.where(RequestHubTab.is_visible == True)
    
    stmt = stmt.order_by(RequestHubTab.position)
    
    result = await session.execute(stmt)
    tabs = result.scalars().all()
    
    return tabs


@router.post("/workspaces/{workspace_id}/request-hubs/{hub_id}/tabs", response_model=RequestHubTabRead, status_code=status.HTTP_201_CREATED)
async def create_request_hub_tab(
    workspace_id: UUID,
    hub_id: UUID,
    tab_data: RequestHubTabCreate,
    user_id: UUID = Query(..., description="User ID from auth token"),
    session: AsyncSession = Depends(get_session),
):
    """Create a new tab in a request hub."""
    # Verify hub exists and belongs to workspace
    stmt = select(RequestHub).where(
        RequestHub.id == hub_id,
        RequestHub.workspace_id == workspace_id
    )
    result = await session.execute(stmt)
    hub = result.scalar_one_or_none()
    
    if not hub:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Request hub {hub_id} not found in workspace {workspace_id}"
        )
    
    # Check for duplicate slug
    stmt = select(RequestHubTab).where(
        RequestHubTab.hub_id == hub_id,
        RequestHubTab.slug == tab_data.slug
    )
    result = await session.execute(stmt)
    existing_tab = result.scalar_one_or_none()
    
    if existing_tab:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Tab with slug '{tab_data.slug}' already exists in this hub"
        )
    
    # Create tab
    new_tab = RequestHubTab(
        **tab_data.model_dump(),
        hub_id=hub_id
    )
    
    session.add(new_tab)
    await session.commit()
    await session.refresh(new_tab)
    
    return new_tab


@router.patch("/workspaces/{workspace_id}/request-hubs/{hub_id}/tabs/{tab_id}", response_model=RequestHubTabRead)
async def update_request_hub_tab(
    workspace_id: UUID,
    hub_id: UUID,
    tab_id: UUID,
    tab_data: RequestHubTabUpdate,
    user_id: UUID = Query(..., description="User ID from auth token"),
    session: AsyncSession = Depends(get_session),
):
    """Update a request hub tab."""
    # Verify hub exists and belongs to workspace
    stmt = select(RequestHub).where(
        RequestHub.id == hub_id,
        RequestHub.workspace_id == workspace_id
    )
    result = await session.execute(stmt)
    hub = result.scalar_one_or_none()
    
    if not hub:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Request hub {hub_id} not found in workspace {workspace_id}"
        )
    
    # Get existing tab
    stmt = select(RequestHubTab).where(
        RequestHubTab.id == tab_id,
        RequestHubTab.hub_id == hub_id
    )
    result = await session.execute(stmt)
    tab = result.scalar_one_or_none()
    
    if not tab:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tab {tab_id} not found in hub {hub_id}"
        )
    
    # Check for slug conflicts if updating slug
    if tab_data.slug and tab_data.slug != tab.slug:
        stmt = select(RequestHubTab).where(
            RequestHubTab.hub_id == hub_id,
            RequestHubTab.slug == tab_data.slug,
            RequestHubTab.id != tab_id
        )
        result = await session.execute(stmt)
        existing_tab = result.scalar_one_or_none()
        
        if existing_tab:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Tab with slug '{tab_data.slug}' already exists in this hub"
            )
    
    # Update fields
    update_data = tab_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(tab, field, value)
    
    await session.commit()
    await session.refresh(tab)
    
    return tab


@router.delete("/workspaces/{workspace_id}/request-hubs/{hub_id}/tabs/{tab_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_request_hub_tab(
    workspace_id: UUID,
    hub_id: UUID,
    tab_id: UUID,
    user_id: UUID = Query(..., description="User ID from auth token"),
    session: AsyncSession = Depends(get_session),
):
    """Delete a request hub tab."""
    # Verify hub exists and belongs to workspace
    stmt = select(RequestHub).where(
        RequestHub.id == hub_id,
        RequestHub.workspace_id == workspace_id
    )
    result = await session.execute(stmt)
    hub = result.scalar_one_or_none()
    
    if not hub:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Request hub {hub_id} not found in workspace {workspace_id}"
        )
    
    # Get tab
    stmt = select(RequestHubTab).where(
        RequestHubTab.id == tab_id,
        RequestHubTab.hub_id == hub_id
    )
    result = await session.execute(stmt)
    tab = result.scalar_one_or_none()
    
    if not tab:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tab {tab_id} not found in hub {hub_id}"
        )
    
    await session.delete(tab)
    await session.commit()


@router.post("/workspaces/{workspace_id}/request-hubs/{hub_id}/tabs/reorder", response_model=List[RequestHubTabRead])
async def reorder_request_hub_tabs(
    workspace_id: UUID,
    hub_id: UUID,
    reorder_data: TabsReorderRequest,
    user_id: UUID = Query(..., description="User ID from auth token"),
    session: AsyncSession = Depends(get_session),
):
    """Reorder tabs in a request hub."""
    # Verify hub exists and belongs to workspace
    stmt = select(RequestHub).where(
        RequestHub.id == hub_id,
        RequestHub.workspace_id == workspace_id
    )
    result = await session.execute(stmt)
    hub = result.scalar_one_or_none()
    
    if not hub:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Request hub {hub_id} not found in workspace {workspace_id}"
        )
    
    # Update positions
    for item in reorder_data.tabs:
        stmt = (
            update(RequestHubTab)
            .where(
                RequestHubTab.id == item.id,
                RequestHubTab.hub_id == hub_id
            )
            .values(position=item.position)
        )
        await session.execute(stmt)
    
    await session.commit()
    
    # Return updated tabs
    stmt = (
        select(RequestHubTab)
        .where(RequestHubTab.hub_id == hub_id)
        .order_by(RequestHubTab.position)
    )
    result = await session.execute(stmt)
    tabs = result.scalars().all()
    
    return tabs
