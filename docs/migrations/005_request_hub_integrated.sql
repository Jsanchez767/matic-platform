-- =====================================================
-- REQUEST HUB MODULE - INTEGRATED WITH FORMS & TABLES
-- =====================================================
-- This module creates request management hubs that integrate
-- with existing forms and tables infrastructure
-- Date: 2025-11-11
-- Version: 2.0 (Integrated)

-- =====================================================
-- REQUEST HUBS (Main container)
-- =====================================================
CREATE TABLE IF NOT EXISTS request_hubs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    
    -- Hub configuration
    settings JSONB DEFAULT '{
        "theme": {
            "primary_color": "#6366f1",
            "logo_url": null
        },
        "notifications": {
            "email_on_submit": true,
            "email_on_approve": true,
            "email_on_deny": true,
            "slack_webhook": null
        },
        "features": {
            "enable_approvals": true,
            "enable_analytics": true,
            "enable_comments": true,
            "allow_drafts": true
        }
    }'::jsonb,
    
    -- State
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(workspace_id, slug)
);

-- =====================================================
-- REQUEST HUB TABS (Navigation)
-- =====================================================
CREATE TABLE IF NOT EXISTS request_hub_tabs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hub_id UUID NOT NULL REFERENCES request_hubs(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN (
        'dashboard',      -- Overview with metrics
        'my-requests',    -- User's own requests
        'new-request',    -- Submit new request (uses form)
        'approvals',      -- Approval queue
        'all-requests',   -- All requests table
        'analytics',      -- Charts and reports
        'custom'          -- Custom tab
    )),
    icon TEXT,
    position INTEGER NOT NULL DEFAULT 0,
    is_visible BOOLEAN DEFAULT TRUE,
    
    -- Tab configuration (integrates with forms/tables)
    config JSONB DEFAULT '{}'::jsonb,
    -- Example config for different tab types:
    -- For 'new-request': { "form_id": "uuid", "redirect_after_submit": "/my-requests" }
    -- For 'all-requests': { "table_id": "uuid", "filters": [], "columns": [] }
    -- For 'dashboard': { "metrics": [], "charts": [] }
    -- For 'approvals': { "table_id": "uuid", "approval_column": "status" }
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(hub_id, slug)
);

-- =====================================================
-- REQUEST HUB FORM CONNECTIONS
-- =====================================================
-- Links request hubs to existing forms module
CREATE TABLE IF NOT EXISTS request_hub_forms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hub_id UUID NOT NULL REFERENCES request_hubs(id) ON DELETE CASCADE,
    form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    
    -- Request type classification
    request_type_name TEXT NOT NULL, -- e.g., "Budget Request", "Time Off", "Supply Request"
    request_type_slug TEXT NOT NULL, -- e.g., "budget-request"
    
    -- Workflow configuration
    workflow_enabled BOOLEAN DEFAULT FALSE,
    approval_steps JSONB DEFAULT '[]'::jsonb,
    -- Example: [
    --   {"step": 1, "role": "supervisor", "required": true},
    --   {"step": 2, "role": "finance", "required": true}
    -- ]
    
    -- Auto-actions on submit
    auto_create_table_row BOOLEAN DEFAULT TRUE,
    target_table_id UUID REFERENCES data_tables(id) ON DELETE SET NULL,
    
    -- Metadata
    position INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(hub_id, form_id),
    UNIQUE(hub_id, request_type_slug)
);

-- =====================================================
-- REQUEST HUB TABLE CONNECTIONS
-- =====================================================
-- Links request hubs to existing tables module for data storage
CREATE TABLE IF NOT EXISTS request_hub_tables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hub_id UUID NOT NULL REFERENCES request_hubs(id) ON DELETE CASCADE,
    table_id UUID NOT NULL REFERENCES data_tables(id) ON DELETE CASCADE,
    
    -- Table purpose in hub
    purpose TEXT NOT NULL CHECK (purpose IN (
        'requests_storage',  -- Main storage for all requests
        'approvals_queue',   -- Filtered view for approvals
        'analytics_source',  -- Source for analytics
        'custom'            -- Custom purpose
    )),
    
    -- Configuration
    config JSONB DEFAULT '{}'::jsonb,
    -- Example: {
    --   "status_column_id": "uuid",
    --   "priority_column_id": "uuid",
    --   "assigned_to_column_id": "uuid",
    --   "submitted_date_column_id": "uuid"
    -- }
    
    is_primary BOOLEAN DEFAULT FALSE, -- Primary storage table
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(hub_id, table_id)
);

-- =====================================================
-- REQUEST TEMPLATES (Reusable configurations)
-- =====================================================
-- Pre-configured request types that can be quickly added to hubs
CREATE TABLE IF NOT EXISTS request_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT, -- e.g., "HR", "Finance", "Operations", "IT"
    
    -- Template configuration
    form_template JSONB NOT NULL, -- Form fields configuration
    table_schema JSONB NOT NULL,  -- Table columns configuration
    workflow_template JSONB DEFAULT '[]'::jsonb,
    
    -- Metadata
    is_public BOOLEAN DEFAULT TRUE, -- Available to all workspaces
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_request_hubs_workspace ON request_hubs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_request_hubs_slug ON request_hubs(workspace_id, slug);
CREATE INDEX IF NOT EXISTS idx_request_hubs_active ON request_hubs(is_active);

CREATE INDEX IF NOT EXISTS idx_request_hub_tabs_hub ON request_hub_tabs(hub_id);
CREATE INDEX IF NOT EXISTS idx_request_hub_tabs_position ON request_hub_tabs(hub_id, position);
CREATE INDEX IF NOT EXISTS idx_request_hub_tabs_type ON request_hub_tabs(type);

