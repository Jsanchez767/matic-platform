"""API endpoints for data tables/sheets."""

import re
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..db.session import get_session
from ..models import DataTable, TableColumn, TableComment, TableRow, TableView
from ..schemas import (
    DataTableCreate,
    DataTableRead,
    DataTableUpdate,
    DataTableWithRows,
    TableColumnCreate,
    TableColumnSchema,
    TableColumnUpdate,
    TableCommentCreate,
    TableCommentRead,
    TableRowBulkCreate,
    TableRowCreate,
    TableRowSchema,
    TableRowUpdate,
    TableViewCreate,
    TableViewSchema,
    TableViewUpdate,
)

router = APIRouter()


def generate_slug(name: str) -> str:
    """Generate a URL-friendly slug from a name."""
    # Convert to lowercase
    slug = name.lower()
    # Replace spaces and special characters with hyphens
    slug = re.sub(r'[^\w\s-]', '', slug)
    slug = re.sub(r'[-\s]+', '-', slug)
    # Remove leading/trailing hyphens
    slug = slug.strip('-')
    return slug


@router.get("/", response_model=List[DataTableRead])
async def list_tables(
    workspace_id: UUID = Query(...),
    include_archived: bool = Query(False),
    session: AsyncSession = Depends(get_session),
):
    """List all tables in a workspace."""
    stmt = (
        select(DataTable)
        .options(selectinload(DataTable.columns))
        .where(DataTable.workspace_id == workspace_id)
    )
    
    if not include_archived:
        stmt = stmt.where(DataTable.is_archived == False)
    
    stmt = stmt.order_by(DataTable.created_at.desc())
    
    result = await session.execute(stmt)
    tables = result.scalars().all()
    return tables


@router.get("/{table_id}", response_model=DataTableRead)
async def get_table(
    table_id: UUID,
    session: AsyncSession = Depends(get_session),
):
    """Get a single table by ID."""
    stmt = (
        select(DataTable)
        .options(selectinload(DataTable.columns))
        .where(DataTable.id == table_id)
    )
    result = await session.execute(stmt)
    table = result.scalar_one_or_none()
    
    if not table:
        raise HTTPException(status_code=404, detail="Table not found")
    
    return table


@router.post("/", response_model=DataTableRead)
async def create_table(
    table_data: DataTableCreate,
    session: AsyncSession = Depends(get_session),
):
    """Create a new table with columns."""
    # Create table
    table = DataTable(
        workspace_id=table_data.workspace_id,
        name=table_data.name,
        slug=table_data.slug,
        description=table_data.description,
        icon=table_data.icon,
        color=table_data.color,
        settings=table_data.settings,
        import_source=table_data.import_source,
        import_metadata=table_data.import_metadata,
        is_archived=table_data.is_archived,
        created_by=table_data.created_by,
    )
    
    session.add(table)
    await session.flush()  # Get table.id
    
    # Create columns
    for col_data in table_data.columns:
        column = TableColumn(
            table_id=table.id,
            name=col_data.name,
            label=col_data.label,
            description=col_data.description,
            column_type=col_data.column_type,
            settings=col_data.settings,
            validation=col_data.validation,
            formula=col_data.formula,
            formula_dependencies=col_data.formula_dependencies,
            linked_table_id=col_data.linked_table_id,
            linked_column_id=col_data.linked_column_id,
            rollup_function=col_data.rollup_function,
            position=col_data.position,
            width=col_data.width,
            is_visible=col_data.is_visible,
            is_primary=col_data.is_primary,
        )
        session.add(column)
    
    await session.commit()
    await session.refresh(table)
    
    # Load columns for response
    stmt = (
        select(DataTable)
        .options(selectinload(DataTable.columns))
        .where(DataTable.id == table.id)
    )
    result = await session.execute(stmt)
    return result.scalar_one()


