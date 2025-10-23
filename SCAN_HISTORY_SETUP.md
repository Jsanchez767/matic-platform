# Scan History Table Setup Guide

## Issue
The `scan_history` table is not receiving data because it hasn't been created in the Supabase database yet.

## Solution

### Step 1: Create the Table in Supabase

1. Open your Supabase project dashboard
2. Navigate to **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy and paste the contents of `create_scan_history_table.sql`
5. Click **Run** or press `Cmd/Ctrl + Enter`

### Step 2: Verify Table Creation

Run this query in the SQL Editor to verify:

```sql
SELECT 
    tablename, 
    schemaname
FROM pg_tables 
WHERE tablename = 'scan_history';
```

You should see one row returned with `tablename: scan_history` and `schemaname: public`.

### Step 3: Test the API Endpoint

Open your browser console on the scanner page and run:

```javascript
// Test creating a scan record
const testScan = {
  workspace_id: "YOUR_WORKSPACE_ID", // Replace with actual workspace ID
  table_id: "YOUR_TABLE_ID", // Replace with actual table ID
  column_name: "email",
  barcode: "test123",
  status: "success",
  matched_row_ids: [],
  matched_rows: [],
  source: "mobile",
  metadata: {
    scannedBy: "Test User",
    scannedByEmail: "test@example.com"
  }
};

fetch('https://backend.maticsapp.com/api/scans', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(testScan)
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```

### Step 4: Enable Realtime (Optional but Recommended)

If Realtime isn't working, run this in SQL Editor:

```sql
-- Check if table is in replication
SELECT * FROM pg_publication_tables 
WHERE tablename = 'scan_history';

-- If not found, add it
ALTER PUBLICATION supabase_realtime ADD TABLE scan_history;
```

### Step 5: Verify Data is Being Saved

After scanning a barcode, check in Supabase:

1. Go to **Table Editor** > **scan_history**
2. You should see new rows appearing

Or run this query:

```sql
SELECT * FROM scan_history 
ORDER BY created_at DESC 
LIMIT 10;
```

## Troubleshooting

### Error: "Table not found"
- The table hasn't been created yet. Run `create_scan_history_table.sql`

### Error: "Workspace mismatch for table"
- Check that `workspace_id` matches the table's `workspace_id`
- Query to verify: `SELECT workspace_id FROM data_tables WHERE id = 'YOUR_TABLE_ID'`

### Error: "Column does not belong to table"
- Check that `column_id` belongs to the correct table
- Query to verify: `SELECT table_id FROM table_columns WHERE id = 'YOUR_COLUMN_ID'`

### No Realtime Updates
- Run: `ALTER PUBLICATION supabase_realtime ADD TABLE scan_history;`
- Restart your app/browser

### Backend Returns 500 Error
- Check backend logs: `cd backend && source .venv/bin/activate && uvicorn app.main:app --reload`
- Look for database connection errors

## Quick Verification Checklist

- [ ] `scan_history` table exists in Supabase
- [ ] Table has all required columns (id, workspace_id, table_id, barcode, etc.)
- [ ] Indexes are created
- [ ] Realtime is enabled for the table
- [ ] Backend is running and accessible
- [ ] No RLS policies blocking inserts
- [ ] API_URL environment variable is correct

## Getting Actual IDs

To find your workspace_id and table_id for testing:

```sql
-- Get workspace ID
SELECT id, name FROM workspaces LIMIT 5;

-- Get table ID
SELECT id, name, workspace_id FROM data_tables LIMIT 5;

-- Get column info
SELECT id, name, table_id FROM table_columns 
WHERE table_id = 'YOUR_TABLE_ID';
```
