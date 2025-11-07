# Request Hub - Testing Guide

## Prerequisites
1. Database migration must be run first
2. User must be logged in to create hubs
3. User must be a member of the workspace

## Running the Migration

### Option 1: Supabase Dashboard (Recommended)
1. Go to https://app.supabase.com
2. Select your project
3. Navigate to: **SQL Editor** (left sidebar)
4. Click **"New Query"**
5. Copy the entire contents of `docs/migrations/004_create_request_hubs.sql`
6. Paste into the query editor
7. Click **"Run"** or press `Cmd+Enter`
8. Verify success message appears

### Option 2: Supabase CLI
```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Link to your project (one-time setup)
supabase link --project-ref YOUR_PROJECT_REF

# Run the migration
supabase db push docs/migrations/004_create_request_hubs.sql
```

### Verify Migration Success
Run this query in SQL Editor to verify tables exist:
```sql
SELECT 
  table_name, 
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_name IN ('request_hubs', 'request_hub_tabs');
```

Expected output:
```
table_name          | column_count
--------------------+-------------
request_hubs        | 9
request_hub_tabs    | 10
```

## Testing the UI

### 1. Access Request Hubs Module
**Method A: Via Quick Actions**
1. Open any workspace
2. You should see "Request Hubs" card in Overview
3. Click the card
4. Request Hub list page opens in new tab

**Method B: Via Module Palette**
1. Press `Cmd+P` (or `Ctrl+P` on Windows)
2. Type "Request Hubs"
3. Press Enter
4. Request Hub list page opens

**Method C: Direct URL**
1. Navigate to: `/workspace/{workspaceId}/request-hubs`
2. Replace `{workspaceId}` with your actual workspace ID

### 2. Create Your First Hub
1. On the Request Hub list page, click **"Create Hub"** button
2. Fill in the form:
   - **Hub Name**: "IT Support Requests" (or any name)
   - **URL Slug**: Auto-generated from name (e.g., "it-support-requests")
   - **Description**: Optional (e.g., "Manage IT support tickets")
3. Click **"Create Hub"**
4. Wait for success (hub card should appear)

**What happens behind the scenes:**
- Creates hub record in `request_hubs` table
- Creates 3 default tabs:
  1. Dashboard (type: dashboard)
  2. My Requests (type: my-requests)
  3. New Request (type: new-request)
- Tabs created in `request_hub_tabs` table

### 3. Verify Hub Creation
**Check in UI:**
- Hub card appears in grid
- Shows hub name, slug (e.g., /it-support-requests)
- Shows "3 tabs" count
- Status badge shows "Active"

**Check in Database:**
```sql
-- List all hubs
SELECT id, name, slug, is_active, 
       (SELECT COUNT(*) FROM request_hub_tabs WHERE hub_id = request_hubs.id) as tab_count
FROM request_hubs;

-- List tabs for a hub
SELECT name, type, position, is_visible 
FROM request_hub_tabs 
WHERE hub_id = 'YOUR_HUB_ID'
ORDER BY position;
```

### 4. Test Hub Actions

**Open Hub (TODO: Not yet implemented)**
- Click on hub card
- Currently logs to console: "Opening hub: {...}"
- Future: Will navigate to hub viewer page

**Settings (TODO: Not yet implemented)**
- Click settings icon (gear)
- Currently logs to console: "Settings for {...}"
- Future: Will open hub builder/editor

**Delete Hub**
1. Click delete icon (trash can) on hub card
2. Confirmation dialog appears
3. Shows hub name: "Are you sure you want to delete..."
4. Click **"Delete Hub"** to confirm
5. Hub card removed from grid
6. Database: Hub's `is_active` set to `false` (soft delete)

### 5. Test Empty State
1. Delete all hubs (or start fresh)
2. Visit Request Hub list page
3. Should see:
   - Empty folder icon
   - "No Request Hubs Yet" heading
   - Description text
   - "Create Your First Hub" button
4. Click button → Opens create dialog

## Common Issues & Solutions

### Issue: "Failed to load request hubs"
**Causes:**
- Migration not run
- User not authenticated
- User not a workspace member