CREATE INDEX IF NOT EXISTS idx_request_hub_forms_hub ON request_hub_forms(hub_id);
CREATE INDEX IF NOT EXISTS idx_request_hub_forms_form ON request_hub_forms(form_id);
CREATE INDEX IF NOT EXISTS idx_request_hub_forms_type ON request_hub_forms(request_type_slug);

CREATE INDEX IF NOT EXISTS idx_request_hub_tables_hub ON request_hub_tables(hub_id);
CREATE INDEX IF NOT EXISTS idx_request_hub_tables_table ON request_hub_tables(table_id);
CREATE INDEX IF NOT EXISTS idx_request_hub_tables_primary ON request_hub_tables(is_primary);

CREATE INDEX IF NOT EXISTS idx_request_templates_category ON request_templates(category);

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================
COMMENT ON TABLE request_hubs IS 'Customizable request management hubs integrating forms and tables';
COMMENT ON TABLE request_hub_tabs IS 'Navigation tabs within request hubs';
COMMENT ON TABLE request_hub_forms IS 'Links hubs to forms module for request submission';
COMMENT ON TABLE request_hub_tables IS 'Links hubs to tables module for data storage';
COMMENT ON TABLE request_templates IS 'Pre-configured request type templates';

COMMENT ON COLUMN request_hubs.settings IS 'Hub settings: theme, notifications, features (JSONB)';
COMMENT ON COLUMN request_hub_tabs.config IS 'Tab configuration: form_id, table_id, filters, metrics (JSONB)';
COMMENT ON COLUMN request_hub_forms.approval_steps IS 'Multi-step approval workflow configuration (JSONB array)';
COMMENT ON COLUMN request_hub_tables.config IS 'Column mappings for status, priority, assignee, etc. (JSONB)';

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Request Hubs
ALTER TABLE request_hubs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view request hubs in their workspace" ON request_hubs;
DROP POLICY IF EXISTS "Users can create request hubs in their workspace" ON request_hubs;
DROP POLICY IF EXISTS "Users can update request hubs in their workspace" ON request_hubs;
DROP POLICY IF EXISTS "Users can delete request hubs in their workspace" ON request_hubs;

CREATE POLICY "Users can view request hubs in their workspace"
    ON request_hubs FOR SELECT
    USING (
        workspace_id IN (
            SELECT workspace_id FROM workspace_members
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create request hubs in their workspace"
    ON request_hubs FOR INSERT
    WITH CHECK (
        workspace_id IN (
            SELECT workspace_id FROM workspace_members
            WHERE user_id = auth.uid()
            AND role IN ('admin', 'editor')
        )
    );

CREATE POLICY "Users can update request hubs in their workspace"
    ON request_hubs FOR UPDATE
    USING (
        workspace_id IN (
            SELECT workspace_id FROM workspace_members
            WHERE user_id = auth.uid()
            AND role IN ('admin', 'editor')
        )
    );

CREATE POLICY "Users can delete request hubs in their workspace"
    ON request_hubs FOR DELETE
    USING (
        workspace_id IN (
            SELECT workspace_id FROM workspace_members
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- Request Hub Tabs
ALTER TABLE request_hub_tabs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view tabs in accessible hubs" ON request_hub_tabs;
DROP POLICY IF EXISTS "Users can manage tabs in their workspace hubs" ON request_hub_tabs;

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

-- Request Hub Forms
ALTER TABLE request_hub_forms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view hub forms in their workspace"
    ON request_hub_forms FOR SELECT
    USING (
        hub_id IN (
            SELECT id FROM request_hubs
            WHERE workspace_id IN (
                SELECT workspace_id FROM workspace_members
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can manage hub forms in their workspace"
    ON request_hub_forms FOR ALL
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

-- Request Hub Tables
ALTER TABLE request_hub_tables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view hub tables in their workspace"
    ON request_hub_tables FOR SELECT
    USING (
        hub_id IN (
            SELECT id FROM request_hubs
            WHERE workspace_id IN (
                SELECT workspace_id FROM workspace_members
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can manage hub tables in their workspace"
    ON request_hub_tables FOR ALL
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

-- Request Templates
ALTER TABLE request_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view public templates"
    ON request_templates FOR SELECT
    USING (is_public = true OR created_by = auth.uid());

CREATE POLICY "Users can create templates"
    ON request_templates FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own templates"
    ON request_templates FOR UPDATE
    USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own templates"
    ON request_templates FOR DELETE
    USING (created_by = auth.uid());

-- =====================================================
-- EXAMPLE: How Request Hub Integrates
-- =====================================================
/*

WORKFLOW EXAMPLE:
1. Admin creates Request Hub for "HR Requests"
2. Admin links existing Forms:
   - "Time Off Request" form → request_hub_forms
   - "Equipment Request" form → request_hub_forms
   
3. Admin configures data storage:
   - Creates/links "All Requests" table → request_hub_tables (primary)
   - When form is submitted, auto-creates row in table
   
4. Admin sets up tabs:
   - Dashboard tab → shows metrics from table
   - New Request tab → shows form picker
   - My Requests tab → filtered view of table
   - Approvals tab → filtered view where status = "pending"
   
5. User workflow:
   - Visits hub
   - Clicks "New Request" tab
   - Selects request type (which loads the linked form)
   - Submits form
   - Form creates submission in form_submissions
   - Auto-creates row in linked table
   - Approval workflow triggers (if configured)
   
6. Data flow:
   Form Submission → form_submissions table
        ↓
   Auto-trigger → Creates row in data_tables/table_rows
        ↓
   Appears in → "All Requests" tab (table view)
        ↓
   Filtered in → "My Requests" (where user_id = current user)
        ↓
   Shows in → "Approvals" (where status = pending)

*/
