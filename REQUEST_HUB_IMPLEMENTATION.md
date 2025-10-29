# Request Hub Module - Implementation Complete

## Overview
Built a customizable Request Hub module that allows users to create request management systems with configurable tabs, integrated with the existing tables system.

## What Was Created

### 1. Type Definitions (`src/types/request-hub.ts`)
Complete TypeScript type system for Request Hubs:

```typescript
// Main Types
- RequestHub: Hub entity with workspace_id, name, slug, settings, tabs
- RequestHubTab: Tab entity with type, config, position, visibility
- RequestHubSettings: Theme, notifications, permissions
- RequestHubTabConfig: Flexible config for different tab types

// Tab Types (7 variants)
- dashboard: Metrics, charts, recent activity
- my-requests: User's submitted requests (filtered)
- new-request: Form type selection and submission
- approvals: Approval queue for managers
- all-requests: Admin view of all requests
- analytics: Charts and insights
- custom: Custom table views

// Supporting Types
- RequestHubFilter: Column filtering with operators
- DashboardMetric: count, sum, average, percentage
- DashboardChart: bar, line, pie, donut
- RequestWorkflowStep: Approval workflow configuration
- ApprovalAction: approve, reject, request_changes, forward
```

### 2. API Client (`src/lib/api/request-hubs-supabase.ts`)
Complete CRUD operations for Request Hubs using Supabase Direct:

**Hub Operations:**
- `list(workspaceId)` - Get all hubs with tabs
- `get(hubId)` - Get single hub with tabs
- `getBySlug(workspaceId, slug)` - Get hub by slug (for routing)
- `create(hubData)` - Create new hub (requires auth)
- `update(hubId, updates)` - Update hub
- `delete(hubId)` - Soft delete (is_active = false)

**Tab Operations:**
- `getTabs(hubId)` - Get tabs for hub (sorted by position)
- `createTab(tabData)` - Create new tab
- `updateTab(tabId, updates)` - Update tab
- `deleteTab(tabId)` - Soft delete (is_visible = false)
- `reorderTabs(hubId, tabIds)` - Reorder tabs by position

### 3. Database Migration (`docs/migrations/004_create_request_hubs.sql`)
Complete database schema with RLS policies:

**Tables:**
```sql
request_hubs (
  id, workspace_id, name, slug, description,
  settings JSONB, is_active, created_by,
  created_at, updated_at
  UNIQUE(workspace_id, slug)
)

request_hub_tabs (
  id, hub_id, name, slug, type, icon,
  position, is_visible, config JSONB,
  created_at, updated_at
  UNIQUE(hub_id, slug)
)
```

**Indexes:**
- workspace_id lookup
- slug lookup
- hub_id for tabs
- position for tab ordering

**RLS Policies:**
- View: All workspace members can see hubs
- Create: Admin/Editor can create hubs
- Update: Admin/Editor can update hubs
- Delete: Admin only can delete hubs
- Tab permissions inherit from hub

### 4. UI Component (`src/components/RequestHub/RequestHubListPage.tsx`)
Full-featured list page with:

**Features:**
- Grid layout of all request hubs
- Create new hub dialog with:
  * Name input
  * Auto-generated slug (editable)
  * Description
  * Default tabs (Dashboard, My Requests, New Request)
- Delete hub confirmation dialog
- Hub cards showing:
  * Name, slug, description
  * Active/Inactive status badge
  * Tab count
  * Settings and delete actions
- Empty state with "Create Your First Hub" CTA
- Loading states
- Error handling

**Default Tabs Created:**
1. **Dashboard** - Metrics (Total Requests, Pending)
2. **My Requests** - User's requests (filtered)
3. **New Request** - Form submission

### 5. Integration (`src/components/TabContentRouter.tsx`)
Integrated Request Hub into tab routing system:

**Routing:**
- `/workspace/{workspaceId}/request-hubs` → Request Hub List
- Future: `/workspace/{workspaceId}/hub/{hubSlug}` → Hub Viewer

**Quick Actions:**
- Added "Request Hubs" card to Workspace Overview
- Icon: Layout (purple theme)
- Opens Request Hub list in new tab

## How to Use

### 1. Run Database Migration
```bash
# Option 1: Supabase Dashboard
# 1. Go to SQL Editor
# 2. Copy contents of docs/migrations/004_create_request_hubs.sql
# 3. Paste and click Run

# Option 2: Supabase CLI
supabase db push docs/migrations/004_create_request_hubs.sql
```

### 2. Access Request Hubs
1. Open any workspace
2. Click "Request Hubs" card on Overview, OR
3. Use Module Palette (⌘P) → Search "Request Hubs"
4. Opens Request Hub list page

