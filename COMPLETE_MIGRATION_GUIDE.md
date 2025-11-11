# 🚀 Complete Database Setup Guide

## Overview
Your Matic Platform is missing some database tables. Here's the complete list of migrations you need to run.

---

## Required Migrations (In Order)

### ✅ 1. Main Schema (Already Done)
**File**: `docs/001_initial_schema.sql`  
**Status**: ✅ Already created (tables, forms, workspaces exist)

---

### ❌ 2. Pulse Module (Event Check-ins)
**File**: `docs/002_pulse_module.sql`  
**Status**: ❌ NOT RUN - Pulse features don't work
**Instructions**: See `RUN_PULSE_MIGRATION.md`

**What this adds**:
- Event check-in tracking
- Barcode scanning
- Scanner sessions
- Real-time dashboards

---

### ❌ 3. Request Hubs (URGENT - Current Issue)
**File**: `docs/migrations/004_create_request_hubs.sql`  
**Status**: ❌ NOT RUN - Request Hub features missing
**Instructions**: See `RUN_REQUEST_HUB_MIGRATION.md`

**What this adds**:
- Request Hub management
- Custom hub tabs (dashboard, my-requests, approvals, etc.)
- Request workflows
- Tab configurations

---

### 🤔 4. Optional Enhancements

**Barcode Column for Pulse**:
- File: `docs/003_add_barcode_column_to_pulse.sql`
- Run AFTER 002_pulse_module.sql
- Adds barcode_column_id support

**Workspace Logo**:
- File: `docs/migrations/002_add_workspace_logo.sql`
- Adds logo support to workspaces

---

## Quick Setup (Run All)

### Option 1: Copy-Paste Method (Easiest)

1. Go to: https://supabase.com/dashboard/project/bpvdnphvunezonyrjwub/sql/new

2. Run these in order (separate queries):
   ```sql
   -- Query 1: Pulse Module
   -- Copy entire contents of docs/002_pulse_module.sql
   
   -- Query 2: Request Hubs (URGENT)
   -- Copy entire contents of docs/migrations/004_create_request_hubs.sql
   
   -- Query 3: Barcode Column (Optional)
   -- Copy entire contents of docs/003_add_barcode_column_to_pulse.sql
   ```

3. Run each query separately (click Run after pasting each one)

---

## Verification

After running migrations, check in your app:

### ✅ Pulse Features Work:
- Go to any table
- Click "Enable Pulse" 
- Should see check-in configuration

### ✅ Request Hubs Work:
- Navigate to Request Hubs section
- Click "Create Hub"
- Should create successfully

### ✅ Console Errors Gone:
- Open browser console (F12)
- Should see no "table does not exist" errors
- Should see "✅ Request hubs loaded: X"

---

## Priority Order

🔴 **URGENT - Do First**:
1. `004_create_request_hubs.sql` - Request Hubs not working

🟡 **Important - Do Soon**:
2. `002_pulse_module.sql` - Pulse features not working

🟢 **Optional - Nice to Have**:
3. `003_add_barcode_column_to_pulse.sql` - Enhanced barcode support
4. `002_add_workspace_logo.sql` - Workspace branding

---

## Troubleshooting

**"table already exists"**:
- Skip that migration, it's already done

**"relation does not exist"**:
- You're missing a prerequisite migration
- Run earlier numbered migrations first

**"permission denied"**:
- Make sure you're logged in as project owner
- Check you're in the right Supabase project

**Still broken after migration**:
- Hard refresh browser (Cmd+Shift+R)
- Check browser console for specific errors
- Run verification queries at end of migration files

---

## Current Status

Based on your error "request hub new features are not there":

- ❌ `request_hubs` table - DOES NOT EXIST
- ❌ `request_hub_tabs` table - DOES NOT EXIST
- ❌ `pulse_enabled_tables` table - DOES NOT EXIST

**Fix**: Run migrations 004 and 002 immediately!
