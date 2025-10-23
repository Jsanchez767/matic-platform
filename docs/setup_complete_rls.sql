-- ============================================================================
-- COMPLETE RLS SETUP FOR SUPABASE DIRECT MIGRATION
-- Run this entire file in Supabase SQL Editor
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. SCAN HISTORY (Scanner Feature)
-- ----------------------------------------------------------------------------

ALTER TABLE scan_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (safe to run multiple times)
DROP POLICY IF EXISTS "Users can view scan history from their workspaces" ON scan_history;
DROP POLICY IF EXISTS "Users can create scan history in their workspaces" ON scan_history;

CREATE POLICY "Users can view scan history from their workspaces"
ON scan_history FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id 
    FROM workspace_members 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create scan history in their workspaces"
ON scan_history FOR INSERT
WITH CHECK (
  workspace_id IN (
    SELECT workspace_id 
    FROM workspace_members 
    WHERE user_id = auth.uid()
  )
);

GRANT SELECT, INSERT ON scan_history TO authenticated;

-- ----------------------------------------------------------------------------
-- 2. DATA TABLES & COLUMNS (Table Metadata)
-- ----------------------------------------------------------------------------

ALTER TABLE data_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE table_columns ENABLE ROW LEVEL SECURITY;

-- Drop ALL old policies (including duplicates and old names)
DROP POLICY IF EXISTS "Users can view tables in their workspaces" ON data_tables;
DROP POLICY IF EXISTS "Users can create tables in their workspaces" ON data_tables;
DROP POLICY IF EXISTS "Users can update tables in their workspaces" ON data_tables;
DROP POLICY IF EXISTS "Users can delete tables in their workspaces" ON data_tables;
DROP POLICY IF EXISTS "Users can view tables in accessible workspaces" ON data_tables;
DROP POLICY IF EXISTS "Users can create tables in editable workspaces" ON data_tables;
DROP POLICY IF EXISTS "Users can update tables in editable workspaces" ON data_tables;
DROP POLICY IF EXISTS "Users can view columns in their workspaces" ON table_columns;
DROP POLICY IF EXISTS "Users can view columns in accessible tables" ON table_columns;
DROP POLICY IF EXISTS "Users can manage columns in editable tables" ON table_columns;

-- SELECT policy
CREATE POLICY "Users can view tables in their workspaces"
ON data_tables FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id 
    FROM workspace_members 
    WHERE user_id = auth.uid()
  )
);

-- INSERT policy
CREATE POLICY "Users can create tables in their workspaces"
ON data_tables FOR INSERT
WITH CHECK (
  workspace_id IN (
    SELECT workspace_id 
    FROM workspace_members 
    WHERE user_id = auth.uid()
  )
);