@router.put("/{table_id}", response_model=DataTableRead)
async def update_table(
    table_id: UUID,
    table_data: DataTableUpdate,
    session: AsyncSession = Depends(get_session),
):
    """Update a table."""
    stmt = select(DataTable).where(DataTable.id == table_id)
    result = await session.execute(stmt)
    table = result.scalar_one_or_none()
    
    if not table:
        raise HTTPException(status_code=404, detail="Table not found")
    
    # Update fields
    if table_data.name is not None:
        table.name = table_data.name
        # Auto-generate slug from name if not provided
        if table_data.slug is None:
            table.slug = generate_slug(table_data.name)
    if table_data.slug is not None:
        table.slug = table_data.slug
    if table_data.description is not None:
        table.description = table_data.description
    if table_data.icon is not None:
        table.icon = table_data.icon
    if table_data.color is not None:
        table.color = table_data.color
    if table_data.settings is not None:
        table.settings = table_data.settings
    if table_data.is_archived is not None:
        table.is_archived = table_data.is_archived
    
    await session.commit()
    await session.refresh(table)
    
    # Load columns for response
    stmt = (
        select(DataTable)
        .options(selectinload(DataTable.columns))
        .where(DataTable.id == table.id)
    )
    result = await session.execute(stmt)
    return result.scalar_one()


@router.delete("/{table_id}")
async def delete_table(
    table_id: UUID,
    session: AsyncSession = Depends(get_session),
):
    """Delete a table."""
    stmt = select(DataTable).where(DataTable.id == table_id)
    result = await session.execute(stmt)
    table = result.scalar_one_or_none()
    
    if not table:
        raise HTTPException(status_code=404, detail="Table not found")
    
    await session.delete(table)
    await session.commit()
    
    return {"message": "Table deleted successfully"}


# Column endpoints
@router.post("/{table_id}/columns", response_model=TableColumnSchema)
async def create_column(
    table_id: UUID,
    column_data: TableColumnCreate,
    session: AsyncSession = Depends(get_session),
):
    """Add a new column to a table."""
    # Verify table exists
    stmt = select(DataTable).where(DataTable.id == table_id)
    result = await session.execute(stmt)
    table = result.scalar_one_or_none()
    
    if not table:
        raise HTTPException(status_code=404, detail="Table not found")
    
    # Create column
    column = TableColumn(
        table_id=table_id,
        name=column_data.name,
        label=column_data.label,
        description=column_data.description,
        column_type=column_data.column_type,
        settings=column_data.settings,
        validation=column_data.validation,
        formula=column_data.formula,
        formula_dependencies=column_data.formula_dependencies,
        linked_table_id=column_data.linked_table_id,
        linked_column_id=column_data.linked_column_id,
        rollup_function=column_data.rollup_function,
        position=column_data.position,
        width=column_data.width,
        is_visible=column_data.is_visible,
        is_primary=column_data.is_primary,
    )
    
    session.add(column)
    await session.commit()
    await session.refresh(column)
    
    return column


@router.patch("/{table_id}/columns/{column_id}", response_model=TableColumnSchema)
async def update_column(
    table_id: UUID,
    column_id: UUID,
    column_data: TableColumnUpdate,
    session: AsyncSession = Depends(get_session),
):
    """Update a column."""
    stmt = select(TableColumn).where(
        TableColumn.table_id == table_id,
        TableColumn.id == column_id
    )
    result = await session.execute(stmt)
    column = result.scalar_one_or_none()
    
    if not column:
        raise HTTPException(status_code=404, detail="Column not found")
    
    # Update fields
    if column_data.name is not None:
        column.name = column_data.name
    if column_data.label is not None:
        column.label = column_data.label
    if column_data.description is not None:
        column.description = column_data.description
    if column_data.column_type is not None:
        column.column_type = column_data.column_type
    if column_data.settings is not None:
        column.settings = column_data.settings
    if column_data.validation is not None:
        column.validation = column_data.validation
    if column_data.formula is not None:
        column.formula = column_data.formula
    if column_data.formula_dependencies is not None:
        column.formula_dependencies = column_data.formula_dependencies
    if column_data.linked_table_id is not None:
        column.linked_table_id = column_data.linked_table_id
    if column_data.linked_column_id is not None:
        column.linked_column_id = column_data.linked_column_id
    if column_data.rollup_function is not None:
        column.rollup_function = column_data.rollup_function
    if column_data.position is not None:
        column.position = column_data.position
    if column_data.width is not None:
        column.width = column_data.width
    if column_data.is_visible is not None:
        column.is_visible = column_data.is_visible
    if column_data.is_primary is not None:
        column.is_primary = column_data.is_primary
    
    await session.commit()
    await session.refresh(column)
    
    return column


