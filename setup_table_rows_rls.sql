-- Enable Row Level Security on table_rows
ALTER TABLE table_rows ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view rows from tables in their workspaces
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

-- Grant permissions to authenticated users
GRANT SELECT ON table_rows TO authenticated;
