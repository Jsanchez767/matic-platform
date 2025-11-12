# 🔗 Request Hub Integration Architecture

## Overview
Request Hub now fully integrates with existing Forms and Tables modules instead of duplicating functionality. This creates a powerful, unified system.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     REQUEST HUB                             │
│  (Orchestration Layer - No data duplication)                │
└─────────────────────────────────────────────────────────────┘
                     │                 │
         ┌───────────┴────────┐        │
         ▼                    ▼        ▼
┌─────────────────┐  ┌─────────────────┐
│  FORMS MODULE   │  │  TABLES MODULE  │
│                 │  │                 │
│ • form_fields   │  │ • table_columns │
│ • submissions   │  │ • table_rows    │
│ • validation    │  │ • table_views   │
└─────────────────┘  └─────────────────┘
```

---

## Integration Points

### 1. **Request Hub → Forms Integration**

**Table**: `request_hub_forms`

**Purpose**: Links request types to existing forms

**Example**:
```sql
-- Link "Time Off Request" to HR Hub
INSERT INTO request_hub_forms (hub_id, form_id, request_type_name, target_table_id) 
VALUES (
  'hr-hub-uuid',
  'time-off-form-uuid',
  'Time Off Request',
  'requests-table-uuid'
);
```

**Benefits**:
- ✅ Use existing form builder
- ✅ All form features work (validation, conditional logic, file uploads)
- ✅ Form submissions stored in `form_submissions` table
- ✅ No code duplication

---

### 2. **Request Hub → Tables Integration**

**Table**: `request_hub_tables`

**Purpose**: Links hubs to tables for data storage and display

**Example**:
```sql
-- Link "All Requests" table to hub
INSERT INTO request_hub_tables (hub_id, table_id, purpose, is_primary, config)
VALUES (
  'hr-hub-uuid',
  'all-requests-table-uuid',
  'requests_storage',
  true,
  '{
    "status_column_id": "col-status-uuid",
    "priority_column_id": "col-priority-uuid",
    "assigned_to_column_id": "col-assignee-uuid"
  }'
);
```

**Benefits**:
- ✅ Use existing table views (grid, kanban, calendar, etc.)
- ✅ All table features work (filters, sorting, grouping)
- ✅ Data stored in `table_rows` table
- ✅ Powerful relationships and lookups

---

### 3. **Request Hub Tabs Configuration**

**Tab Types and Their Integrations**:

#### Dashboard Tab
```json
{
  "type": "dashboard",
  "config": {
    "metrics": [
      {"source": "table_id", "column": "status", "aggregation": "count"},
      {"source": "table_id", "column": "priority", "aggregation": "count"}
    ],
    "charts": [
      {"type": "pie", "source": "table_id", "group_by": "status"}
    ]
  }
}
```

#### New Request Tab
```json
{
  "type": "new-request",
  "config": {
    "show_form_picker": true,
    "available_forms": ["form-id-1", "form-id-2"],
    "redirect_after_submit": "/hub/my-requests"
  }
}
```

#### My Requests Tab
```json
{
  "type": "my-requests",
  "config": {
    "table_id": "requests-table-uuid",
    "view_id": "my-requests-view-uuid",
    "filters": [
      {"column": "submitted_by", "operator": "equals", "value": "{{current_user}}"}
    ]
  }
}
```

#### Approvals Tab
```json
{
  "type": "approvals",
  "config": {
    "table_id": "requests-table-uuid",
    "view_id": "approvals-view-uuid",
    "filters": [
      {"column": "status", "operator": "equals", "value": "pending"},
      {"column": "assigned_to", "operator": "equals", "value": "{{current_user}}"}
    ],
    "actions": ["approve", "deny", "request_changes"]
  }
}
```

#### All Requests Tab
```json
{
  "type": "all-requests",
  "config": {
    "table_id": "requests-table-uuid",
    "view_id": "all-requests-view-uuid",
    "enable_filters": true,
    "enable_search": true
  }
}
```

---

## Data Flow

### Submitting a Request

```
User clicks "New Request"
    ↓
Selects request type (e.g., "Time Off")
    ↓
Form loads from forms module (form_id from request_hub_forms)
    ↓
User fills and submits
    ↓
Creates record in form_submissions table
    ↓
Trigger: Auto-create row in linked table (if auto_create_table_row = true)
    ↓
Row appears in table_rows
    ↓
Visible in "My Requests" tab (filtered table view)
    ↓
Visible in "Approvals" tab (if status = pending)
    ↓
Metrics update on Dashboard
```

### Approval Workflow

```
Approver opens "Approvals" tab
    ↓
Sees filtered table view (status = pending, assigned_to = current_user)
    ↓
Clicks "Approve" button
    ↓
Updates row in table_rows (status → approved)
    ↓
Triggers notification (from hub settings)
    ↓
Request moves out of approval queue
    ↓
Appears in "My Requests" as approved
    ↓