@router.delete("/{table_id}/columns/{column_id}")
async def delete_column(
    table_id: UUID,
    column_id: UUID,
    session: AsyncSession = Depends(get_session),
):
    """Delete a column."""
    stmt = select(TableColumn).where(
        TableColumn.table_id == table_id,
        TableColumn.id == column_id
    )
    result = await session.execute(stmt)
    column = result.scalar_one_or_none()
    
    if not column:
        raise HTTPException(status_code=404, detail="Column not found")
    
    await session.delete(column)
    await session.commit()
    
    return {"message": "Column deleted successfully"}


# Row endpoints
@router.get("/{table_id}/rows", response_model=List[TableRowSchema])
async def list_rows(
    table_id: UUID,
    include_archived: bool = Query(False),
    limit: int = Query(100, le=1000),
    offset: int = Query(0),
    session: AsyncSession = Depends(get_session),
):
    """List rows in a table."""
    stmt = select(TableRow).where(TableRow.table_id == table_id)
    
    if not include_archived:
        stmt = stmt.where(TableRow.is_archived == False)
    
    stmt = stmt.order_by(TableRow.position).limit(limit).offset(offset)
    
    result = await session.execute(stmt)
    rows = result.scalars().all()
    return rows


@router.get("/{table_id}/rows/{row_id}", response_model=TableRowSchema)
async def get_row(
    table_id: UUID,
    row_id: UUID,
    session: AsyncSession = Depends(get_session),
):
    """Get a single row."""
    stmt = select(TableRow).where(
        TableRow.table_id == table_id,
        TableRow.id == row_id
    )
    result = await session.execute(stmt)
    row = result.scalar_one_or_none()
    
    if not row:
        raise HTTPException(status_code=404, detail="Row not found")
    
    return row


@router.post("/{table_id}/rows", response_model=TableRowSchema)
async def create_row(
    table_id: UUID,
    row_data: TableRowCreate,
    session: AsyncSession = Depends(get_session),
):
    """Create a new row."""
    row = TableRow(
        table_id=table_id,
        data=row_data.data,
        metadata_=row_data.metadata,
        position=row_data.position,
        created_by=row_data.created_by,
    )
    
    session.add(row)
    await session.commit()
    await session.refresh(row)
    
    return row


@router.post("/{table_id}/rows/bulk", response_model=List[TableRowSchema])
async def create_rows_bulk(
    table_id: UUID,
    bulk_data: TableRowBulkCreate,
    session: AsyncSession = Depends(get_session),
):
    """Create multiple rows at once (for imports)."""
    rows = []
    for idx, data in enumerate(bulk_data.rows):
        row = TableRow(
            table_id=table_id,
            data=data,
            metadata={},
            position=float(idx),
            created_by=bulk_data.created_by,
        )
        session.add(row)
        rows.append(row)
    
    await session.commit()
    
    # Refresh all rows
    for row in rows:
        await session.refresh(row)
    
    return rows


@router.put("/{table_id}/rows/{row_id}", response_model=TableRowSchema)
async def update_row(
    table_id: UUID,
    row_id: UUID,
    row_data: TableRowUpdate,
    session: AsyncSession = Depends(get_session),
):
    """Update a row."""
    stmt = select(TableRow).where(
        TableRow.table_id == table_id,
        TableRow.id == row_id
    )
    result = await session.execute(stmt)
    row = result.scalar_one_or_none()
    
    if not row:
        raise HTTPException(status_code=404, detail="Row not found")
    
    if row_data.data is not None:
        row.data = row_data.data
    if row_data.metadata is not None:
        row.metadata = row_data.metadata
    if row_data.is_archived is not None:
        row.is_archived = row_data.is_archived
    if row_data.position is not None:
        row.position = row_data.position
    
    row.updated_by = row_data.updated_by
    
    await session.commit()
    await session.refresh(row)
    
    return row


