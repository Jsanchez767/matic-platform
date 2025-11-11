# Run Pulse Migration

Your Pulse feature is not working because the database tables don't exist yet.

## Quick Fix (2 minutes)

### Step 1: Go to Supabase SQL Editor
https://supabase.com/dashboard/project/bpvdnphvunezonyrjwub/sql/new

### Step 2: Copy This File
Open: `docs/002_pulse_module.sql`

### Step 3: Paste and Run
1. Copy the ENTIRE contents of `002_pulse_module.sql`
2. Paste into the SQL Editor
3. Click "Run" button

### Step 4: Verify
You should see output like:
```
✓ RLS Enabled pulse_enabled_tables
✓ RLS Enabled pulse_check_ins  
✓ RLS Enabled pulse_scanner_sessions
```

### Step 5: Refresh Your App
Hard refresh your browser (Cmd+Shift+R) and Pulse will work!

---

## What This Does

Creates 3 tables:
- `pulse_enabled_tables` - Pulse configuration per table
- `pulse_check_ins` - Check-in event records
- `pulse_scanner_sessions` - Active scanner tracking

## If You Get Errors

If you see "table already exists" errors, that's OK - it means some tables were created. 

If you see permission errors, make sure you're logged in as the project owner in Supabase.
