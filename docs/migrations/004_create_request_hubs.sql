-- Migration: Create Request Hub tables
-- Date: 2025-10-29
-- Description: Adds support for customizable request management hubs

-- Request Hubs table
CREATE TABLE IF NOT EXISTS request_hubs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(workspace_id, slug)
);

-- Request Hub Tabs table
CREATE TABLE IF NOT EXISTS request_hub_tabs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hub_id UUID NOT NULL REFERENCES request_hubs(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('dashboard', 'my-requests', 'new-request', 'approvals', 'all-requests', 'analytics', 'custom')),
    icon TEXT,
    position INTEGER NOT NULL DEFAULT 0,
    is_visible BOOLEAN DEFAULT TRUE,
    config JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(hub_id, slug)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_request_hubs_workspace ON request_hubs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_request_hubs_slug ON request_hubs(workspace_id, slug);
CREATE INDEX IF NOT EXISTS idx_request_hub_tabs_hub ON request_hub_tabs(hub_id);
CREATE INDEX IF NOT EXISTS idx_request_hub_tabs_position ON request_hub_tabs(hub_id, position);

-- Comments for documentation
COMMENT ON TABLE request_hubs IS 'Customizable request management hubs using data tables';
COMMENT ON TABLE request_hub_tabs IS 'Configurable tabs within request hubs';

COMMENT ON COLUMN request_hubs.settings IS 'Hub settings: theme, notifications, permissions (JSONB)';
COMMENT ON COLUMN request_hub_tabs.config IS 'Tab configuration: table_id, filters, columns, metrics (JSONB)';
COMMENT ON COLUMN request_hub_tabs.type IS 'Tab type: dashboard, my-requests, new-request, approvals, all-requests, analytics, custom';

-- RLS Policies
ALTER TABLE request_hubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_hub_tabs ENABLE ROW LEVEL SECURITY;

-- Users can view request hubs in their workspace
CREATE POLICY "Users can view request hubs in their workspace"
    ON request_hubs FOR SELECT
    USING (
        workspace_id IN (
            SELECT workspace_id FROM workspace_members
            WHERE user_id = auth.uid()
        )
    );

-- Users can create request hubs in their workspace
CREATE POLICY "Users can create request hubs in their workspace"
    ON request_hubs FOR INSERT
    WITH CHECK (
        workspace_id IN (
            SELECT workspace_id FROM workspace_members
            WHERE user_id = auth.uid()
            AND role IN ('admin', 'editor')
        )
    );

-- Users can update request hubs in their workspace
CREATE POLICY "Users can update request hubs in their workspace"
    ON request_hubs FOR UPDATE
    USING (
        workspace_id IN (
            SELECT workspace_id FROM workspace_members
            WHERE user_id = auth.uid()
            AND role IN ('admin', 'editor')
        )
    );

-- Users can delete request hubs in their workspace
CREATE POLICY "Users can delete request hubs in their workspace"
    ON request_hubs FOR DELETE
    USING (
        workspace_id IN (
            SELECT workspace_id FROM workspace_members
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- Tabs policies (inherit from hub permissions)
CREATE POLICY "Users can view tabs in accessible hubs"
    ON request_hub_tabs FOR SELECT
    USING (
        hub_id IN (
            SELECT id FROM request_hubs
            WHERE workspace_id IN (
                SELECT workspace_id FROM workspace_members
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can manage tabs in their workspace hubs"
    ON request_hub_tabs FOR ALL
    USING (
        hub_id IN (
            SELECT id FROM request_hubs
            WHERE workspace_id IN (
                SELECT workspace_id FROM workspace_members
                WHERE user_id = auth.uid()
                AND role IN ('admin', 'editor')
            )
        )
    );
