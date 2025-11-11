# 🚨 URGENT: Run Request Hub Migration

## Problem
Your Request Hub feature is missing because the database tables don't exist yet!

The code expects these tables:
- ✅ `request_hubs` - Hub configurations
- ✅ `request_hub_tabs` - Hub tab configurations

But they haven't been created in your Supabase database.

---

## Quick Fix (2 minutes)

### Step 1: Go to Supabase SQL Editor
https://supabase.com/dashboard/project/bpvdnphvunezonyrjwub/sql/new

### Step 2: Copy This File
Open: `docs/migrations/004_create_request_hubs.sql`

### Step 3: Paste and Run
1. Copy the ENTIRE contents of `004_create_request_hubs.sql`
2. Paste into the SQL Editor
3. Click "Run" button (or press Cmd/Ctrl + Enter)

### Step 4: Verify
You should see output like:
```
✓ CREATE TABLE request_hubs
✓ CREATE TABLE request_hub_tabs
✓ CREATE INDEX idx_request_hubs_workspace
✓ RLS policies created
```

### Step 5: Refresh Your App
Hard refresh your browser (Cmd+Shift+R) and Request Hubs will work!

---

## What This Creates

### Tables:
1. **request_hubs** - Stores hub configurations with:
   - name, slug, description
   - settings (theme, notifications)
   - workspace_id reference
   - is_active status

2. **request_hub_tabs** - Stores tab configurations with:
   - Tab types: dashboard, my-requests, new-request, approvals, all-requests, analytics, custom
   - icon, position, visibility
   - config (table_id, filters, columns, metrics)

### Tab Types Available:
- 📊 **Dashboard** - Metrics and overview
- 👤 **My Requests** - User's submitted requests
- ➕ **New Request** - Submit new requests
- ✅ **Approvals** - Approval queue
- 📋 **All Requests** - Complete request list
- 📈 **Analytics** - Charts and insights
- 🎨 **Custom** - Custom configurations

---

## If You Get Errors

**"table already exists"**: That's OK - some tables were created. Continue anyway.

**"permission denied"**: Make sure you're logged in as the project owner in Supabase.

**"relation does not exist"**: Run the main schema first (`docs/001_initial_schema.sql`)

---

## After Migration

You'll be able to:
- ✅ Create Request Hubs
- ✅ Configure custom tabs
- ✅ Build request workflows
- ✅ Set up approval processes
- ✅ Track request analytics
