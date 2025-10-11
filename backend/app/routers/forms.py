"""Form API routes."""

from __future__ import annotations

from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.session import get_session
from app.models.form import Form, FormField
from app.schemas.forms import FormCreate, FormRead, FormUpdate

router = APIRouter()


@router.get("/", response_model=List[FormRead])
async def list_forms(
    workspace_id: UUID = Query(..., description="Workspace identifier for scoping forms."),
    session: AsyncSession = Depends(get_session),
) -> List[FormRead]:
    stmt = (
        select(Form)
        .where(Form.workspace_id == workspace_id)
        .options(selectinload(Form.fields))
        .order_by(Form.created_at.desc())
    )
    result = await session.execute(stmt)
    forms = result.scalars().unique().all()
    return forms


@router.get("/{form_id}", response_model=FormRead)
async def get_form(
    form_id: UUID,
    session: AsyncSession = Depends(get_session),
) -> FormRead:
    stmt = select(Form).where(Form.id == form_id).options(selectinload(Form.fields))
    result = await session.execute(stmt)
    form = result.scalars().first()
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")
    return form


@router.post("/", response_model=FormRead, status_code=201)
async def create_form(
    payload: FormCreate,
    session: AsyncSession = Depends(get_session),
) -> FormRead:
    form = Form(
        workspace_id=payload.workspace_id,
        name=payload.name,
        description=payload.description,
        slug=payload.slug,
        settings=payload.settings,
        submit_settings=payload.submit_settings,
        status=payload.status,
        is_public=payload.is_public,
        created_by=payload.created_by,
    )
    session.add(form)
    await session.flush()

    for index, field in enumerate(payload.fields):
        session.add(
            FormField(
                form_id=form.id,
                name=field.name,
                label=field.label,
                placeholder=field.placeholder,
                description=field.description,
                field_type=field.field_type,
                settings=field.settings,
                validation=field.validation,
                options=field.options,
                position=field.position or index,
                width=field.width,
                is_visible=field.is_visible,
            )
        )

    await session.commit()
    await session.refresh(form)
    return form


@router.put("/{form_id}", response_model=FormRead)
async def update_form(
    form_id: UUID,
    payload: FormUpdate,
    session: AsyncSession = Depends(get_session),
) -> FormRead:
    stmt = select(Form).where(Form.id == form_id).options(selectinload(Form.fields))
    result = await session.execute(stmt)
    form = result.scalars().first()
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")

    form.name = payload.name
    form.description = payload.description
    form.slug = payload.slug
    form.settings = payload.settings
    form.submit_settings = payload.submit_settings
    form.status = payload.status
    form.is_public = payload.is_public
    if payload.version is not None:
        form.version = payload.version

    if payload.fields is not None:
        # Remove existing fields to simplify update semantics
        await session.execute(delete(FormField).where(FormField.form_id == form.id))
        for index, field in enumerate(payload.fields):
            session.add(
                FormField(
                    form_id=form.id,
                    name=field.name,
                    label=field.label,
                    placeholder=field.placeholder,
                    description=field.description,
                    field_type=field.field_type,
                    settings=field.settings,
                    validation=field.validation,
                    options=field.options,
                    position=field.position or index,
                    width=field.width,
                    is_visible=field.is_visible,
                )
            )

    await session.commit()
    await session.refresh(form)
    return form
