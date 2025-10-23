-- Enable Row Level Security on workspaces and workspace_members
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view workspaces they are members of
CREATE POLICY "Users can view their workspaces"
ON workspaces FOR SELECT
USING (
  id IN (
    SELECT workspace_id 
    FROM workspace_members 
    WHERE user_id = auth.uid()
  )
);

-- Policy: Users can view workspace memberships they have access to
CREATE POLICY "Users can view workspace members in their workspaces"
ON workspace_members FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id 
    FROM workspace_members 
    WHERE user_id = auth.uid()
  )
);

-- Policy: Users can see their own membership records
CREATE POLICY "Users can view their own memberships"
ON workspace_members FOR SELECT
USING (user_id = auth.uid());

-- Grant permissions to authenticated users
GRANT SELECT ON workspaces TO authenticated;
GRANT SELECT ON workspace_members TO authenticated;
