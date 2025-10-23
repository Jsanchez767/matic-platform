-- ============================================================================
-- CREATE GUEST SCANNER SYSTEM USER
-- Run this in Supabase SQL Editor to enable anonymous scanner access
-- ============================================================================

-- This creates a special system user for guest scanner operations
-- All anonymous scans will use this user ID for created_by/updated_by fields

-- First, create the user in auth.users (if not already exists)
-- NOTE: You need to create this user via Supabase Auth UI or API
-- Email: scanner-guest@system.local
-- Password: (generate a secure one, won't be used for login)
-- Then get the UUID and use it below

-- Option 1: If you have the UUID from Supabase Auth:
-- Replace 'YOUR-SYSTEM-USER-UUID-HERE' with the actual UUID

-- Option 2: Create via SQL (requires service role access):
-- This approach creates a user that can be used for system operations

DO $$
DECLARE
  system_user_id UUID;
BEGIN
  -- Try to find existing system user
  SELECT id INTO system_user_id 
  FROM auth.users 
  WHERE email = 'scanner-guest@system.local';
  
  -- If not found, you'll need to create via Supabase Auth UI
  -- or use this placeholder UUID (update with real one after creation)
  IF system_user_id IS NULL THEN
    RAISE NOTICE 'System user not found. Please create user with email: scanner-guest@system.local';
    RAISE NOTICE 'Then update GUEST_SCANNER_USER_ID in environment variables';
  ELSE
    RAISE NOTICE 'System user found: %', system_user_id;
  END IF;
END $$;

-- ============================================================================
-- ALTERNATIVE: Use a fixed UUID for guest operations
-- ============================================================================
-- If you want to use a specific UUID without creating auth user,
-- you can create a special table for system users:

CREATE TABLE IF NOT EXISTS system_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  purpose TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert guest scanner system user
INSERT INTO system_users (id, email, name, purpose)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'scanner-guest@system.local',
  'Guest Scanner',
  'Used for anonymous mobile scanner operations'
)
ON CONFLICT (email) DO NOTHING;

-- ============================================================================
-- UPDATE RLS POLICIES FOR GUEST ACCESS
-- ============================================================================

-- Allow guest scanner to read tables (needed for barcode lookup)
DROP POLICY IF EXISTS "Guest scanner can view tables" ON data_tables;
CREATE POLICY "Guest scanner can view tables"
ON data_tables FOR SELECT
TO anon
USING (true); -- Allow read access to all tables for guest scanners

-- Allow guest scanner to read columns (needed for column name resolution)
DROP POLICY IF EXISTS "Guest scanner can view columns" ON table_columns;
CREATE POLICY "Guest scanner can view columns"
ON table_columns FOR SELECT
TO anon
USING (true); -- Allow read access to all columns

-- Allow guest scanner to read rows (needed for barcode matching)
DROP POLICY IF EXISTS "Guest scanner can view rows" ON table_rows;
CREATE POLICY "Guest scanner can view rows"
ON table_rows FOR SELECT
TO anon
USING (true); -- Allow read access to all rows for barcode search

-- Allow guest scanner to update rows (needed for scan count increment)
DROP POLICY IF EXISTS "Guest scanner can update rows" ON table_rows;
CREATE POLICY "Guest scanner can update rows"
ON table_rows FOR UPDATE
TO anon
USING (true) -- Allow updates to any row
WITH CHECK (true);

-- Allow guest scanner to create scan history
DROP POLICY IF EXISTS "Guest scanner can create scan history" ON scan_history;
CREATE POLICY "Guest scanner can create scan history"
ON scan_history FOR INSERT
TO anon
WITH CHECK (true); -- Allow creating scan history records

-- Grant necessary permissions to anonymous role
GRANT SELECT ON data_tables TO anon;
GRANT SELECT ON table_columns TO anon;
GRANT SELECT, UPDATE ON table_rows TO anon;
GRANT INSERT ON scan_history TO anon;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check that policies were created
SELECT tablename, policyname, roles, cmd 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('data_tables', 'table_columns', 'table_rows', 'scan_history')
AND 'anon' = ANY(roles)
ORDER BY tablename, policyname;

-- ============================================================================
-- IMPORTANT SECURITY NOTES
-- ============================================================================

-- WARNING: This setup allows ANONYMOUS ACCESS to:
-- 1. Read all tables, columns, and rows (needed for barcode matching)
-- 2. Update any row (needed to increment scan count)
-- 3. Create scan history records (needed for audit trail)

-- RECOMMENDATIONS:
-- 1. Limit guest access to specific workspaces/tables if needed
-- 2. Add rate limiting at application or API gateway level
-- 3. Monitor scan_history for abuse patterns
-- 4. Consider adding workspace_id checks to policies
-- 5. Implement CAPTCHA or other anti-abuse measures in the scanner UI

-- MORE SECURE ALTERNATIVE:
-- Instead of full anon access, you could:
-- 1. Create a service role API endpoint for guest scans
-- 2. Validate pairing codes on the server
-- 3. Only allow operations on tables associated with valid pairing codes
-- 4. Keep RLS strict and handle guest operations server-side

-- ============================================================================
-- DONE! Anonymous scanner access is now enabled
-- ============================================================================
