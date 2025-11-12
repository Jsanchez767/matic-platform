# 🔄 Request Hub Migration to Integrated Schema

## Overview
This guide walks you through migrating Request Hubs to the new integrated architecture that leverages existing Forms and Tables modules.

---

## ✅ Step 1: Run Database Migration

### In Supabase SQL Editor:

1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Copy the contents of `docs/migrations/005_request_hub_integrated.sql`
4. Paste into SQL Editor
5. Click **Run**

### Expected Results:
```sql
✅ 5 tables created/updated:
   - request_hubs
   - request_hub_tabs
   - request_hub_forms (NEW)
   - request_hub_tables (NEW)
   - request_templates (NEW)

✅ Indexes created
✅ RLS policies applied
✅ Comments added
```

### Verify Migration:
```sql
-- Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'request_%';

-- Should return:
-- request_hubs
-- request_hub_tabs
-- request_hub_forms
-- request_hub_tables
-- request_templates
```

---

## 📝 Step 2: Update Frontend Components

### 2.1 Update RequestHubViewer.tsx

The main viewer now needs to load linked forms and tables:

```typescript
// Before:
const { data: hub } = await requestHubsSupabase.getRequestHubById(hubId)

// After:
const { data: hub } = await requestHubsSupabase.getRequestHubById(hubId)
// Now includes:
// - hub.forms (linked forms)
// - hub.tables (linked tables)
```

### 2.2 Update SettingsPage.tsx

Settings now manages links to forms/tables instead of creating them inline:

**Tab 1: Request Types**
```typescript
// OLD: Inline form builder
<FormBuilder onSave={...} />

// NEW: Link to existing forms
<FormPicker 
  onSelect={async (formId) => {
    await requestHubsSupabase.linkForm(hubId, {
      form_id: formId,
      request_type_name: form.name,
      request_type_slug: slugify(form.name),
      auto_create_table_row: true,
      target_table_id: primaryTableId
    })
  }}
/>

// Show linked forms
{linkedForms.map(link => (
  <LinkedFormCard
    form={link.form}
    onConfigure={() => showWorkflowConfig(link)}
    onUnlink={() => requestHubsSupabase.unlinkForm(link.id)}
  />
))}
```

### 2.3 Update NewRequestForm.tsx

Load forms from the hub's linked forms:

```typescript
// Get linked forms for this hub
const linkedForms = await requestHubsSupabase.getLinkedForms(hubId)

// Show form picker
<FormTypePicker
  forms={linkedForms}
  onSelect={(hubFormLink) => {
    // Load the actual form from forms module
    loadForm(hubFormLink.form_id)
  }}
/>

// On submit
await requestHubsSupabase.submitRequest(
  hubFormLinkId,
  formData,
  userId
)
// This automatically creates table row if configured
```

### 2.4 Update Data Tables Views

**MyRequestsPage.tsx:**
```typescript
const requests = await requestHubsSupabase.getRequests(hubId, {
  userId: currentUserId
})

// Render using table view component
<TableView
  rows={requests}
  columns={tableColumns}
  onRowClick={(row) => showRequestDetails(row)}
/>
```

**ApprovalsPage.tsx:**
```typescript
const pendingRequests = await requestHubsSupabase.getRequests(hubId, {
  status: 'pending'
})

// Show approval interface
<ApprovalQueue
  requests={pendingRequests}
  onApprove={(requestId) => updateStatus(requestId, 'approved')}
  onDeny={(requestId) => updateStatus(requestId, 'denied')}
/>
```

---

## 🔗 Step 3: Set Up First Integrated Hub

### Example: HR Requests Hub

#### 3.1 Create the Hub
```typescript
const hub = await requestHubsSupabase.createRequestHub({
  workspace_id: workspaceId,
  name: 'HR Requests',
  slug: 'hr-requests',
  description: 'Manage all HR-related requests',
  created_by: userId
})
```

