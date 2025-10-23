-- Enable Row Level Security on scan_history table
ALTER TABLE scan_history ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read scans from workspaces they have access to
CREATE POLICY "Users can view scan history from their workspaces"
ON scan_history FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id 
    FROM workspace_members 
    WHERE user_id = auth.uid()
  )
);

-- Policy: Users can create scans in workspaces they have access to
CREATE POLICY "Users can create scan history in their workspaces"
ON scan_history FOR INSERT
WITH CHECK (
  workspace_id IN (
    SELECT workspace_id 
    FROM workspace_members 
    WHERE user_id = auth.uid()
  )
);

-- Grant permissions to authenticated users
GRANT SELECT, INSERT ON scan_history TO authenticated;