### 3. Create Your First Hub
1. Click "Create Hub" button
2. Enter hub name (e.g., "IT Support Requests")
3. Slug auto-generates (e.g., "it-support-requests")
4. Add description (optional)
5. Click "Create Hub"
6. Default tabs created automatically

### 4. Manage Hubs
- **View**: Click hub card to open (TODO: implement viewer)
- **Settings**: Click settings icon (TODO: implement editor)
- **Delete**: Click delete icon → Confirm deletion

## Architecture

### Data Flow
```
RequestHubListPage Component
  ↓
requestHubsSupabase API Client
  ↓
Supabase Direct (RLS enforced)
  ↓
PostgreSQL (request_hubs, request_hub_tabs)
```

### Tab System Integration
```
User clicks "Request Hubs" in Overview
  ↓
handleQuickAction('request-hubs')
  ↓
tabManager.addTab({ type: 'custom', url: '/request-hubs' })
  ↓
TabContentRouter detects URL pattern
  ↓
Renders <RequestHubListPage />
```

### Configuration Pattern
Each tab type has flexible JSONB config:
```typescript
// Dashboard Tab
config: {
  metrics: [{ label, type, column_id, filters }],
  charts: [{ type, title, data_source, x_axis, y_axis }]
}

// Form Tab
config: {
  form_table_id: "uuid",
  form_types: [{ name, table_id, form_id }]
}

// List Tab
config: {
  source_table_id: "uuid",
  filters: [{ column_id, operator, value }],
  columns: ["column_id_1", "column_id_2"],
  sort: { column_id, direction }
}
```

## Next Steps

### Phase 2: Hub Viewer (TODO)
Create `RequestHubViewer.tsx` component:
- Render tabs dynamically based on type
- Tab navigation (similar to workspace tabs)
- Route: `/w/{slug}/hub/{hubSlug}`

### Phase 3: Tab Renderers (TODO)
Create tab-specific components:
- `DashboardTab.tsx` - Metrics and charts
- `MyRequestsTab.tsx` - Filtered list view
- `NewRequestTab.tsx` - Form type picker + submission
- `ApprovalsTab.tsx` - Approval queue
- `AllRequestsTab.tsx` - Admin list view
- `AnalyticsTab.tsx` - Charts and insights
- `CustomTab.tsx` - Custom table view

### Phase 4: Hub Builder (TODO)
Create `RequestHubBuilder.tsx` component:
- Edit hub settings (name, description, theme)
- Add/remove/reorder tabs
- Configure tab-specific settings
- Form builder for request forms
- Workflow builder for approvals

### Phase 5: Advanced Features (TODO)
- Email notifications for new requests
- Slack/Teams integrations
- Request templates
- SLA tracking
- Custom fields per hub
- Export/import hub configurations
- Hub permissions (who can submit, approve, view)

## Integration with Existing Systems

### Tables System
Request Hubs pull data from existing data tables:
- `form_table_id` - Connect form to table
- `source_table_id` - Pull requests from table
- Reuses column definitions and data

### Forms System
Request forms use existing form infrastructure:
- `form_id` - Reference existing forms
- Form submissions create table rows
- Same form builder UI

### Pulse System (Future)
Could integrate with Pulse for:
- QR code scanning for walk-in requests
- Scanner assignment to request hubs
- Real-time request notifications

## Technical Details

### Performance Optimizations
- Eager loading: Hubs loaded with tabs in one query
- Indexes: Optimized for workspace_id and hub_id lookups
- Soft deletes: No data loss, queries filter `is_active = true`
- Tab ordering: Integer position field for fast sorting

### Security
- RLS policies enforce workspace membership
- Created_by tracked for audit trail
- Admin/Editor roles required for hub management
- Tab visibility controlled per tab

### Extensibility
- JSONB config allows new features without schema changes
- Custom tab type for unlimited customization
- Settings object for future hub-level features
- Tab metadata for additional properties

## File Manifest

```
src/types/request-hub.ts                  (170 lines) - Type definitions
src/lib/api/request-hubs-supabase.ts     (240 lines) - API client
src/components/RequestHub/
  RequestHubListPage.tsx                  (360 lines) - List page UI
src/components/TabContentRouter.tsx       (Modified)  - Routing integration
docs/migrations/
  004_create_request_hubs.sql            (120 lines) - Database schema
  run_request_hub_migration.sh           (25 lines)  - Migration helper
```

## Summary

✅ **Complete Infrastructure**: Types, API client, database schema
✅ **Functional UI**: Create, list, delete hubs with default tabs
✅ **Integrated**: Works with existing tab system and workspace navigation
✅ **Extensible**: JSONB configs allow unlimited customization
✅ **Secure**: RLS policies enforce proper access control

**Status**: Ready for database migration and testing
**Next**: Run migration → Test hub creation → Build hub viewer