@router.delete("/{table_id}/rows/{row_id}")
async def delete_row(
    table_id: UUID,
    row_id: UUID,
    session: AsyncSession = Depends(get_session),
):
    """Delete a row."""
    stmt = select(TableRow).where(
        TableRow.table_id == table_id,
        TableRow.id == row_id
    )
    result = await session.execute(stmt)
    row = result.scalar_one_or_none()
    
    if not row:
        raise HTTPException(status_code=404, detail="Row not found")
    
    await session.delete(row)
    await session.commit()
    
    return {"message": "Row deleted successfully"}


# View endpoints
@router.get("/{table_id}/views", response_model=List[TableViewSchema])
async def list_views(
    table_id: UUID,
    session: AsyncSession = Depends(get_session),
):
    """List all views for a table."""
    stmt = select(TableView).where(TableView.table_id == table_id).order_by(TableView.created_at)
    result = await session.execute(stmt)
    views = result.scalars().all()
    return views


@router.post("/{table_id}/views", response_model=TableViewSchema)
async def create_view(
    table_id: UUID,
    view_data: TableViewCreate,
    session: AsyncSession = Depends(get_session),
):
    """Create a new view."""
    view = TableView(
        table_id=table_id,
        name=view_data.name,
        description=view_data.description,
        view_type=view_data.view_type,
        settings=view_data.settings,
        filters=view_data.filters,
        sorts=view_data.sorts,
        grouping=view_data.grouping,
        created_by=view_data.created_by,
    )
    
    session.add(view)
    await session.commit()
    await session.refresh(view)
    
    return view


@router.put("/{table_id}/views/{view_id}", response_model=TableViewSchema)
async def update_view(
    table_id: UUID,
    view_id: UUID,
    view_data: TableViewUpdate,
    session: AsyncSession = Depends(get_session),
):
    """Update a view."""
    stmt = select(TableView).where(
        TableView.table_id == table_id,
        TableView.id == view_id
    )
    result = await session.execute(stmt)
    view = result.scalar_one_or_none()
    
    if not view:
        raise HTTPException(status_code=404, detail="View not found")
    
    if view_data.name is not None:
        view.name = view_data.name
    if view_data.description is not None:
        view.description = view_data.description
    if view_data.settings is not None:
        view.settings = view_data.settings
    if view_data.filters is not None:
        view.filters = view_data.filters
    if view_data.sorts is not None:
        view.sorts = view_data.sorts
    if view_data.grouping is not None:
        view.grouping = view_data.grouping
    if view_data.is_shared is not None:
        view.is_shared = view_data.is_shared
    if view_data.is_locked is not None:
        view.is_locked = view_data.is_locked
    
    await session.commit()
    await session.refresh(view)
    
    return view


@router.delete("/{table_id}/views/{view_id}")
async def delete_view(
    table_id: UUID,
    view_id: UUID,
    session: AsyncSession = Depends(get_session),
):
    """Delete a view."""
    stmt = select(TableView).where(
        TableView.table_id == table_id,
        TableView.id == view_id
    )
    result = await session.execute(stmt)
    view = result.scalar_one_or_none()
    
    if not view:
        raise HTTPException(status_code=404, detail="View not found")
    
    await session.delete(view)
    await session.commit()
    
    return {"message": "View deleted successfully"}


# Comment endpoints
@router.get("/{table_id}/rows/{row_id}/comments", response_model=List[TableCommentRead])
async def list_comments(
    table_id: UUID,
    row_id: UUID,
    session: AsyncSession = Depends(get_session),
):
    """List comments for a row."""
    stmt = (
        select(TableComment)
        .where(
            TableComment.table_id == table_id,
            TableComment.row_id == row_id
        )
        .order_by(TableComment.created_at)
    )
    result = await session.execute(stmt)
    comments = result.scalars().all()
    return comments


@router.post("/{table_id}/rows/{row_id}/comments", response_model=TableCommentRead)
async def create_comment(
    table_id: UUID,
    row_id: UUID,
    comment_data: TableCommentCreate,
    session: AsyncSession = Depends(get_session),
):
    """Create a comment on a row."""
    comment = TableComment(
        table_id=table_id,
        row_id=row_id,
        content=comment_data.content,
        parent_comment_id=comment_data.parent_comment_id,
        created_by=comment_data.created_by,
    )
    
    session.add(comment)
    await session.commit()
    await session.refresh(comment)
    
    return comment
