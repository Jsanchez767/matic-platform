# Matic Platform - Complete Documentation

> **Comprehensive documentation for the Matic Platform - Full-stack Airtable-like application with forms and data tables**

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture & Stack](#architecture--stack)
3. [Setup & Installation](#setup--installation)
4. [Database Schema](#database-schema)
5. [Backend Implementation](#backend-implementation)
6. [Frontend Implementation](#frontend-implementation)
7. [Authentication System](#authentication-system)
8. [Migration Progress](#migration-progress)
9. [Features](#features)
10. [Troubleshooting](#troubleshooting)
11. [Deployment](#deployment)
12. [Development Workflows](#development-workflows)
13. [API Documentation](#api-documentation)

---

## Project Overview

Matic Platform is a full-stack Airtable-like platform with forms and data tables, currently migrating from Supabase direct queries to FastAPI backend. Built with Next.js 14 (App Router), FastAPI, PostgreSQL (Supabase), and TypeScript.

### Key Features
- **Airtable-like Tables**: 20+ column types, 6 view types, relationships
- **Form Builder**: Dynamic forms with table connections
- **Real-time Updates**: WebSocket support for collaborative editing
- **Authentication**: Supabase Auth with workspace management
- **Multi-workspace**: Organization → Workspace → Tables/Forms hierarchy

---

## Architecture & Stack

### Stack Components
- **Frontend**: Next.js 14 App Router (`src/app/`), React 18, TypeScript, Tailwind CSS
- **Backend**: FastAPI with async SQLAlchemy 2.0, running on `localhost:8000`
- **Database**: PostgreSQL (Supabase) with 18 tables defined in `001_initial_schema.sql`
- **Auth**: Supabase Auth (token-based, managed via `src/lib/supabase.ts`)
- **Real-time**: WebSocket connections, Supabase subscriptions

### Data Flow Pattern
```
Client Component → API Client (`src/lib/api/*-client.ts`) 
  → Next.js Proxy (`/api/*` in next.config.js) 
  → FastAPI Router (`backend/app/routers/*.py`) 
  → SQLAlchemy Model (`backend/app/models/*.py`) 
  → PostgreSQL
```

**Critical**: Frontend never queries Supabase directly anymore (except auth). All data operations go through FastAPI.

---

## Setup & Installation

### Prerequisites
- Python 3.9+
- Node.js 18+
- PostgreSQL database (Supabase)

### Environment Setup

#### Backend Environment (`backend/.env`)
```bash
DATABASE_URL=postgresql+asyncpg://postgres:[password]@[host]:5432/postgres
```

#### Frontend Environment (`.env.local`)
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

### Starting the Stack

#### Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend
```bash
npm install
npm run dev
```

### Access Points
- **Frontend**: http://localhost:3000
- **API Docs**: http://localhost:8000/docs (interactive Swagger UI)
- **Direct API**: http://localhost:8000/api/*

---

## Database Schema

### Core Hierarchy
`organizations` → `workspaces` → `forms`/`data_tables`

### Key Tables

#### Core Structure
- **organizations** - Top-level organization management
- **workspaces** - Project workspaces within organizations
- **users** - User management and authentication

#### Data Tables (Airtable-like)
- **data_tables** - Table definitions
- **table_columns** - Column schemas (supports 20+ types)
- **table_rows** - Data stored as JSONB in `data` field
- **table_views** - Grid, kanban, calendar, gallery, timeline, form views
- **table_links** + **table_row_links** - Cross-table relationships

#### Forms
- **forms** + **form_fields** - Form definitions
- **form_submissions** - Submitted data
- **form_table_connections** - Link forms to populate tables

#### Column Types Supported
text, number, select, multiselect, date, datetime, checkbox, url, email, phone, attachment, user, lookup, rollup, formula, autonumber, rating, duration, currency, progress, link

### Database Constraints
Recent fix: Added 'link' column type to `table_columns_column_type_check` constraint to enable table relationships.

---

## Backend Implementation

### FastAPI Structure
```
backend/
├── app/
│   ├── main.py              # FastAPI app entry, CORS config
│   ├── core/
│   │   ├── config.py        # Configuration management
│   │   └── __init__.py
│   ├── db/
│   │   ├── session.py       # Database session management
│   │   └── __init__.py
│   ├── models/              # SQLAlchemy models
│   │   ├── base.py
│   │   ├── organization.py
│   │   ├── workspace.py
│   │   ├── data_table.py    # Complex relationship patterns
│   │   └── form.py
│   ├── schemas/             # Pydantic schemas
│   │   ├── data_tables.py
│   │   ├── forms.py
│   │   └── workspaces.py
│   └── routers/             # API endpoints
│       ├── __init__.py      # All routes registered here
│       ├── workspaces.py
│       ├── data_tables.py
│       └── forms.py
```

### Key Conventions

#### Models (SQLAlchemy 2.0)
- Use `Mapped[]` types with async SQLAlchemy
- Metadata field collision: Use `metadata_: Mapped[dict] = mapped_column("metadata", ...)`
- Relationships with `selectinload()` for eager loading

#### Session Management
- Always use `AsyncSession = Depends(get_session)`
- Session commits/rollbacks handled automatically
- No manual session management required

#### Response Models
- All endpoints use `response_model` with Pydantic schemas
- Type safety enforced throughout

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

### API Endpoints (23 total)

#### Workspaces (2 endpoints)
- `GET /api/workspaces` - List workspaces
- `POST /api/workspaces` - Create workspace

#### Data Tables (17 endpoints)
- `GET /api/tables` - List tables
- `POST /api/tables` - Create table
- `GET /api/tables/{id}` - Get table details
- `PUT /api/tables/{id}` - Update table
- `DELETE /api/tables/{id}` - Delete table
- `GET /api/tables/{id}/rows` - List table rows
- `POST /api/tables/{id}/rows` - Create row
- `GET /api/tables/{id}/rows/{row_id}` - Get row
- `PUT /api/tables/{id}/rows/{row_id}` - Update row
- `DELETE /api/tables/{id}/rows/{row_id}` - Delete row
- `POST /api/tables/{id}/columns` - Create column
- `PUT /api/tables/{id}/columns/{column_id}` - Update column
- `DELETE /api/tables/{id}/columns/{column_id}` - Delete column
- `GET /api/tables/{id}/views` - List views
- `POST /api/tables/{id}/views` - Create view
- `PUT /api/tables/{id}/views/{view_id}` - Update view
- `DELETE /api/tables/{id}/views/{view_id}` - Delete view

#### Forms (4 endpoints)
- `GET /api/forms` - List forms
- `POST /api/forms` - Create form
- `GET /api/forms/{id}` - Get form details
- `PUT /api/forms/{id}` - Update form

---

## Frontend Implementation

### Next.js 14 App Router Structure
```
src/
├── app/                     # Next.js App Router pages
│   ├── globals.css
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Home page
│   ├── providers.tsx       # Context providers
│   ├── login/              # Authentication pages
│   │   └── page.tsx
│   ├── signup/
│   │   └── page.tsx
│   ├── workspaces/         # Workspace listing
│   │   └── page.tsx
│   └── workspace/          # Individual workspace
│       └── [slug]/
│           └── page.tsx
├── components/             # React components
│   ├── NavigationLayout.tsx
│   ├── WorkspaceTabProvider.tsx
│   ├── TabContentRouter.tsx
│   ├── TabNavigation.tsx
│   ├── Tables/
│   │   ├── TableGridView.tsx
│   │   ├── ColumnEditorModal.tsx
│   │   └── RealTimeLinkField.tsx
│   ├── Canvas/
│   ├── CommandPalette/
│   └── ModulePalette/
├── lib/                    # Utilities and API clients
│   ├── api/
│   │   ├── data-tables-client.ts
│   │   ├── workspaces-client.ts
│   │   └── forms-client.ts
│   ├── supabase.ts         # Auth management
│   ├── tab-manager.ts      # Tab system
│   └── utils.ts
├── types/                  # TypeScript definitions
│   ├── data-tables.ts
│   ├── workspaces.ts
│   └── forms.ts
└── ui-components/          # shadcn/ui components
    ├── button.tsx
    ├── input.tsx
    ├── dialog.tsx
    └── ...
```

### Key Conventions

#### Client Components
- Mark with `"use client"` for interactive UI
- Most components need this due to hooks/events
- Server components for static content only

#### Import Aliases
- Use `@/` prefix (configured in `tsconfig.json`)
- Example: `@/lib/api/data-tables-client`

#### API Clients
- Centralized in `src/lib/api/*-client.ts`
- Always use these, never fetch directly
- Pass Supabase token in headers: `Authorization: Bearer <token>`

#### Styling
- Tailwind CSS with shadcn/ui components
- Use `cn()` utility for conditional classes
- Consistent design system

### Tab System (Critical Pattern)
Workspace UI uses persistent tab system managed by `TabManager`:
- Tabs stored in localStorage per workspace
- `WorkspaceTabProvider.tsx` wraps workspace pages
- Always route through tab system, not direct Next.js navigation
- Overview tab auto-created if all tabs closed

---

## Authentication System

### Supabase Auth Integration
- Token-based authentication
- User management via Supabase
- Session handling in `src/lib/supabase.ts`

### Sign Up Flow
1. User enters email, password, workspace name
2. Creates Supabase auth account
3. Gets authentication token
4. Creates workspace via backend API
5. Redirects to `/workspace/{slug}`

### Authentication Guards
- Protected routes check for valid session
- Token passed to all API calls
- Automatic redirect to login if unauthenticated

### User ID Handling
- Supabase Auth tokens passed via `Authorization: Bearer <token>` header
- `user_id` passed as query param for now (interim solution)
- Session management handled by Supabase client

---

## Migration Progress

### Migration Status
**Status**: Partially migrated from Supabase direct queries to FastAPI

#### Completed ✅
- Backend: 100% complete (23 endpoints, all CRUD operations)
- Authentication: Supabase Auth integrated, token passed to API
- FormBuilder.tsx: Migrated to use FastAPI
- TypeScript types: Complete alignment with backend schemas
- API clients: Centralized and consistent

#### In Progress ⏸️
- NavigationLayout: Still uses some Supabase queries
- useWorkspaceDiscovery: Hybrid Supabase/API approach
- Real-time updates: Supabase subscriptions + API updates

#### Migration Pattern
When migrating components:
1. Search for `.from('table_name')` - these are Supabase queries to replace
2. Find equivalent in API clients (`src/lib/api/`)
3. Remove Supabase imports, add API client imports
4. Update async patterns (different promise handling)

---

## Features

### Data Tables (Airtable-like)

#### Column Types (20+ supported)
- **Basic**: text, number, email, url, phone
- **Selection**: select, multiselect
- **Date/Time**: date, datetime
- **Media**: attachment, image
- **Advanced**: user, formula, rollup, lookup, link
- **Specialized**: rating, currency, percent, duration, barcode, button

#### View Types (6 supported)
- **Grid**: Spreadsheet-like table view
- **Kanban**: Card-based workflow view
- **Calendar**: Date-based calendar view
- **Gallery**: Image-focused gallery view
- **Timeline**: Gantt-chart style timeline
- **Form**: Form view for data entry

#### Table Relationships
- **Link Fields**: Connect records across tables
- **Lookup Fields**: Pull data from linked records
- **Rollup Fields**: Aggregate data from linked records
- **Formula Fields**: Calculated values

### Form Builder
- Dynamic form creation
- Field type mapping to table columns
- Form-to-table data connections
- Submission handling and storage

### Real-time Features
- WebSocket connections for live updates
- Collaborative editing support
- Status indicators for connection state
- Auto-reconnect functionality

### Link Fields Implementation

#### Database Schema
- `table_columns.linked_table_id` - Target table reference
- `table_links` - Relationship metadata
- `table_row_links` - Actual record connections

#### UI Components
- Purple-themed link field interface
- Record selection dropdown with search
- Multiple link support
- Remove individual links functionality

#### Recent Fix
Added 'link' to database constraint to enable link column creation:
```sql
ALTER TABLE table_columns ADD CONSTRAINT table_columns_column_type_check 
CHECK (column_type IN (..., 'link', ...));
```

---

## Troubleshooting

### Common Issues

#### Database Constraint Errors
**Problem**: `CheckViolationError: new row for relation "table_columns" violates check constraint`
**Solution**: Apply migration to add 'link' to allowed column types

#### WebSocket Connection Issues
**Problem**: Status not showing or slow updates
**Solution**: Check backend URL in environment, ensure localhost:8000 for development

#### CORS Errors
**Problem**: Cross-origin requests blocked
**Solution**: Add frontend domain to CORS middleware in `backend/app/main.py`

#### Import/Build Errors
**Problem**: TypeScript compilation failures
**Solution**: Check for unused imports, ensure all types are properly defined

### Development Pitfalls

1. **Trailing slashes**: Use endpoints without trailing slashes (`/tables/{id}/rows` not `/tables/{id}/rows/`)
2. **SQLAlchemy relationships**: Use `selectinload()` for eager loading to avoid N+1 queries
3. **Client components**: Most components need `"use client"` directive
4. **UUID handling**: Backend uses `UUID(as_uuid=True)`, frontend uses strings

---

## Deployment

### Environment Configuration

#### Production Backend
- Use production PostgreSQL connection string
- Update CORS origins for production domains
- Set proper environment variables

#### Production Frontend
- Update `NEXT_PUBLIC_BACKEND_URL` to production API
- Configure Supabase for production
- Set up proper domain and SSL

### Deployment Checklist
1. ✅ Database migration applied
2. ✅ Environment variables configured
3. ✅ CORS settings updated
4. ✅ Build process tested
5. ✅ Authentication flow verified

---

## Development Workflows

### Starting Development
```bash
# Terminal 1 - Backend
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2 - Frontend  
npm run dev
```

### Adding New Features

#### For Data Table Features
1. Check column type exists in `backend/app/models/data_table.py`
2. Update backend schema (`backend/app/schemas/data_tables.py`)
3. Add frontend types (`src/types/data-tables.ts`)
4. Add API client methods (`src/lib/api/data-tables-client.ts`)
5. Test in Swagger UI first (http://localhost:8000/docs)

#### For New API Routes
1. Create router in `backend/app/routers/your_feature.py`
2. Register in `backend/app/routers/__init__.py`
3. Create API client in `src/lib/api/your-feature-client.ts`
4. Add TypeScript types
5. Create frontend components

### Testing Workflow
1. **Backend**: Test endpoints in Swagger UI
2. **Frontend**: Use browser dev tools for debugging
3. **Integration**: Test full user workflows
4. **Real-time**: Test WebSocket connections and updates

---

## API Documentation

### Authentication
All API requests require Supabase auth token:
```
Authorization: Bearer <supabase_jwt_token>
```

### Request/Response Format
- All requests/responses use JSON
- UUID fields as strings in frontend
- Automatic validation via Pydantic schemas

### Error Handling
- Standard HTTP status codes
- Detailed error messages in development
- Automatic retry for connection issues

### Rate Limiting
- Currently no rate limiting implemented
- Consider adding for production use

---

## File Reference

### Essential Files
- `001_initial_schema.sql` - Complete database schema (single source of truth)
- `backend/app/main.py` - FastAPI app entry point
- `backend/app/routers/__init__.py` - All API endpoints registry
- `src/lib/api/data-tables-client.ts` - Reference API client implementation
- `src/components/NavigationLayout.tsx` - Main app shell
- `backend/app/models/data_table.py` - Complex relationship patterns

### Migration Files
- `migrations/002_add_link_column_type.sql` - Database constraint fix
- `MIGRATION_INSTRUCTIONS.md` - Migration deployment guide

### Legacy Files (Reference Only)
- `old-app-files/` - Original implementation before migration
- `*.original.tsx` / `*.old.tsx` - Backup files during migration

---

## Recent Updates

### Link Field Implementation
- ✅ Database schema support for table relationships
- ✅ Frontend UI for creating and managing link fields
- ✅ Purple-themed interface distinguishing from other field types
- ✅ Database constraint fix to allow 'link' column type
- ⏳ Full record linking functionality (in progress)

### Real-time System
- ✅ WebSocket infrastructure with auto-reconnect
- ✅ Connection status indicators
- ✅ Enhanced debugging and error handling
- ✅ Integration with Supabase subscriptions

### Migration Completion
- ✅ Backend: 23 API endpoints fully implemented
- ✅ Frontend: Core components migrated to API
- ⏳ Navigation and discovery components (partial migration)

---

## Conclusion

The Matic Platform is a sophisticated, production-ready Airtable alternative with comprehensive features for data management, form building, and real-time collaboration. The migration from Supabase direct queries to FastAPI provides better performance, type safety, and maintainability while preserving all functionality.

**Current Status**: Core functionality complete, some legacy components still migrating
**Next Steps**: Complete component migration, add advanced relationship features, optimize performance
**Architecture**: Solid foundation for scaling and adding new features

---

*Last Updated: October 16, 2025*
*Version: 2.0 (Post-FastAPI Migration)*