**Solutions:**
1. Check browser console for error details
2. Verify migration ran successfully:
   ```sql
   SELECT * FROM request_hubs LIMIT 1;
   ```
3. Verify user is logged in:
   - Check for auth token in localStorage
   - Try logging out and back in
4. Verify workspace membership:
   ```sql
   SELECT * FROM workspace_members WHERE user_id = 'YOUR_USER_ID';
   ```

### Issue: "Failed to create request hub"
**Causes:**
- User not authenticated
- User not admin/editor role
- Duplicate slug in workspace
- RLS policy blocking

**Solutions:**
1. Check browser console for specific error
2. Verify user role:
   ```sql
   SELECT role FROM workspace_members 
   WHERE workspace_id = 'YOUR_WORKSPACE_ID' 
   AND user_id = 'YOUR_USER_ID';
   ```
3. Try different hub slug
4. Verify RLS policies are enabled:
   ```sql
   SELECT tablename, policyname, cmd 
   FROM pg_policies 
   WHERE tablename IN ('request_hubs', 'request_hub_tabs');
   ```

### Issue: "Property 'created_by' is missing" (TypeScript)
**Cause:** Old cached build

**Solution:**
```bash
# Clear Next.js cache and rebuild
rm -rf .next
npm run dev
```

### Issue: Tabs not created after hub creation
**Cause:** API error during tab creation

**Solutions:**
1. Check browser console for error
2. Manually verify hub was created:
   ```sql
   SELECT * FROM request_hubs ORDER BY created_at DESC LIMIT 1;
   ```
3. Check if tabs exist:
   ```sql
   SELECT * FROM request_hub_tabs WHERE hub_id = 'YOUR_HUB_ID';
   ```
4. If hub created but no tabs, manually create them (or delete and recreate hub)

## Testing Checklist

- [ ] Migration runs successfully
- [ ] Can access Request Hub list page
- [ ] Empty state displays correctly
- [ ] Can create new hub
- [ ] Hub appears in list after creation
- [ ] Hub shows correct tab count (3)
- [ ] Hub status badge shows "Active"
- [ ] Settings button exists (logs to console)
- [ ] Delete button exists
- [ ] Delete confirmation dialog works
- [ ] Hub soft-deletes (disappears from list)
- [ ] Database verification queries work

## Next Steps After Testing

### Phase 2: Build Hub Viewer
- [ ] Create `RequestHubViewer.tsx` component
- [ ] Implement tab navigation (similar to workspace tabs)
- [ ] Render tabs dynamically based on type
- [ ] Add routing: `/w/{slug}/hub/{hubSlug}`
- [ ] Update `handleOpenHub()` in list page

### Phase 3: Build Tab Renderers
- [ ] DashboardTab: Render metrics and charts
- [ ] MyRequestsTab: Show user's requests (filtered)
- [ ] NewRequestTab: Form type picker + submission
- [ ] ApprovalsTab: Approval queue for managers
- [ ] AllRequestsTab: Admin view of all requests
- [ ] AnalyticsTab: Charts and insights
- [ ] CustomTab: Custom table view

### Phase 4: Build Hub Builder/Editor
- [ ] Hub settings editor (name, description, theme)
- [ ] Tab manager (add, remove, reorder, configure)
- [ ] Tab configuration UI (per type)
- [ ] Form builder for request forms
- [ ] Workflow builder for approvals

## Database Cleanup (if needed)

```sql
-- Delete all test hubs (soft delete)
UPDATE request_hubs SET is_active = false;

-- Hard delete all data (careful!)
DELETE FROM request_hub_tabs;
DELETE FROM request_hubs;

-- Drop tables (if you need to rerun migration)
DROP TABLE IF EXISTS request_hub_tabs;
DROP TABLE IF EXISTS request_hubs;
```

## Success Criteria

✅ Migration creates tables successfully
✅ List page loads without errors
✅ Can create new hub with default tabs
✅ Hub appears in list immediately
✅ Tab count displays correctly
✅ Can delete hub (soft delete)
✅ Empty state works when no hubs
✅ All TypeScript types compile
✅ No console errors during normal flow

You're ready to start building the hub viewer and tab renderers! 🎉
