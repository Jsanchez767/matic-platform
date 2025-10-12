# Matic Platform - AI Agent Instructions

## Project Overview
Full-stack Airtable-like platform with forms and data tables, currently migrating from Supabase direct queries to FastAPI backend. Built with Next.js 14 (App Router), FastAPI, PostgreSQL (Supabase), and TypeScript.

## Architecture

### Stack Components
- **Frontend**: Next.js 14 App Router (`src/app/`), React 18, TypeScript, Tailwind CSS
- **Backend**: FastAPI with async SQLAlchemy 2.0, running on `localhost:8000`
- **Database**: PostgreSQL (Supabase) with 18 tables defined in `001_initial_schema.sql`
- **Auth**: Supabase Auth (token-based, managed via `src/lib/supabase.ts`)

### Data Flow Pattern
```
Client Component → API Client (`src/lib/api/*-client.ts`) 
  → Next.js Proxy (`/api/*` in next.config.js) 
  → FastAPI Router (`backend/app/routers/*.py`) 
  → SQLAlchemy Model (`backend/app/models/*.py`) 
  → PostgreSQL
```

**Critical**: Frontend never queries Supabase directly anymore (except auth). All data operations go through FastAPI.

## Key Conventions

### Backend (FastAPI)
- **Models**: Use SQLAlchemy 2.0 async style with `Mapped[]` types in `backend/app/models/`
- **Schemas**: Pydantic v1 style (project uses pydantic 1.x) in `backend/app/schemas/`
- **Session management**: Always use `AsyncSession = Depends(get_session)` - session commits/rollbacks handled automatically
- **Response models**: All endpoints use `response_model` with Pydantic schemas for type safety
- **Auth**: Supabase Auth tokens passed via `Authorization: Bearer <token>` header, user_id passed as query param for now
- **CORS**: Configured in `backend/app/main.py` - add new frontend domains here

Example endpoint pattern:
```python
@router.get("/{id}", response_model=DataTableRead)
async def get_table(
    table_id: UUID,
    session: AsyncSession = Depends(get_session),
):
    stmt = select(DataTable).options(selectinload(DataTable.columns)).where(...)
    result = await session.execute(stmt)
    return result.scalar_one_or_none()
```

### Frontend (Next.js)
- **Client components**: Mark with `"use client"` - used for all interactive UI (most components)
- **Import aliases**: Use `@/` prefix (configured in `tsconfig.json`) - e.g., `@/lib/api/data-tables-client`
- **API clients**: Centralized in `src/lib/api/*-client.ts` - always use these, never fetch directly
- **Auth**: Get token via `getSessionToken()` from `@/lib/supabase`, pass in headers as `Authorization: Bearer <token>`
- **Types**: Match backend schemas exactly, defined in `src/types/*.ts`
- **Styling**: Tailwind with shadcn/ui components in `src/ui-components/` - use `cn()` for conditional classes

### Tab System (Critical Pattern)
Workspace UI uses persistent tab system managed by `TabManager` (`src/lib/tab-manager.ts`):
- Tabs stored in localStorage per workspace
- `WorkspaceTabProvider.tsx` wraps workspace pages
- Always route through tab system, not direct Next.js navigation
- Overview tab auto-created if all tabs closed

## Development Workflows

### Starting the Stack
```bash
# Terminal 1 - Backend
cd backend
source .venv/bin/activate  # or: python -m venv .venv && source .venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2 - Frontend
npm run dev
```

**Access**:
- Frontend: http://localhost:3000
- API Docs: http://localhost:8000/docs (interactive Swagger UI)
- Direct API: http://localhost:8000/api/*

### Environment Setup
- Backend: `backend/.env` with `DATABASE_URL=postgresql+asyncpg://...` (Supabase connection string)
- Frontend: `.env.local` with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Adding New Features

**For data tables/forms features** (20+ column types, 6 view types):
1. Check if column type exists in `backend/app/models/data_table.py` (TableColumn.column_type)
2. Update backend schema if needed (`backend/app/schemas/data_tables.py`)
3. Add frontend types (`src/types/data-tables.ts`)
4. Add API client methods (`src/lib/api/data-tables-client.ts`)
5. Test in http://localhost:8000/docs first

**For new routers**:
1. Create router in `backend/app/routers/your_feature.py`
2. Register in `backend/app/routers/__init__.py` with `api_router.include_router()`
3. Create corresponding API client in `src/lib/api/your-feature-client.ts`

## Migration Context (Read Before Large Changes)

**Status**: Partially migrated from Supabase direct queries to FastAPI
- ✅ Backend: 100% complete (23 endpoints, all CRUD operations)
- ✅ Authentication: Supabase Auth integrated, token passed to API
- ✅ FormBuilder.tsx: Migrated to use FastAPI
- ⏸️ NavigationLayout, useWorkspaceDiscovery, hybrid-search: Still use Supabase queries

**Reference docs** in project root:
- `MIGRATION_PROGRESS.md` - What's been migrated
- `SUPABASE_MIGRATION_CATALOG.md` - Map of old Supabase queries to new API endpoints
- `FULLSTACK_COMPLETE.md` - Architecture overview

When migrating components:
1. Search for `.from('table_name')` - these are Supabase queries to replace
2. Find equivalent in API clients (`src/lib/api/`)
3. Remove Supabase imports, add API client imports
4. Update async patterns (Supabase uses different promise patterns)

## Database Schema Essentials

**Core hierarchy**: `organizations` → `workspaces` → `forms`/`data_tables`

**Tables (Airtable-like sheets)**:
- `data_tables` - Table definitions
- `table_columns` - Column schemas (supports 20+ types: text, number, select, lookup, formula, etc.)
- `table_rows` - Data stored as JSONB in `data` field
- `table_views` - Grid, kanban, calendar, gallery, timeline, form views
- `table_links` + `table_row_links` - Cross-table relationships

**Column types to know**: text, number, select, multiselect, date, datetime, checkbox, url, email, phone, attachment, user, lookup, rollup, formula, autonumber, rating, duration, currency, progress

**Forms**:
- `forms` + `form_fields` - Form definitions
- `form_submissions` - Submitted data
- `form_table_connections` - Link forms to populate tables

## Common Pitfalls

1. **Trailing slashes in API endpoints**: Always use endpoints **without** trailing slashes for consistency - e.g., `/tables/{id}/rows` not `/tables/{id}/rows/`
2. **SQLAlchemy relationships**: Use `selectinload()` for eager loading to avoid N+1 queries - especially with `columns` relationships
3. **Metadata field collision**: In models, use `metadata_: Mapped[dict] = mapped_column("metadata", ...)` (underscore suffix)
4. **UUID handling**: Backend uses `UUID(as_uuid=True)`, frontend uses strings - conversion automatic via Pydantic
5. **Client components**: Most components need `"use client"` - server components can't use hooks/events
6. **CORS**: Add new domains to `backend/app/main.py` CORS middleware

## File Reference

**Essential files for understanding**:
- `001_initial_schema.sql` - Complete DB schema (single source of truth)
- `backend/app/main.py` - FastAPI app entry, CORS config
- `backend/app/routers/__init__.py` - All API endpoints registered
- `src/lib/api/data-tables-client.ts` - Reference implementation for API clients
- `src/components/NavigationLayout.tsx` - Main app shell (still being migrated)
- `backend/app/models/data_table.py` - Complex relationship patterns

**Legacy/reference** (don't copy patterns from these):
- `old-app-files/` - Original implementation before migration
- `*.original.tsx` / `*.old.tsx` - Backup files during migration
