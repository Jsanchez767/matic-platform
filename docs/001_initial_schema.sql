-- =====================================================
-- MATIC PLATFORM - COMPLETE DATABASE SCHEMA
-- Lean, scalable architecture for forms and tables
-- Uses Supabase Auth + Real-time features
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Organizations/Companies
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    logo_url TEXT,
    settings JSONB DEFAULT '{}',
    subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'enterprise')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organization members (links users to organizations)
CREATE TABLE organization_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'editor', 'member')),
    permissions JSONB DEFAULT '{}',
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, user_id)
);

-- Workspaces (containers for related forms/tables)
CREATE TABLE workspaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#3B82F6',
    icon TEXT DEFAULT 'folder',
    settings JSONB DEFAULT '{}',
    is_archived BOOLEAN DEFAULT FALSE,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, slug)
);

-- Workspace members (granular access control)
CREATE TABLE workspace_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('admin', 'editor', 'viewer')),
    permissions JSONB DEFAULT '{}',
    added_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(workspace_id, user_id)
);

-- =====================================================
-- FORMS AND FIELDS SYSTEM
-- =====================================================

-- Forms (the main building blocks)
CREATE TABLE forms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    slug TEXT NOT NULL,
    
    -- Form configuration
    settings JSONB DEFAULT '{}', -- theme, notifications, etc.
    submit_settings JSONB DEFAULT '{}', -- redirect, email, etc.
    
    -- Form state
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived', 'paused')),
    version INTEGER DEFAULT 1,
    is_public BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    published_at TIMESTAMPTZ,
    
    UNIQUE(workspace_id, slug)
);

-- Form fields (the building blocks of forms)
CREATE TABLE form_fields (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    
    -- Field identification
    name TEXT NOT NULL, -- internal name (snake_case)
    label TEXT NOT NULL, -- display label
    placeholder TEXT,
    description TEXT,
    
    -- Field configuration
    field_type TEXT NOT NULL CHECK (field_type IN (
        'text', 'textarea', 'email', 'phone', 'number', 'url',
        'select', 'multiselect', 'radio', 'checkbox',
        'date', 'datetime', 'time',
        'file', 'image',
        'signature', 'rating',
        'divider', 'heading', 'paragraph'
    )),
    
    -- Field settings (validation, options, etc.)
    settings JSONB DEFAULT '{}',
    validation JSONB DEFAULT '{}', -- required, min, max, pattern, etc.
    options JSONB DEFAULT '[]', -- for select, radio, checkbox fields
    
    -- Layout and ordering
    position INTEGER NOT NULL DEFAULT 0,
    width TEXT DEFAULT 'full' CHECK (width IN ('full', 'half', 'third', 'quarter')),
    is_visible BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Form submissions
CREATE TABLE form_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    
    -- Submission data
    data JSONB NOT NULL DEFAULT '{}', -- all field values
    metadata JSONB DEFAULT '{}', -- IP, user agent, etc.
    
    -- Submission state
    status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'reviewed', 'approved', 'rejected')),
    
    -- Identity (optional - for anonymous submissions)
    submitted_by UUID REFERENCES auth.users(id),
    email TEXT, -- for anonymous submissions
    
    -- Timestamps
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES auth.users(id)
);

-- =====================================================
-- COLLABORATION AND REAL-TIME
-- =====================================================

-- Active sessions (for real-time collaboration)
CREATE TABLE active_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    form_id UUID REFERENCES forms(id) ON DELETE CASCADE,
    
    -- Session data
    cursor_position JSONB DEFAULT '{}',
    selected_element TEXT,
    user_agent TEXT,
    
    -- Timestamps
    started_at TIMESTAMPTZ DEFAULT NOW(),
    last_activity TIMESTAMPTZ DEFAULT NOW(),
    
    -- Cleanup old sessions
    CONSTRAINT active_session_check CHECK (
        (workspace_id IS NOT NULL AND form_id IS NULL) OR 
        (workspace_id IS NULL AND form_id IS NOT NULL)
    )
);