#### 3.2 Create Forms (Using Forms Module)
```typescript
// Create Time Off Request form
const timeOffForm = await formsClient.createForm({
  workspace_id: workspaceId,
  name: 'Time Off Request',
  fields: [
    {
      type: 'date',
      label: 'Start Date',
      required: true
    },
    {
      type: 'date',
      label: 'End Date',
      required: true
    },
    {
      type: 'select',
      label: 'Request Type',
      options: ['Vacation', 'Sick Leave', 'Personal Day']
    },
    {
      type: 'text',
      label: 'Reason',
      multiline: true
    }
  ]
})
```

#### 3.3 Create Storage Table (Using Tables Module)
```typescript
const requestsTable = await dataTablesClient.createTable({
  workspace_id: workspaceId,
  name: 'All HR Requests',
  columns: [
    { name: 'Request Type', type: 'text' },
    { name: 'Status', type: 'select', options: ['pending', 'approved', 'denied'] },
    { name: 'Start Date', type: 'date' },
    { name: 'End Date', type: 'date' },
    { name: 'Reason', type: 'text' },
    { name: 'Submitted By', type: 'user' },
    { name: 'Submitted At', type: 'datetime' },
    { name: 'Reviewed By', type: 'user' },
    { name: 'Reviewed At', type: 'datetime' }
  ]
})
```

#### 3.4 Link Form to Hub
```typescript
await requestHubsSupabase.linkForm(hub.id, {
  form_id: timeOffForm.id,
  request_type_name: 'Time Off Request',
  request_type_slug: 'time-off',
  workflow_enabled: true,
  approval_steps: [
    { step: 1, role: 'supervisor', required: true },
    { step: 2, role: 'hr', required: true }
  ],
  auto_create_table_row: true,
  target_table_id: requestsTable.id
})
```

#### 3.5 Link Table to Hub
```typescript
await requestHubsSupabase.linkTable(hub.id, {
  table_id: requestsTable.id,
  purpose: 'requests_storage',
  is_primary: true,
  config: {
    status_column_id: statusColumnId,
    submitted_by_column_id: submittedByColumnId,
    submitted_date_column_id: submittedDateColumnId
  }
})
```

#### 3.6 Configure Tabs
```typescript
// Dashboard
await requestHubsSupabase.createTab({
  hub_id: hub.id,
  name: 'Dashboard',
  slug: 'dashboard',
  type: 'dashboard',
  position: 0,
  config: {
    metrics: ['total', 'pending', 'approved'],
    charts: ['by_status', 'over_time']
  }
})

// New Request
await requestHubsSupabase.createTab({
  hub_id: hub.id,
  name: 'New Request',
  slug: 'new-request',
  type: 'new-request',
  position: 1,
  config: {
    show_form_picker: true
  }
})

// My Requests
await requestHubsSupabase.createTab({
  hub_id: hub.id,
  name: 'My Requests',
  slug: 'my-requests',
  type: 'my-requests',
  position: 2,
  config: {
    table_id: requestsTable.id,
    filter: { submitted_by: 'current_user' }
  }
})

// Approvals
await requestHubsSupabase.createTab({
  hub_id: hub.id,
  name: 'Approvals',
  slug: 'approvals',
  type: 'approvals',
  position: 3,
  config: {
    table_id: requestsTable.id,
    filter: { status: 'pending' },
    approval_column: 'status'
  }
})
```

---

## 🧪 Step 4: Test the Integration

### Test Workflow:

1. **Navigate to Hub**
   ```
   /workspace/{workspaceId}/request-hub/hr-requests
   ```

2. **Click "New Request" Tab**
   - Should show form picker with "Time Off Request"
   - Click form → loads form from Forms module

3. **Fill and Submit Form**
   - Fill in dates and reason
   - Click Submit
   - Should see success message

4. **Verify Data Created**
   ```sql
   -- Check form submission
   SELECT * FROM form_submissions 
   WHERE form_id = '{timeOffFormId}' 
   ORDER BY created_at DESC LIMIT 1;

   -- Check table row
   SELECT * FROM table_rows 
   WHERE table_id = '{requestsTableId}' 
   ORDER BY created_at DESC LIMIT 1;
   ```

