# Pulse Barcode Column Migration

## Issue
The Pulse settings modal now has a barcode column selector, but the database schema is missing the `barcode_column_id` column in the `pulse_enabled_tables` table.

## Solution
Run the migration SQL to add the column to your Supabase database.

## Steps to Fix

### Option 1: Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy and paste the contents of `docs/003_add_barcode_column_to_pulse.sql`
5. Click **Run** to execute the migration

### Option 2: Supabase CLI
```bash
# If you have Supabase CLI installed
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