-- Activity log (for audit trail and notifications)
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    form_id UUID REFERENCES forms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Activity details
    action TEXT NOT NULL, -- 'created', 'updated', 'deleted', 'published', etc.
    entity_type TEXT NOT NULL, -- 'form', 'field', 'submission', 'workspace'
    entity_id UUID NOT NULL,
    details JSONB DEFAULT '{}', -- additional context
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Organizations and workspaces
CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_workspaces_org_slug ON workspaces(organization_id, slug);
CREATE INDEX idx_workspace_members_workspace ON workspace_members(workspace_id);
CREATE INDEX idx_workspace_members_user ON workspace_members(user_id);

-- Forms and fields
CREATE INDEX idx_forms_workspace ON forms(workspace_id);
CREATE INDEX idx_forms_workspace_slug ON forms(workspace_id, slug);
CREATE INDEX idx_forms_status ON forms(status);
CREATE INDEX idx_form_fields_form ON form_fields(form_id);
CREATE INDEX idx_form_fields_position ON form_fields(form_id, position);

-- Submissions
CREATE INDEX idx_submissions_form ON form_submissions(form_id);
CREATE INDEX idx_submissions_submitted_at ON form_submissions(submitted_at);
CREATE INDEX idx_submissions_status ON form_submissions(status);
CREATE INDEX idx_submissions_user ON form_submissions(submitted_by);

