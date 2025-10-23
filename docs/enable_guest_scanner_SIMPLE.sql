-- ============================================================================
-- CREATE GUEST SCANNER SYSTEM USER - SIMPLE VERSION
-- Run this in Supabase SQL Editor
-- ============================================================================

-- This creates a system user record in auth.users for guest scanner operations
-- All anonymous scans will use this user ID for created_by/updated_by fields

-- Insert the system user into auth.users
-- UUID: 00000000-0000-0000-0000-000000000001
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  role,
  aud
)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'scanner-guest@system.local',
  crypt('SYSTEM_USER_NO_LOGIN', gen_salt('bf')), -- Random password, won't be used
  NOW(),
  NOW(),
  NOW(),
  'authenticated',
  'authenticated'
)
ON CONFLICT (id) DO NOTHING;

-- Verify the user was created
SELECT id, email, created_at 
FROM auth.users 
WHERE id = '00000000-0000-0000-0000-000000000001';

-- ============================================================================
-- UPDATE RLS POLICIES FOR GUEST ACCESS
-- ============================================================================

-- Allow anonymous users to read tables (needed for barcode lookup)
DROP POLICY IF EXISTS "Guest scanner can view tables" ON data_tables;
CREATE POLICY "Guest scanner can view tables"
ON data_tables FOR SELECT
TO anon
USING (true);

-- Allow anonymous users to read columns (needed for column name resolution)
DROP POLICY IF EXISTS "Guest scanner can view columns" ON table_columns;
CREATE POLICY "Guest scanner can view columns"
ON table_columns FOR SELECT
TO anon
USING (true);

-- Allow anonymous users to read rows (needed for barcode matching)
DROP POLICY IF EXISTS "Guest scanner can view rows" ON table_rows;
CREATE POLICY "Guest scanner can view rows"
ON table_rows FOR SELECT
TO anon
USING (true);

-- Allow anonymous users to update rows (needed for scan count increment)
DROP POLICY IF EXISTS "Guest scanner can update rows" ON table_rows;
CREATE POLICY "Guest scanner can update rows"
ON table_rows FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);

-- Allow anonymous users to create scan history
DROP POLICY IF EXISTS "Guest scanner can create scan history" ON scan_history;
CREATE POLICY "Guest scanner can create scan history"
ON scan_history FOR INSERT
TO anon
WITH CHECK (true);

-- Allow anonymous users to view workspaces (needed for scanner pairing)
DROP POLICY IF EXISTS "Guest scanner can view workspaces" ON workspaces;
CREATE POLICY "Guest scanner can view workspaces"
ON workspaces FOR SELECT
TO anon
USING (true);

-- Grant necessary permissions to anonymous role
GRANT SELECT ON data_tables TO anon;
GRANT SELECT ON table_columns TO anon;
GRANT SELECT, UPDATE ON table_rows TO anon;
GRANT INSERT ON scan_history TO anon;
GRANT SELECT ON workspaces TO anon;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check that policies were created for anon role
SELECT 
  tablename, 
  policyname, 
  CASE WHEN 'anon' = ANY(roles) THEN '✓' ELSE '✗' END as has_anon_access,
  cmd as operation
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('data_tables', 'table_columns', 'table_rows', 'scan_history', 'workspaces')
ORDER BY tablename, policyname;

-- ============================================================================
-- SECURITY NOTES
-- ============================================================================

-- ⚠️ WARNING: This allows FULL ANONYMOUS ACCESS to:
-- - Read all tables, columns, rows, and workspaces
-- - Update any row (to increment scan count)
-- - Create scan history records

-- 🔒 RECOMMENDED SECURITY IMPROVEMENTS:
-- 
-- 1. Add workspace-specific policies:
--    USING (workspace_id IN (SELECT id FROM workspaces WHERE allow_guest_scanning = true))
--
-- 2. Add rate limiting at application level
--
-- 3. Add CAPTCHA or anti-abuse measures
--
-- 4. Monitor scan_history for suspicious patterns
--
-- 5. Consider time-based pairing code expiration
--
-- 6. Add IP-based rate limiting in Supabase Edge Functions

-- ============================================================================
-- DONE! Guest scanner access is now enabled
-- ============================================================================
