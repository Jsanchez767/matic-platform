# Pulse Barcode Column Migration - REQUIRED

## 🚨 Current Issues (Before Migration)
1. ❌ **Settings don't save**: Barcode column selector appears but selections aren't saved
2. ❌ **Scanner can't find rows**: Pulse QR code works but scanner doesn't know which column to search
3. ❌ **Silent failure**: No error messages, just doesn't work

## ✅ Solution
Run the migration SQL to add the `barcode_column_id` column to your Supabase database.

## Steps to Fix

### Option 1: Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy and paste the **entire contents** of `docs/003_add_barcode_column_to_pulse.sql`
6. Click **Run** (or press Cmd/Ctrl + Enter)
7. You should see: `✅ Migration successful! barcode_column_id column added to pulse_enabled_tables`

### Option 2: Supabase CLI
```bash
# If you have Supabase CLI installed
cd /path/to/matic-platform
supabase db push --file docs/003_add_barcode_column_to_pulse.sql
```

## What the Migration Does
- Adds `barcode_column_id` column to `pulse_enabled_tables`
- Sets it as a foreign key to `table_columns(id)`
- Copies existing `check_in_column_id` values as default for existing records
- Adds documentation comment

## After Running Migration
1. The barcode column selector in Pulse settings will work correctly
2. Selected column will be saved and persist across sessions
3. Scanner will use the configured column for barcode lookups

## Verify It Worked
After running the migration:
1. Open any table with Pulse enabled
2. Click the Pulse dashboard
3. Open settings (gear icon)
4. Scroll to "Advanced" section
5. Select a barcode column from the dropdown
6. Click "Save Settings"
7. Refresh the page - the selected column should still be selected ✅