-- Real-time and activity
CREATE INDEX idx_active_sessions_user ON active_sessions(user_id);
CREATE INDEX idx_active_sessions_workspace ON active_sessions(workspace_id);
CREATE INDEX idx_active_sessions_form ON active_sessions(form_id);
CREATE INDEX idx_active_sessions_activity ON active_sessions(last_activity);
CREATE INDEX idx_activity_logs_workspace ON activity_logs(workspace_id);
CREATE INDEX idx_activity_logs_form ON activity_logs(form_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Organizations: Users can only see organizations they're members of
CREATE POLICY "Users can view their organizations" ON organizations
    FOR SELECT USING (
        id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can update organizations they admin" ON organizations
    FOR UPDATE USING (
        id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- Organization members: Members can view, admins can manage
CREATE POLICY "Members can view organization members" ON organization_members
    FOR SELECT USING (
        organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
    );

CREATE POLICY "Admins can manage organization members" ON organization_members
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- Workspaces: Based on organization membership
CREATE POLICY "Users can view workspaces in their organizations" ON workspaces
    FOR SELECT USING (
        organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can create workspaces in their organizations" ON workspaces
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor')
        )
    );

CREATE POLICY "Users can update workspaces they have access to" ON workspaces
    FOR UPDATE USING (
        id IN (
            SELECT workspace_id FROM workspace_members 
            WHERE user_id = auth.uid() AND role IN ('admin', 'editor')
        )
    );

-- Workspace members: Workspace admins can manage
CREATE POLICY "Users can view workspace members" ON workspace_members
    FOR SELECT USING (
        workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
    );

CREATE POLICY "Workspace admins can manage members" ON workspace_members
    FOR ALL USING (
        workspace_id IN (
            SELECT workspace_id FROM workspace_members 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Forms: Based on workspace access
CREATE POLICY "Users can view forms in accessible workspaces" ON forms
    FOR SELECT USING (
        workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
        OR is_public = TRUE
    );

CREATE POLICY "Users can create forms in editable workspaces" ON forms
    FOR INSERT WITH CHECK (
        workspace_id IN (
            SELECT workspace_id FROM workspace_members 
            WHERE user_id = auth.uid() AND role IN ('admin', 'editor')
        )
    );

CREATE POLICY "Users can update forms in editable workspaces" ON forms
    FOR UPDATE USING (
        workspace_id IN (
            SELECT workspace_id FROM workspace_members 
            WHERE user_id = auth.uid() AND role IN ('admin', 'editor')
        )
    );

-- Form fields: Same as forms
CREATE POLICY "Users can view form fields" ON form_fields
    FOR SELECT USING (
        form_id IN (
            SELECT f.id FROM forms f
            JOIN workspace_members wm ON f.workspace_id = wm.workspace_id
            WHERE wm.user_id = auth.uid()
        )
        OR form_id IN (SELECT id FROM forms WHERE is_public = TRUE)
    );

CREATE POLICY "Users can manage form fields" ON form_fields
    FOR ALL USING (
        form_id IN (
            SELECT f.id FROM forms f
            JOIN workspace_members wm ON f.workspace_id = wm.workspace_id
            WHERE wm.user_id = auth.uid() AND wm.role IN ('admin', 'editor')
        )
    );

-- Form submissions: Submitters and form editors can view
CREATE POLICY "Users can view relevant submissions" ON form_submissions
    FOR SELECT USING (
        submitted_by = auth.uid()
        OR form_id IN (
            SELECT f.id FROM forms f
            JOIN workspace_members wm ON f.workspace_id = wm.workspace_id
            WHERE wm.user_id = auth.uid()
        )
    );

CREATE POLICY "Anyone can submit to public forms" ON form_submissions
    FOR INSERT WITH CHECK (
        form_id IN (SELECT id FROM forms WHERE is_public = TRUE AND status = 'published')
    );

CREATE POLICY "Users can submit to accessible forms" ON form_submissions
    FOR INSERT WITH CHECK (
        form_id IN (
            SELECT f.id FROM forms f
            JOIN workspace_members wm ON f.workspace_id = wm.workspace_id
            WHERE wm.user_id = auth.uid() AND f.status = 'published'
        )
    );

-- Active sessions: Users can only see their own and others in same workspace
CREATE POLICY "Users can view relevant active sessions" ON active_sessions
    FOR SELECT USING (
        user_id = auth.uid()
        OR workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
        OR form_id IN (
            SELECT f.id FROM forms f
            JOIN workspace_members wm ON f.workspace_id = wm.workspace_id
            WHERE wm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage their own sessions" ON active_sessions
    FOR ALL USING (user_id = auth.uid());

-- Activity logs: Users can view logs for accessible workspaces
CREATE POLICY "Users can view relevant activity logs" ON activity_logs
    FOR SELECT USING (
        workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
        OR form_id IN (
            SELECT f.id FROM forms f
            JOIN workspace_members wm ON f.workspace_id = wm.workspace_id
            WHERE wm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create activity logs" ON activity_logs
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- =====================================================
-- TRIGGERS AND FUNCTIONS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organization_members_updated_at BEFORE UPDATE ON organization_members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workspaces_updated_at BEFORE UPDATE ON workspaces
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_forms_updated_at BEFORE UPDATE ON forms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_form_fields_updated_at BEFORE UPDATE ON form_fields
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to log activities
CREATE OR REPLACE FUNCTION log_activity()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO activity_logs (workspace_id, form_id, user_id, action, entity_type, entity_id, details)
        VALUES (
            COALESCE(NEW.workspace_id, (SELECT workspace_id FROM forms WHERE id = NEW.form_id)),
            CASE WHEN TG_TABLE_NAME = 'forms' THEN NEW.id ELSE NEW.form_id END,
            auth.uid(),
            'created',
            TG_TABLE_NAME,
            NEW.id,
            row_to_json(NEW)
        );
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO activity_logs (workspace_id, form_id, user_id, action, entity_type, entity_id, details)
        VALUES (
            COALESCE(NEW.workspace_id, (SELECT workspace_id FROM forms WHERE id = NEW.form_id)),
            CASE WHEN TG_TABLE_NAME = 'forms' THEN NEW.id ELSE NEW.form_id END,
            auth.uid(),
            'updated',
            TG_TABLE_NAME,
            NEW.id,
            jsonb_build_object('old', row_to_json(OLD), 'new', row_to_json(NEW))
        );
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO activity_logs (workspace_id, form_id, user_id, action, entity_type, entity_id, details)
        VALUES (
            COALESCE(OLD.workspace_id, (SELECT workspace_id FROM forms WHERE id = OLD.form_id)),
            CASE WHEN TG_TABLE_NAME = 'forms' THEN OLD.id ELSE OLD.form_id END,
            auth.uid(),
            'deleted',
            TG_TABLE_NAME,
            OLD.id,
            row_to_json(OLD)
        );
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Apply activity logging triggers
CREATE TRIGGER forms_activity_log AFTER INSERT OR UPDATE OR DELETE ON forms
    FOR EACH ROW EXECUTE FUNCTION log_activity();

CREATE TRIGGER form_fields_activity_log AFTER INSERT OR UPDATE OR DELETE ON form_fields
    FOR EACH ROW EXECUTE FUNCTION log_activity();

CREATE TRIGGER form_submissions_activity_log AFTER INSERT OR UPDATE OR DELETE ON form_submissions
    FOR EACH ROW EXECUTE FUNCTION log_activity();

-- Function to clean up old active sessions
CREATE OR REPLACE FUNCTION cleanup_old_sessions()
RETURNS void AS $$
BEGIN
    DELETE FROM active_sessions 
    WHERE last_activity < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

-- Function to update session activity
CREATE OR REPLACE FUNCTION update_session_activity(session_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE active_sessions 
    SET last_activity = NOW()
    WHERE id = session_id AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- REAL-TIME SUBSCRIPTIONS
-- =====================================================

-- Enable real-time for collaboration tables
ALTER PUBLICATION supabase_realtime ADD TABLE active_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE activity_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE forms;
ALTER PUBLICATION supabase_realtime ADD TABLE form_fields;
ALTER PUBLICATION supabase_realtime ADD TABLE form_submissions;

-- =====================================================
-- INITIAL DATA
-- =====================================================

-- Create a default organization for development
INSERT INTO organizations (name, slug, description) 
VALUES ('Default Organization', 'default', 'Default organization for development');

-- =====================================================
-- COMMENTS AND DOCUMENTATION
-- =====================================================

COMMENT ON TABLE organizations IS 'Top-level container for multi-tenant architecture';
COMMENT ON TABLE organization_members IS 'Links users to organizations with role-based access';
COMMENT ON TABLE workspaces IS 'Project containers within organizations';
COMMENT ON TABLE workspace_members IS 'Granular workspace access control';
COMMENT ON TABLE forms IS 'Form definitions with versioning and state management';
COMMENT ON TABLE form_fields IS 'Individual form components with rich configuration';
COMMENT ON TABLE form_submissions IS 'User-submitted form data with metadata';
COMMENT ON TABLE active_sessions IS 'Real-time collaboration tracking';
COMMENT ON TABLE activity_logs IS 'Audit trail and notification system';

-- =====================================================
-- SHEETS/TABLES SYSTEM (Airtable-like functionality)
-- =====================================================

-- Data tables (user-created tables for structured data)
CREATE TABLE data_tables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    icon TEXT DEFAULT 'table',
    color TEXT DEFAULT '#10B981',
    
    -- Table configuration
    settings JSONB DEFAULT '{}', -- view settings, default views, etc.
    
    -- Import metadata
    import_source TEXT, -- 'csv', 'excel', 'google_sheets', 'manual'
    import_metadata JSONB DEFAULT '{}', -- original file info, mappings, etc.
    
    -- State
    is_archived BOOLEAN DEFAULT FALSE,
    row_count INTEGER DEFAULT 0, -- cached count for performance
    
    -- Metadata
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(workspace_id, slug)
);

-- Table columns (define the schema of each data table)
CREATE TABLE table_columns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_id UUID NOT NULL REFERENCES data_tables(id) ON DELETE CASCADE,
    
    -- Column identification
    name TEXT NOT NULL, -- internal name (snake_case)
    label TEXT NOT NULL, -- display label
    description TEXT,
    
    -- Column type and configuration
    column_type TEXT NOT NULL CHECK (column_type IN (
        'text', 'number', 'email', 'url', 'phone',
        'select', 'multiselect', 'checkbox',
        'date', 'datetime',
        'attachment', 'image',
        'user', 'formula', 'rollup', 'lookup', 'link',
        'rating', 'currency', 'percent',
        'duration', 'barcode', 'button'
    )),
    
    -- Type-specific configuration
    settings JSONB DEFAULT '{}', -- precision, currency, select options, etc.
    validation JSONB DEFAULT '{}', -- required, unique, min, max, regex, etc.
    
    -- Formula/computed columns
    formula TEXT, -- for formula columns
    formula_dependencies TEXT[], -- column IDs this formula depends on
    
    -- Lookup/rollup configuration
    linked_table_id UUID REFERENCES data_tables(id), -- for lookup/rollup
    linked_column_id UUID REFERENCES table_columns(id), -- which column to lookup
    rollup_function TEXT, -- 'sum', 'avg', 'count', 'min', 'max', etc.
    
    -- Display and ordering
    position INTEGER NOT NULL DEFAULT 0,
    width INTEGER DEFAULT 150, -- pixel width in grid view
    is_visible BOOLEAN DEFAULT TRUE,
    is_primary BOOLEAN DEFAULT FALSE, -- primary display column
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table rows (the actual data)
CREATE TABLE table_rows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_id UUID NOT NULL REFERENCES data_tables(id) ON DELETE CASCADE,
    
    -- Row data (JSONB for flexibility)
    data JSONB NOT NULL DEFAULT '{}', -- { column_id: value, ... }
    
    -- Row metadata
    metadata JSONB DEFAULT '{}', -- tags, comments, custom fields
    
    -- State
    is_archived BOOLEAN DEFAULT FALSE,
    position REAL, -- for manual ordering (fractional indexing)
    
    -- Audit fields
    created_by UUID NOT NULL REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table views (different ways to view/filter the data)
CREATE TABLE table_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_id UUID NOT NULL REFERENCES data_tables(id) ON DELETE CASCADE,
    
    -- View identification
    name TEXT NOT NULL,
    description TEXT,
    
    -- View type
    view_type TEXT NOT NULL DEFAULT 'grid' CHECK (view_type IN (
        'grid', 'kanban', 'calendar', 'gallery', 'timeline', 'form'
    )),
    
    -- View configuration
    settings JSONB DEFAULT '{}', -- column visibility, widths, colors, grouping, etc.
    filters JSONB DEFAULT '[]', -- filter conditions
    sorts JSONB DEFAULT '[]', -- sort rules
    grouping JSONB DEFAULT '{}', -- grouping configuration
    
    -- View state
    is_shared BOOLEAN DEFAULT FALSE,
    is_locked BOOLEAN DEFAULT FALSE, -- prevent modifications
    
    -- Metadata
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table links (relationships between tables)
CREATE TABLE table_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Source table and column
    source_table_id UUID NOT NULL REFERENCES data_tables(id) ON DELETE CASCADE,
    source_column_id UUID NOT NULL REFERENCES table_columns(id) ON DELETE CASCADE,
    
    -- Target table and column
    target_table_id UUID NOT NULL REFERENCES data_tables(id) ON DELETE CASCADE,
    target_column_id UUID REFERENCES table_columns(id), -- optional: specific column
    
    -- Link type
    link_type TEXT NOT NULL DEFAULT 'one_to_many' CHECK (link_type IN (
        'one_to_one', 'one_to_many', 'many_to_many'
    )),
    
    -- Link configuration
    settings JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table row links (actual relationship data)
CREATE TABLE table_row_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    link_id UUID NOT NULL REFERENCES table_links(id) ON DELETE CASCADE,
    
    source_row_id UUID NOT NULL REFERENCES table_rows(id) ON DELETE CASCADE,
    target_row_id UUID NOT NULL REFERENCES table_rows(id) ON DELETE CASCADE,
    
    -- Link metadata
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(link_id, source_row_id, target_row_id)
);

-- Form-to-table connections (link forms to data tables)
CREATE TABLE form_table_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    table_id UUID NOT NULL REFERENCES data_tables(id) ON DELETE CASCADE,
    
    -- Connection type
    connection_type TEXT NOT NULL CHECK (connection_type IN (
        'write', -- form submissions create table rows
        'read', -- form fields pull from table
        'update' -- form submissions update existing rows
    )),
    
    -- Field mapping (form_field_id -> table_column_id)
    field_mappings JSONB NOT NULL DEFAULT '{}',
    
    -- Filters and conditions
    filters JSONB DEFAULT '[]', -- for read/update operations
    
    -- Settings
    settings JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table attachments (file uploads in table cells)
CREATE TABLE table_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_id UUID NOT NULL REFERENCES data_tables(id) ON DELETE CASCADE,
    row_id UUID NOT NULL REFERENCES table_rows(id) ON DELETE CASCADE,
    column_id UUID NOT NULL REFERENCES table_columns(id) ON DELETE CASCADE,
    
    -- File information
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size BIGINT NOT NULL, -- bytes
    file_url TEXT NOT NULL, -- storage URL
    thumbnail_url TEXT, -- for images
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    uploaded_by UUID NOT NULL REFERENCES auth.users(id),
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table comments (threaded comments on rows)
CREATE TABLE table_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_id UUID NOT NULL REFERENCES data_tables(id) ON DELETE CASCADE,
    row_id UUID NOT NULL REFERENCES table_rows(id) ON DELETE CASCADE,
    
    -- Comment content
    content TEXT NOT NULL,
    
    -- Threading
    parent_comment_id UUID REFERENCES table_comments(id) ON DELETE CASCADE,
    
    -- Metadata
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR SHEETS/TABLES
-- =====================================================

-- Data tables
CREATE INDEX idx_data_tables_workspace ON data_tables(workspace_id);
CREATE INDEX idx_data_tables_workspace_slug ON data_tables(workspace_id, slug);
CREATE INDEX idx_data_tables_is_archived ON data_tables(is_archived);

-- Table columns
CREATE INDEX idx_table_columns_table ON table_columns(table_id);
CREATE INDEX idx_table_columns_position ON table_columns(table_id, position);
CREATE INDEX idx_table_columns_is_primary ON table_columns(table_id, is_primary);

-- Table rows
CREATE INDEX idx_table_rows_table ON table_rows(table_id);
CREATE INDEX idx_table_rows_created_at ON table_rows(created_at);
CREATE INDEX idx_table_rows_is_archived ON table_rows(is_archived);
CREATE INDEX idx_table_rows_data_gin ON table_rows USING gin(data); -- for JSONB queries

-- Table views
CREATE INDEX idx_table_views_table ON table_views(table_id);
CREATE INDEX idx_table_views_created_by ON table_views(created_by);

-- Table links
CREATE INDEX idx_table_links_source ON table_links(source_table_id);
CREATE INDEX idx_table_links_target ON table_links(target_table_id);

-- Table row links
CREATE INDEX idx_table_row_links_link ON table_row_links(link_id);
CREATE INDEX idx_table_row_links_source ON table_row_links(source_row_id);
CREATE INDEX idx_table_row_links_target ON table_row_links(target_row_id);

-- Form table connections
CREATE INDEX idx_form_table_connections_form ON form_table_connections(form_id);
CREATE INDEX idx_form_table_connections_table ON form_table_connections(table_id);

-- Table attachments
CREATE INDEX idx_table_attachments_table ON table_attachments(table_id);
CREATE INDEX idx_table_attachments_row ON table_attachments(row_id);

-- Table comments
CREATE INDEX idx_table_comments_table ON table_comments(table_id);
CREATE INDEX idx_table_comments_row ON table_comments(row_id);
CREATE INDEX idx_table_comments_parent ON table_comments(parent_comment_id);

-- =====================================================
-- RLS POLICIES FOR SHEETS/TABLES
-- =====================================================

-- Enable RLS
ALTER TABLE data_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE table_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE table_rows ENABLE ROW LEVEL SECURITY;
ALTER TABLE table_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE table_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE table_row_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_table_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE table_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE table_comments ENABLE ROW LEVEL SECURITY;

-- Data tables: Based on workspace access
CREATE POLICY "Users can view tables in accessible workspaces" ON data_tables
    FOR SELECT USING (
        workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can create tables in editable workspaces" ON data_tables
    FOR INSERT WITH CHECK (
        workspace_id IN (
            SELECT workspace_id FROM workspace_members 
            WHERE user_id = auth.uid() AND role IN ('admin', 'editor')
        )
    );

CREATE POLICY "Users can update tables in editable workspaces" ON data_tables
    FOR UPDATE USING (
        workspace_id IN (
            SELECT workspace_id FROM workspace_members 
            WHERE user_id = auth.uid() AND role IN ('admin', 'editor')
        )
    );

-- Table columns: Same as parent table
CREATE POLICY "Users can view columns in accessible tables" ON table_columns
    FOR SELECT USING (
        table_id IN (
            SELECT dt.id FROM data_tables dt
            JOIN workspace_members wm ON dt.workspace_id = wm.workspace_id
            WHERE wm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage columns in editable tables" ON table_columns
    FOR ALL USING (
        table_id IN (
            SELECT dt.id FROM data_tables dt
            JOIN workspace_members wm ON dt.workspace_id = wm.workspace_id
            WHERE wm.user_id = auth.uid() AND wm.role IN ('admin', 'editor')
        )
    );

-- Table rows: Same as parent table
CREATE POLICY "Users can view rows in accessible tables" ON table_rows
    FOR SELECT USING (
        table_id IN (
            SELECT dt.id FROM data_tables dt
            JOIN workspace_members wm ON dt.workspace_id = wm.workspace_id
            WHERE wm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage rows in editable tables" ON table_rows
    FOR ALL USING (
        table_id IN (
            SELECT dt.id FROM data_tables dt
            JOIN workspace_members wm ON dt.workspace_id = wm.workspace_id
            WHERE wm.user_id = auth.uid() AND wm.role IN ('admin', 'editor')
        )
    );

-- Table views: Users can manage their own views, view others
CREATE POLICY "Users can view all views in accessible tables" ON table_views
    FOR SELECT USING (
        table_id IN (
            SELECT dt.id FROM data_tables dt
            JOIN workspace_members wm ON dt.workspace_id = wm.workspace_id
            WHERE wm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage their own views" ON table_views
    FOR ALL USING (
        created_by = auth.uid()
        OR table_id IN (
            SELECT dt.id FROM data_tables dt
            JOIN workspace_members wm ON dt.workspace_id = wm.workspace_id
            WHERE wm.user_id = auth.uid() AND wm.role = 'admin'
        )
    );

-- Table links: Same as source table
CREATE POLICY "Users can view links in accessible tables" ON table_links
    FOR SELECT USING (
        source_table_id IN (
            SELECT dt.id FROM data_tables dt
            JOIN workspace_members wm ON dt.workspace_id = wm.workspace_id
            WHERE wm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage links in editable tables" ON table_links
    FOR ALL USING (
        source_table_id IN (
            SELECT dt.id FROM data_tables dt
            JOIN workspace_members wm ON dt.workspace_id = wm.workspace_id
            WHERE wm.user_id = auth.uid() AND wm.role IN ('admin', 'editor')
        )
    );

-- Table row links: Inherit from link policy
CREATE POLICY "Users can view row links in accessible tables" ON table_row_links
    FOR SELECT USING (
        link_id IN (
            SELECT tl.id FROM table_links tl
            JOIN data_tables dt ON tl.source_table_id = dt.id
            JOIN workspace_members wm ON dt.workspace_id = wm.workspace_id
            WHERE wm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage row links in editable tables" ON table_row_links
    FOR ALL USING (
        link_id IN (
            SELECT tl.id FROM table_links tl
            JOIN data_tables dt ON tl.source_table_id = dt.id
            JOIN workspace_members wm ON dt.workspace_id = wm.workspace_id
            WHERE wm.user_id = auth.uid() AND wm.role IN ('admin', 'editor')
        )
    );

-- Form table connections: Based on form access
CREATE POLICY "Users can view form-table connections" ON form_table_connections
    FOR SELECT USING (
        form_id IN (
            SELECT f.id FROM forms f
            JOIN workspace_members wm ON f.workspace_id = wm.workspace_id
            WHERE wm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage form-table connections" ON form_table_connections
    FOR ALL USING (
        form_id IN (
            SELECT f.id FROM forms f
            JOIN workspace_members wm ON f.workspace_id = wm.workspace_id
            WHERE wm.user_id = auth.uid() AND wm.role IN ('admin', 'editor')
        )
    );

-- Table attachments: Same as parent row
CREATE POLICY "Users can view attachments in accessible tables" ON table_attachments
    FOR SELECT USING (
        table_id IN (
            SELECT dt.id FROM data_tables dt
            JOIN workspace_members wm ON dt.workspace_id = wm.workspace_id
            WHERE wm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage attachments in editable tables" ON table_attachments
    FOR ALL USING (
        table_id IN (
            SELECT dt.id FROM data_tables dt
            JOIN workspace_members wm ON dt.workspace_id = wm.workspace_id
            WHERE wm.user_id = auth.uid() AND wm.role IN ('admin', 'editor')
        )
    );

-- Table comments: Users can view all, manage their own
CREATE POLICY "Users can view comments in accessible tables" ON table_comments
    FOR SELECT USING (
        table_id IN (
            SELECT dt.id FROM data_tables dt
            JOIN workspace_members wm ON dt.workspace_id = wm.workspace_id
            WHERE wm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create comments in accessible tables" ON table_comments
    FOR INSERT WITH CHECK (
        table_id IN (
            SELECT dt.id FROM data_tables dt
            JOIN workspace_members wm ON dt.workspace_id = wm.workspace_id
            WHERE wm.user_id = auth.uid()
        )
        AND created_by = auth.uid()
    );

CREATE POLICY "Users can update their own comments" ON table_comments
    FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own comments" ON table_comments
    FOR DELETE USING (created_by = auth.uid());

-- =====================================================
-- BARCODE SCAN HISTORY
-- =====================================================

CREATE TABLE scan_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    table_id UUID NOT NULL REFERENCES data_tables(id) ON DELETE CASCADE,
    column_id UUID REFERENCES table_columns(id) ON DELETE SET NULL,
    column_name TEXT,
    barcode TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'failure')),
    matched_row_ids UUID[] DEFAULT ARRAY[]::UUID[],
    matched_rows JSONB NOT NULL DEFAULT '[]'::JSONB,
    source TEXT NOT NULL DEFAULT 'mobile',
    metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_scan_history_table ON scan_history (table_id, created_at DESC);
CREATE INDEX idx_scan_history_workspace ON scan_history (workspace_id, created_at DESC);
CREATE INDEX idx_scan_history_barcode ON scan_history (barcode);

-- =====================================================
-- TRIGGERS FOR SHEETS/TABLES
-- =====================================================

-- Update updated_at triggers
CREATE TRIGGER update_data_tables_updated_at BEFORE UPDATE ON data_tables
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_table_columns_updated_at BEFORE UPDATE ON table_columns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_table_rows_updated_at BEFORE UPDATE ON table_rows
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_table_views_updated_at BEFORE UPDATE ON table_views
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_table_comments_updated_at BEFORE UPDATE ON table_comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Activity logging for tables
CREATE TRIGGER data_tables_activity_log AFTER INSERT OR UPDATE OR DELETE ON data_tables
    FOR EACH ROW EXECUTE FUNCTION log_activity();

CREATE TRIGGER table_rows_activity_log AFTER INSERT OR UPDATE OR DELETE ON table_rows
    FOR EACH ROW EXECUTE FUNCTION log_activity();

-- Update row count cache
CREATE OR REPLACE FUNCTION update_table_row_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE data_tables 
        SET row_count = row_count + 1 
        WHERE id = NEW.table_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE data_tables 
        SET row_count = row_count - 1 
        WHERE id = OLD.table_id;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER table_rows_count_trigger AFTER INSERT OR DELETE ON table_rows
    FOR EACH ROW EXECUTE FUNCTION update_table_row_count();

-- =====================================================
-- REAL-TIME SUBSCRIPTIONS FOR TABLES
-- =====================================================

ALTER PUBLICATION supabase_realtime ADD TABLE data_tables;
ALTER PUBLICATION supabase_realtime ADD TABLE table_columns;
ALTER PUBLICATION supabase_realtime ADD TABLE table_rows;
ALTER PUBLICATION supabase_realtime ADD TABLE table_views;
ALTER PUBLICATION supabase_realtime ADD TABLE table_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE scan_history;

-- =====================================================
-- COMMENTS FOR SHEETS/TABLES
-- =====================================================

COMMENT ON TABLE data_tables IS 'User-created data tables (Airtable-like sheets)';
COMMENT ON TABLE table_columns IS 'Column definitions for data tables with type and validation';
COMMENT ON TABLE table_rows IS 'Actual data rows stored as JSONB for flexibility';
COMMENT ON TABLE table_views IS 'Different views of data (grid, kanban, calendar, etc.)';
COMMENT ON TABLE table_links IS 'Relationships between tables (foreign keys)';
COMMENT ON TABLE table_row_links IS 'Actual row-to-row relationship data';
COMMENT ON TABLE form_table_connections IS 'Links forms to tables for data flow';
COMMENT ON TABLE table_attachments IS 'File uploads in table cells';
COMMENT ON TABLE table_comments IS 'Threaded comments on table rows';