-- UPDATE policy
CREATE POLICY "Users can update tables in their workspaces"
ON data_tables FOR UPDATE
USING (
  workspace_id IN (
    SELECT workspace_id 
    FROM workspace_members 
    WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  workspace_id IN (
    SELECT workspace_id 
    FROM workspace_members 
    WHERE user_id = auth.uid()
  )
);

-- DELETE policy (actually soft delete via UPDATE)
CREATE POLICY "Users can delete tables in their workspaces"
ON data_tables FOR UPDATE
USING (
  workspace_id IN (
    SELECT workspace_id 
    FROM workspace_members 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can view columns in their workspaces"
ON table_columns FOR SELECT
USING (
  table_id IN (
    SELECT id 
    FROM data_tables 
    WHERE workspace_id IN (
      SELECT workspace_id 
      FROM workspace_members 
      WHERE user_id = auth.uid()
    )
  )
);

GRANT SELECT, INSERT, UPDATE ON data_tables TO authenticated;
GRANT SELECT ON table_columns TO authenticated;

-- ----------------------------------------------------------------------------
-- 3. WORKSPACES & MEMBERS (Navigation)
-- ----------------------------------------------------------------------------

ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;

-- Drop ALL old policies to prevent conflicts
DROP POLICY IF EXISTS "Users can view their workspaces" ON workspaces;
DROP POLICY IF EXISTS "Users can view workspace members" ON workspace_members;
DROP POLICY IF EXISTS "Users can view workspace members in their workspaces" ON workspace_members;
DROP POLICY IF EXISTS "Users can view their own memberships" ON workspace_members;
DROP POLICY IF EXISTS "Workspace admins can manage members" ON workspace_members;

-- Simple policy for workspace_members - no recursion
CREATE POLICY "Users can view workspace members"
ON workspace_members FOR SELECT
USING (user_id = auth.uid());

-- Policy for workspaces - references workspace_members
CREATE POLICY "Users can view their workspaces"
ON workspaces FOR SELECT
USING (
  id IN (
    SELECT workspace_id 
    FROM workspace_members 
    WHERE user_id = auth.uid()
  )
);

GRANT SELECT ON workspaces TO authenticated;
GRANT SELECT ON workspace_members TO authenticated;

-- ----------------------------------------------------------------------------
-- 3.5. ORGANIZATIONS & MEMBERS (Organization Navigation)
-- ----------------------------------------------------------------------------

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- Drop ALL old policies to prevent conflicts
DROP POLICY IF EXISTS "Users can view their organizations" ON organizations;
DROP POLICY IF EXISTS "Users can update organizations they admin" ON organizations;
DROP POLICY IF EXISTS "Members can view organization members" ON organization_members;
DROP POLICY IF EXISTS "Admins can manage organization members" ON organization_members;

-- Simple policy for organization_members - no recursion
CREATE POLICY "Members can view organization members"
ON organization_members FOR SELECT
USING (user_id = auth.uid());

-- Policy for organizations - references organization_members
CREATE POLICY "Users can view their organizations"
ON organizations FOR SELECT
USING (
  id IN (
    SELECT organization_id 
    FROM organization_members 
    WHERE user_id = auth.uid()
  )
);

GRANT SELECT ON organizations TO authenticated;
GRANT SELECT ON organization_members TO authenticated;

-- ----------------------------------------------------------------------------
-- 4. TABLE ROWS (Barcode Matching & Data Queries)
-- ----------------------------------------------------------------------------

ALTER TABLE table_rows ENABLE ROW LEVEL SECURITY;

-- Drop ALL old policies (including duplicates and old names)
DROP POLICY IF EXISTS "Users can view rows in their workspace tables" ON table_rows;
DROP POLICY IF EXISTS "Users can create rows in their workspace tables" ON table_rows;
DROP POLICY IF EXISTS "Users can update rows in their workspace tables" ON table_rows;
DROP POLICY IF EXISTS "Users can delete rows in their workspace tables" ON table_rows;
DROP POLICY IF EXISTS "Users can view rows in accessible tables" ON table_rows;
DROP POLICY IF EXISTS "Users can manage rows in editable tables" ON table_rows;

-- SELECT policy
CREATE POLICY "Users can view rows in their workspace tables"
ON table_rows FOR SELECT
USING (
  table_id IN (
    SELECT id 
    FROM data_tables 
    WHERE workspace_id IN (
      SELECT workspace_id 
      FROM workspace_members 
      WHERE user_id = auth.uid()
    )
  )
);

-- INSERT policy
CREATE POLICY "Users can create rows in their workspace tables"
ON table_rows FOR INSERT
WITH CHECK (
  table_id IN (
    SELECT id 
    FROM data_tables 
    WHERE workspace_id IN (
      SELECT workspace_id 
      FROM workspace_members 
      WHERE user_id = auth.uid()
    )
  )
);

-- UPDATE policy
CREATE POLICY "Users can update rows in their workspace tables"
ON table_rows FOR UPDATE
USING (
  table_id IN (
    SELECT id 
    FROM data_tables 
    WHERE workspace_id IN (
      SELECT workspace_id 
      FROM workspace_members 
      WHERE user_id = auth.uid()
    )
  )
)
WITH CHECK (
  table_id IN (
    SELECT id 
    FROM data_tables 
    WHERE workspace_id IN (
      SELECT workspace_id 
      FROM workspace_members 
      WHERE user_id = auth.uid()
    )
  )
);

-- DELETE policy (soft delete via UPDATE)
CREATE POLICY "Users can delete rows in their workspace tables"
ON table_rows FOR UPDATE
USING (
  table_id IN (
    SELECT id 
    FROM data_tables 
    WHERE workspace_id IN (
      SELECT workspace_id 
      FROM workspace_members 
      WHERE user_id = auth.uid()
    )
  )
);

GRANT SELECT, INSERT, UPDATE ON table_rows TO authenticated;

-- ============================================================================
-- VERIFICATION QUERIES (Optional - uncomment to test)
-- ============================================================================

-- Check if RLS is enabled on all tables:
-- SELECT tablename, rowsecurity FROM pg_tables 
-- WHERE schemaname = 'public' 
-- AND tablename IN ('scan_history', 'data_tables', 'table_columns', 'workspaces', 'workspace_members', 'table_rows');

-- Check policies:
-- SELECT tablename, policyname, cmd FROM pg_policies 
-- WHERE schemaname = 'public';

-- ============================================================================
-- DONE! Your app can now use Supabase Direct with full security
-- ============================================================================