5. **Check "My Requests" Tab**
   - Should show the newly submitted request
   - Status should be "pending"

6. **Check "Approvals" Tab (as manager)**
   - Should show pending request
   - Click Approve/Deny
   - Should update status

---

## 🎯 Step 5: Migrate Existing Hubs (If Any)

If you have existing request hubs from the old schema:

### Option A: Fresh Start (Recommended)
1. Create new hubs with integrated schema
2. Link existing forms and tables
3. Archive old hubs

### Option B: Data Migration
```sql
-- Example: Migrate old hub data to new schema

-- 1. Link existing forms to old hubs
INSERT INTO request_hub_forms (hub_id, form_id, request_type_name, request_type_slug)
SELECT 
  rh.id,
  f.id,
  f.name,
  f.slug
FROM request_hubs rh
JOIN forms f ON f.workspace_id = rh.workspace_id
WHERE rh.created_at < '2025-11-11'; -- Before migration

-- 2. Link existing tables
INSERT INTO request_hub_tables (hub_id, table_id, purpose, is_primary)
SELECT 
  rh.id,
  dt.id,
  'requests_storage',
  true
FROM request_hubs rh
JOIN data_tables dt ON dt.workspace_id = rh.workspace_id
WHERE rh.created_at < '2025-11-11';
```

---

## 📊 Step 6: Update Analytics

Dashboard metrics now pull from linked tables:

```typescript
async function getHubMetrics(hubId: string) {
  const requests = await requestHubsSupabase.getRequests(hubId)
  
  return {
    total: requests.length,
    pending: requests.filter(r => r.data.status === 'pending').length,
    approved: requests.filter(r => r.data.status === 'approved').length,
    denied: requests.filter(r => r.data.status === 'denied').length,
    byType: groupBy(requests, 'data.request_type'),
    overTime: groupByDate(requests, 'created_at')
  }
}
```

---

## ✅ Validation Checklist

After migration, verify:

- [ ] Database migration ran successfully
- [ ] Can create new request hub
- [ ] Can link existing form to hub
- [ ] Can link existing table to hub
- [ ] Form submission creates form_submissions record
- [ ] Form submission auto-creates table row (if configured)
- [ ] "My Requests" tab shows user's requests
- [ ] "Approvals" tab shows pending requests
- [ ] Can approve/deny requests
- [ ] Dashboard shows correct metrics
- [ ] All RLS policies working
- [ ] No console errors

---

## 🚨 Common Issues

### Issue: "Policy already exists"
**Solution:** Migration includes `DROP POLICY IF EXISTS` - should not happen

### Issue: Linked forms not showing
**Solution:** Check RLS policies on forms table, verify user has access

### Issue: Table rows not auto-creating
**Solution:** 
- Verify `auto_create_table_row = true` in request_hub_forms
- Check `target_table_id` is set correctly
- Ensure user has INSERT permission on table_rows

### Issue: Approval workflow not triggering
**Solution:**
- Check `workflow_enabled = true`
- Verify `approval_steps` JSONB is valid
- Implement trigger function (if not exists)

---

## 🎉 Success!

You've successfully migrated to the integrated Request Hub architecture! 

**Benefits you now have:**
- ✅ Reuse existing form builder
- ✅ Reuse existing table infrastructure
- ✅ Can use any form in any hub
- ✅ Single source of truth for data
- ✅ Easier maintenance
- ✅ More powerful and flexible

**Next steps:**
- Create more request types
- Set up approval workflows
- Configure notifications
- Build custom analytics
- Share templates with team

---

## 📚 Reference Documentation

- **Schema Details:** `docs/migrations/005_request_hub_integrated.sql`
- **API Reference:** `src/lib/api/request-hubs-supabase.ts`
- **Example Setup:** See Step 3 above
- **Data Flow:** See comments in migration file

---

**Need help?** Check the example code in the migration file or refer to the API client methods.
