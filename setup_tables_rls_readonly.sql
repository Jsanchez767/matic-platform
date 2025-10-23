-- Enable Row Level Security on data tables
ALTER TABLE data_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE table_columns ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view tables from their workspaces
CREATE POLICY "Users can view tables in their workspaces"
ON data_tables FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id 
    FROM workspace_members 
    WHERE user_id = auth.uid()
  )
);

-- Policy: Users can view columns from tables in their workspaces
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

-- Grant permissions to authenticated users
GRANT SELECT ON data_tables TO authenticated;
GRANT SELECT ON table_columns TO authenticated;
