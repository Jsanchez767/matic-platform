# Request Hub Setup Guide

## Status
✅ All components implemented and pushed to GitHub
⏳ Database migration needs to be run
⏳ Sample data needs to be created

## Step 1: Run Database Migration

Run this SQL in your Supabase SQL Editor:

```sql
-- Copy the entire content from docs/migrations/004_create_request_hubs.sql
-- This will create:
-- - request_hubs table
-- - request_hub_tabs table
-- - Indexes
-- - RLS policies
```

## Step 2: Create Your First Request Hub

Once the migration is complete, you can create a Request Hub in two ways:

### Option A: Through the UI
1. Navigate to your workspace
2. Click on "Request Hubs" in the sidebar (or use quick actions)
3. Click "Create Request Hub"
4. Fill in:
   - Name: "Programs" (or any name you want)
   - Slug: "programs" (URL-friendly)
   - Description: "Manage program requests"
5. Click "Create"

### Option B: Insert Sample Data Directly

Run this SQL in Supabase to create a sample hub:

```sql
-- Insert a sample Request Hub
INSERT INTO request_hubs (workspace_id, name, slug, description, created_by)
VALUES (
  'YOUR_WORKSPACE_ID_HERE',  -- Replace with your actual workspace ID
  'Programs',
  'programs',
  'Manage program requests and approvals',
  auth.uid()
) RETURNING id;

-- Copy the returned ID and use it below
-- Insert default tabs for the hub
INSERT INTO request_hub_tabs (hub_id, name, slug, type, position, config)
VALUES
  ('HUB_ID_HERE', 'Dashboard', 'dashboard', 'dashboard', 0, '{}'),
  ('HUB_ID_HERE', 'My Requests', 'my-requests', 'my-requests', 1, '{}'),
  ('HUB_ID_HERE', 'New Request', 'new-request', 'new-request', 2, '{}'),
  ('HUB_ID_HERE', 'Approvals', 'approvals', 'approvals', 3, '{}'),
  ('HUB_ID_HERE', 'All Requests', 'all-requests', 'all-requests', 4, '{}'),
  ('HUB_ID_HERE', 'Analytics', 'analytics', 'analytics', 5, '{}');
```

## Step 3: View Your Request Hub

1. Go to your workspace
2. Click "Request Hubs" in the sidebar
3. You should see your "Programs" hub
4. Click on it
5. You'll see all the tabs: Dashboard, My Requests, New Request, Approvals, All Requests, Analytics

## What You'll See

### Dashboard Tab
- Metric cards showing:
  - Total Requests: 0
  - Pending Approvals: 0
  - Avg Approval Time: 0h
  - Approval Rate: 0%
- Recent requests list (empty for now)

### My Requests Tab
- Your submitted requests (filtered by user)
- Empty state showing "No requests found"

### New Request Tab
- Dynamic form with sample fields:
  - Request Title (text, required)
  - Description (textarea, required)
  - Priority (select: low/medium/high)
- Draft saving capability
- File attachment support

### Approvals Tab
- Approval queue for requests awaiting your approval
- Approve/Deny/Request Changes buttons
- Empty state: "No pending approvals"

### All Requests Tab
- Complete list of all requests (admin view)
- Filter and sort options
- Empty state for now

### Analytics Tab
- 3 charts:
  - Bar chart: Requests by Type
  - Pie chart: Status Distribution
  - Line chart: Request Trends (last 30 days)
- All showing 0 data initially

## Next Steps: Adding Real Data

To see real data flowing through the system, you'll need to:

1. **Create Backend Endpoints** for requests (FastAPI):
   - POST `/api/requests` - Create request
   - GET `/api/requests` - List requests
   - GET `/api/requests/{id}` - Get request details
   - PATCH `/api/requests/{id}` - Update request
   - POST `/api/requests/{id}/approve` - Approve request
   - POST `/api/requests/{id}/deny` - Deny request

2. **Create Form Templates Table** (optional for now):
   - Store form field configurations
   - Link to workflows

3. **Create Requests Data Table**:
   - Use your existing data_tables system
   - Each Request Hub can link to a specific table

4. **Connect Components to Real Data**:
   - Update RequestHubViewer.tsx to fetch real data
   - Replace mock data with API calls

## Quick Test

To quickly test the system without backend:

1. Open `src/components/RequestHub/RequestHubViewer.tsx`
2. In the Dashboard tab, you'll see mock metrics
3. Click on each tab to see the different components
4. Try the "New Request" form - it will show an alert when you submit
5. The components are fully functional, just waiting for real data!

## Current Component Status

✅ **Fully Implemented and Working**:
- RequestHubListPage - Create, list, delete hubs
- RequestHubViewer - Main hub interface
- DashboardMetrics - Metric cards
- RequestList - Display requests
- DynamicForm - Form builder with 10 field types
- ItemListField - Budget items with calculations
- ApprovalQueue - Approval workflow
- RequestDetailsModal - Detailed view
- RequestsChart - Analytics (Bar, Pie, Line)
- FormBuilder - Admin form creator
- WorkflowBuilder - Admin workflow creator
- AdminSettings - Admin panel

⏳ **Pending (Just needs data)**:
- Backend API integration
- Real request data
- Form templates in database
- Workflow execution
- File uploads

## Troubleshooting

**Hub not appearing?**
- Check if migration ran successfully
- Verify workspace_id matches your actual workspace
- Check browser console for errors

**Tabs showing "Coming soon"?**
- This is the old screenshot - new code shows real components
- Make sure you pulled latest code from GitHub
- Check if hub has tabs in database

**Components not loading?**
- Check browser console for import errors
- Verify all dependencies installed: `npm install`
- Try clearing Next.js cache: `rm -rf .next && npm run dev`
