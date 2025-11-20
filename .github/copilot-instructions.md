# Matic Platform - AI Agent Instructions

## Project Overview
Full-stack Airtable-like platform with forms and data tables using Go backend with Gin framework. Built with Next.js 14 (App Router), Go, PostgreSQL (Supabase), and TypeScript. Uses hybrid architecture: Go backend for all CRUD operations, Supabase for auth and real-time updates.

## Architecture

### Stack Components
- **Frontend**: Next.js 14 App Router (`src/app/`), React 18, TypeScript, Tailwind CSS
- **Backend**: Go with Gin framework and GORM, running at `backend.maticslab.com:443` (production) or `localhost:8080` (dev)
- **Database**: PostgreSQL (Supabase) with 18 tables defined in `001_initial_schema.sql`
- **Auth**: Supabase Auth (token-based, managed via `src/lib/supabase.ts`)
- **Realtime**: Supabase postgres_changes subscriptions for live collaborative updates

### Data Flow Pattern
```
Client Component → API Client (`src/lib/api/*-client.ts` or `go-client.ts`)
  → Go Backend (`go-backend/handlers/*.go` via Gin router)
  → GORM Model (`go-backend/models/models.go`)
  → PostgreSQL
  
Real-time Updates:
  PostgreSQL → Supabase Realtime → Client Component useEffect
```

**Critical**: Frontend never queries Supabase directly for data (except auth). All CRUD operations go through Go backend. Real-time updates use Supabase postgres_changes subscriptions.

## Key Conventions

### Backend (Go)
- **Models**: Use GORM models with UUID primary keys in `go-backend/models/models.go`
- **Handlers**: RESTful handlers in `go-backend/handlers/*.go` with Gin context
- **Router**: All routes defined in `go-backend/router/router.go` under `/api/v1` prefix
- **Auth**: Supabase Auth tokens passed via `Authorization: Bearer <token>` header
- **CORS**: Configured in router setup - supports all origins with credentials
- **JSONB**: Use `datatypes.JSON` from GORM for JSONB columns (settings, data, metadata)

Example endpoint pattern:
```go
func GetDataTable(c *gin.Context) {
    id := c.Param("id")
    var table models.DataTable
    
    if err := database.DB.Preload("Columns").First(&table, "id = ?", id).Error; err != nil {
        c.JSON(404, gin.H{"error": "Table not found"})
        return
    }
    
    c.JSON(200, table)
}
```

### Frontend (Next.js)
- **Client components**: Mark with `"use client"` - used for all interactive UI (most components)
- **Import aliases**: Use `@/` prefix (configured in `tsconfig.json`) - e.g., `@/lib/api/go-client`
- **API clients**: Use `goClient` from `@/lib/api/go-client` for all data operations - never fetch directly
- **Auth**: Get token via `getSessionToken()` from `@/lib/supabase`, automatically injected by `goFetch()`
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
# Terminal 1 - Go Backend
cd go-backend
go run main.go

# Terminal 2 - Frontend
npm run dev
```

**Access**:
- Frontend: http://localhost:3000
- Go Backend: http://localhost:8080 (HTML API docs at root)
- API Docs JSON: http://localhost:8080/api/v1/docs

### Environment Setup
- Go Backend: `go-backend/.env` with database connection (uses Supabase PostgreSQL)
- Frontend: `.env.local` with `NEXT_PUBLIC_GO_API_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Adding New Features

**For data tables/forms features** (20+ column types, 6 view types):
1. Check if column type exists in `go-backend/models/models.go` (TableColumn.ColumnType)
2. Add handler if needed in `go-backend/handlers/*.go`
3. Add frontend types (`src/types/data-tables.ts`)
4. Add API client methods (`src/lib/api/go-client.ts` or feature-specific client)
5. Test via http://localhost:8080 or curl

**For new handlers**:
1. Add handler function in `go-backend/handlers/your_feature.go`
2. Register route in `go-backend/router/router.go` under `/api/v1`
3. Create corresponding API client in `src/lib/api/your-feature-client.ts`

## Migration Context (Read Before Large Changes)

**Status**: Migrated to Go backend from FastAPI
- ✅ Backend: Go with Gin framework (workspaces, tables, forms, activities hubs, search, table links)
- ✅ Authentication: Supabase Auth integrated, token passed via Authorization header
- ✅ Table operations: All CRUD using Go API
- ✅ Realtime: Using Supabase postgres_changes subscriptions (no WebSocket)
- ⏳ Some legacy components still use Supabase queries directly

When migrating components:
1. Search for `.from('table_name')` - these are Supabase queries to replace
2. Find equivalent in `goClient` from `@/lib/api/go-client`
3. Remove Supabase imports, add Go client imports
4. Update async patterns (Supabase uses different promise patterns)

## Database Schema Essentials

4. **Update async patterns** (Supabase uses different promise patterns)

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
2. **Client components**: Most components need `"use client"` - server components can't use hooks/events
3. **CORS**: Add new domains to `go-backend/router/router.go` CORS middleware
4. **JSONB columns**: Use `datatypes.JSON` from GORM for settings, data, metadata fields
5. **UUID handling**: Go backend uses `uuid.UUID`, frontend uses strings - conversion automatic via JSON marshaling

## File Reference

**Essential files for understanding**:
- `001_initial_schema.sql` - Complete DB schema (single source of truth)
- `go-backend/router/router.go` - All API endpoints registered
- `go-backend/handlers/*.go` - Handler implementations
- `go-backend/models/models.go` - GORM models
- `src/lib/api/go-client.ts` - Base Go API client
- `src/lib/api/participants-go-client.ts` - Reference implementation for feature-specific clients
- `src/components/NavigationLayout.tsx` - Main app shell

**Legacy/reference** (don't copy patterns from these):
- `old-app-files/` - Original implementation before migration
- `*.original.tsx` / `*.old.tsx` - Backup files during migration