Dashboard metrics update
```

---

## Migration Steps

### Step 1: Run New Schema
```sql
-- Run this in Supabase SQL Editor
-- File: docs/migrations/005_request_hub_integrated.sql
```

### Step 2: Create Request Hub
```sql
INSERT INTO request_hubs (workspace_id, name, slug, created_by)
VALUES ('workspace-uuid', 'HR Requests', 'hr-requests', 'user-uuid');
```

### Step 3: Link Existing Forms
```sql
-- Link "Time Off" form to hub
INSERT INTO request_hub_forms (
  hub_id, 
  form_id, 
  request_type_name, 
  request_type_slug,
  auto_create_table_row,
  target_table_id
) VALUES (
  'hub-uuid',
  'existing-time-off-form-uuid',
  'Time Off Request',
  'time-off',
  true,
  'requests-table-uuid'
);
```

### Step 4: Link Existing Table
```sql
-- Link "All Requests" table to hub
INSERT INTO request_hub_tables (
  hub_id,
  table_id,
  purpose,
  is_primary,
  config
) VALUES (
  'hub-uuid',
  'existing-requests-table-uuid',
  'requests_storage',
  true,
  '{
    "status_column_id": "col-uuid",
    "priority_column_id": "col-uuid",
    "assigned_to_column_id": "col-uuid"
  }'::jsonb
);
```

### Step 5: Configure Tabs
```sql
-- Dashboard tab
INSERT INTO request_hub_tabs (hub_id, name, slug, type, position, config)
VALUES (
  'hub-uuid',
  'Dashboard',
  'dashboard',
  'dashboard',
  0,
  '{"metrics": [...], "charts": [...]}'::jsonb
);

-- New Request tab
INSERT INTO request_hub_tabs (hub_id, name, slug, type, position, config)
VALUES (
  'hub-uuid',
  'New Request',
  'new-request',
  'new-request',
  1,
  '{"show_form_picker": true}'::jsonb
);

-- My Requests tab
INSERT INTO request_hub_tabs (hub_id, name, slug, type, position, config)
VALUES (
  'hub-uuid',
  'My Requests',
  'my-requests',
  'my-requests',
  2,
  '{"table_id": "table-uuid", "filters": [...]}'::jsonb
);
```

---

## Code Changes Needed

### 1. Update RequestHubViewer.tsx
```typescript
// Load form from forms module
const form = await formsApi.getForm(config.form_id);

// Load table from tables module
const table = await tablesApi.getTable(config.table_id);

// Use existing components
<FormBuilder form={form} />
<TableView table={table} filters={config.filters} />
```

### 2. Update API Clients
```typescript
// request-hubs-api.ts
export const requestHubsApi = {
  async getHubForms(hubId: string) {
    // Query request_hub_forms
    // Join with forms table
    return await supabase
      .from('request_hub_forms')
      .select('*, form:forms(*)')
      .eq('hub_id', hubId);
  },
  
  async getHubTables(hubId: string) {
    // Query request_hub_tables
    // Join with data_tables table
    return await supabase
      .from('request_hub_tables')
      .select('*, table:data_tables(*)')
      .eq('hub_id', hubId);
  }
};
```

---

## Benefits of Integration

### 1. **No Code Duplication**
- ❌ Before: Separate form builder for request hubs
- ✅ After: Use existing form builder

### 2. **Unified Data Model**
- ❌ Before: Separate request storage
- ✅ After: All data in tables module

### 3. **Feature Parity**
- ✅ All form features work (validation, conditional logic, file uploads)
- ✅ All table features work (views, filters, sorting, grouping)
- ✅ All relationship features work (lookups, rollups)

### 4. **Better Maintenance**
- Fix once, works everywhere
- New features automatically available

### 5. **Powerful Combinations**
- Request forms can reference other tables
- Request tables can link to other tables
- Analytics across all modules

---

## Example Use Cases

### HR Department
```
Hub: "HR Requests"
├─ Forms (from forms module):
│  ├─ Time Off Request
│  ├─ Equipment Request
│  └─ Training Request
├─ Tables (from tables module):
│  ├─ All Requests (primary storage)
│  ├─ Employees (for lookups)
│  └─ Departments (for categorization)
└─ Tabs:
   ├─ Dashboard (metrics from All Requests table)
   ├─ New Request (form picker)
   ├─ My Requests (filtered table view)
   └─ Approvals (filtered table view)
```

### IT Department
```
Hub: "IT Support"
├─ Forms:
│  ├─ Bug Report
│  ├─ Feature Request
│  └─ Access Request
├─ Tables:
│  ├─ All Tickets (primary)
│  ├─ Users
│  └─ Systems
└─ Tabs:
   ├─ Dashboard
   ├─ Submit Ticket
   ├─ My Tickets
   ├─ Assigned to Me
   └─ All Tickets
```

---

## Migration Path

### Option 1: Fresh Install
1. Run `005_request_hub_integrated.sql`
2. Create hubs
3. Link existing forms and tables

### Option 2: Migrate Existing Hubs
1. Export data from old schema
2. Run new schema
3. Migrate data to integrated model
4. Update code to use new structure

---

## Next Steps

1. ✅ Review new schema (`005_request_hub_integrated.sql`)
2. ✅ Run migration in Supabase
3. ✅ Update API clients to use integration tables
4. ✅ Update UI components to load forms/tables
5. ✅ Test workflow end-to-end
6. ✅ Deploy changes

---

## Questions?

This is a significant architectural improvement. The integration makes Request Hub much more powerful while reducing complexity and maintenance burden.

Key principle: **Request Hub orchestrates, Forms and Tables execute.**
