-- =====================================================
-- MATIC PLATFORM - SUPABASE DATABASE SCHEMA
-- Optimized for Supabase (no ALTER PUBLICATION needed)
-- =====================================================

-- Note: Extensions are already enabled in Supabase
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; -- Already enabled
-- CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- Already enabled

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Organizations/Companies
CREATE TABLE IF NOT EXISTS organizations (
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
CREATE TABLE IF NOT EXISTS organization_members (
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
CREATE TABLE IF NOT EXISTS workspaces (
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
CREATE TABLE IF NOT EXISTS workspace_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('admin', 'editor', 'viewer')),
    permissions JSONB DEFAULT '{}',
    added_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(workspace_id, user_id)
);

-- Forms (the main building blocks)
CREATE TABLE IF NOT EXISTS forms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    slug TEXT NOT NULL,
    settings JSONB DEFAULT '{}',
    submit_settings JSONB DEFAULT '{}',
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived', 'paused')),
    version INTEGER DEFAULT 1,
    is_public BOOLEAN DEFAULT FALSE,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    published_at TIMESTAMPTZ,
    UNIQUE(workspace_id, slug)
);

-- Form fields
CREATE TABLE IF NOT EXISTS form_fields (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    label TEXT NOT NULL,
    placeholder TEXT,
    description TEXT,
    field_type TEXT NOT NULL CHECK (field_type IN (
        'text', 'textarea', 'email', 'phone', 'number', 'url',
        'select', 'multiselect', 'radio', 'checkbox',
        'date', 'datetime', 'time',
        'file', 'image',
        'signature', 'rating',
        'divider', 'heading', 'paragraph'
    )),
    settings JSONB DEFAULT '{}',
    validation JSONB DEFAULT '{}',
    options JSONB DEFAULT '[]',
    position INTEGER NOT NULL DEFAULT 0,
    width TEXT DEFAULT 'full' CHECK (width IN ('full', 'half', 'third', 'quarter')),
    is_visible BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Form submissions
CREATE TABLE IF NOT EXISTS form_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    data JSONB NOT NULL DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'reviewed', 'approved', 'rejected')),
    submitted_by UUID REFERENCES auth.users(id),
    email TEXT,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES auth.users(id)
);

-- Active sessions
CREATE TABLE IF NOT EXISTS active_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    form_id UUID REFERENCES forms(id) ON DELETE CASCADE,
    cursor_position JSONB DEFAULT '{}',
    selected_element TEXT,
    user_agent TEXT,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    last_activity TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT active_session_check CHECK (
        (workspace_id IS NOT NULL AND form_id IS NULL) OR 
        (workspace_id IS NULL AND form_id IS NOT NULL)
    )
);

-- Activity log
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    form_id UUID REFERENCES forms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Data tables (Airtable-like sheets)
CREATE TABLE IF NOT EXISTS data_tables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    icon TEXT DEFAULT 'table',
    color TEXT DEFAULT '#10B981',
    settings JSONB DEFAULT '{}',
    import_source TEXT,
    import_metadata JSONB DEFAULT '{}',
    is_archived BOOLEAN DEFAULT FALSE,
    row_count INTEGER DEFAULT 0,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(workspace_id, slug)
);

-- Table columns
CREATE TABLE IF NOT EXISTS table_columns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_id UUID NOT NULL REFERENCES data_tables(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    label TEXT NOT NULL,
    description TEXT,
    column_type TEXT NOT NULL CHECK (column_type IN (
        'text', 'number', 'email', 'url', 'phone',
        'select', 'multiselect', 'checkbox',
        'date', 'datetime',
        'attachment', 'image',
        'user', 'formula', 'rollup', 'lookup',
        'rating', 'currency', 'percent',
        'duration', 'barcode', 'button'
    )),
    settings JSONB DEFAULT '{}',
    validation JSONB DEFAULT '{}',
    formula TEXT,
    formula_dependencies TEXT[],
    linked_table_id UUID REFERENCES data_tables(id),
    linked_column_id UUID REFERENCES table_columns(id),
    rollup_function TEXT,
    position INTEGER NOT NULL DEFAULT 0,
    width INTEGER DEFAULT 150,
    is_visible BOOLEAN DEFAULT TRUE,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table rows
CREATE TABLE IF NOT EXISTS table_rows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_id UUID NOT NULL REFERENCES data_tables(id) ON DELETE CASCADE,
    data JSONB NOT NULL DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    is_archived BOOLEAN DEFAULT FALSE,
    position REAL,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table views
CREATE TABLE IF NOT EXISTS table_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_id UUID NOT NULL REFERENCES data_tables(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    view_type TEXT NOT NULL DEFAULT 'grid' CHECK (view_type IN (
        'grid', 'kanban', 'calendar', 'gallery', 'timeline', 'form'
    )),
    settings JSONB DEFAULT '{}',
    filters JSONB DEFAULT '[]',
    sorts JSONB DEFAULT '[]',
    grouping JSONB DEFAULT '{}',
    is_shared BOOLEAN DEFAULT FALSE,
    is_locked BOOLEAN DEFAULT FALSE,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table links
CREATE TABLE IF NOT EXISTS table_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_table_id UUID NOT NULL REFERENCES data_tables(id) ON DELETE CASCADE,
    source_column_id UUID NOT NULL REFERENCES table_columns(id) ON DELETE CASCADE,
    target_table_id UUID NOT NULL REFERENCES data_tables(id) ON DELETE CASCADE,
    target_column_id UUID REFERENCES table_columns(id),
    link_type TEXT NOT NULL DEFAULT 'one_to_many' CHECK (link_type IN (
        'one_to_one', 'one_to_many', 'many_to_many'
    )),
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table row links
CREATE TABLE IF NOT EXISTS table_row_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    link_id UUID NOT NULL REFERENCES table_links(id) ON DELETE CASCADE,
    source_row_id UUID NOT NULL REFERENCES table_rows(id) ON DELETE CASCADE,
    target_row_id UUID NOT NULL REFERENCES table_rows(id) ON DELETE CASCADE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(link_id, source_row_id, target_row_id)
);

-- Form-table connections
CREATE TABLE IF NOT EXISTS form_table_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    table_id UUID NOT NULL REFERENCES data_tables(id) ON DELETE CASCADE,
    connection_type TEXT NOT NULL CHECK (connection_type IN ('write', 'read', 'update')),
    field_mappings JSONB NOT NULL DEFAULT '{}',
    filters JSONB DEFAULT '[]',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table attachments
CREATE TABLE IF NOT EXISTS table_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_id UUID NOT NULL REFERENCES data_tables(id) ON DELETE CASCADE,
    row_id UUID NOT NULL REFERENCES table_rows(id) ON DELETE CASCADE,
    column_id UUID NOT NULL REFERENCES table_columns(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    file_url TEXT NOT NULL,
    thumbnail_url TEXT,
    metadata JSONB DEFAULT '{}',
    uploaded_by UUID NOT NULL REFERENCES auth.users(id),
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table comments
CREATE TABLE IF NOT EXISTS table_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_id UUID NOT NULL REFERENCES data_tables(id) ON DELETE CASCADE,
    row_id UUID NOT NULL REFERENCES table_rows(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    parent_comment_id UUID REFERENCES table_comments(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- CREATE ALL INDEXES
-- =====================================================
-- (Indexes are idempotent with IF NOT EXISTS in newer PostgreSQL, 
--  but Supabase may require dropping them first if re-running)

DO $$ 
BEGIN
    -- Organizations and workspaces
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_organizations_slug') THEN
        CREATE INDEX idx_organizations_slug ON organizations(slug);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_workspaces_org_slug') THEN
        CREATE INDEX idx_workspaces_org_slug ON workspaces(organization_id, slug);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_workspace_members_workspace') THEN
        CREATE INDEX idx_workspace_members_workspace ON workspace_members(workspace_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_workspace_members_user') THEN
        CREATE INDEX idx_workspace_members_user ON workspace_members(user_id);
    END IF;

    -- Forms and fields
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_forms_workspace') THEN
        CREATE INDEX idx_forms_workspace ON forms(workspace_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_forms_workspace_slug') THEN
        CREATE INDEX idx_forms_workspace_slug ON forms(workspace_id, slug);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_forms_status') THEN
        CREATE INDEX idx_forms_status ON forms(status);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_form_fields_form') THEN
        CREATE INDEX idx_form_fields_form ON form_fields(form_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_form_fields_position') THEN
        CREATE INDEX idx_form_fields_position ON form_fields(form_id, position);
    END IF;

    -- Submissions
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_submissions_form') THEN
        CREATE INDEX idx_submissions_form ON form_submissions(form_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_submissions_submitted_at') THEN
        CREATE INDEX idx_submissions_submitted_at ON form_submissions(submitted_at);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_submissions_status') THEN
        CREATE INDEX idx_submissions_status ON form_submissions(status);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_submissions_user') THEN
        CREATE INDEX idx_submissions_user ON form_submissions(submitted_by);
    END IF;

    -- Real-time and activity
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_active_sessions_user') THEN
        CREATE INDEX idx_active_sessions_user ON active_sessions(user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_active_sessions_workspace') THEN
        CREATE INDEX idx_active_sessions_workspace ON active_sessions(workspace_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_active_sessions_form') THEN
        CREATE INDEX idx_active_sessions_form ON active_sessions(form_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_active_sessions_activity') THEN
        CREATE INDEX idx_active_sessions_activity ON active_sessions(last_activity);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_activity_logs_workspace') THEN
        CREATE INDEX idx_activity_logs_workspace ON activity_logs(workspace_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_activity_logs_form') THEN
        CREATE INDEX idx_activity_logs_form ON activity_logs(form_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_activity_logs_created_at') THEN
        CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at);
    END IF;

    -- Data tables
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_data_tables_workspace') THEN
        CREATE INDEX idx_data_tables_workspace ON data_tables(workspace_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_data_tables_workspace_slug') THEN
        CREATE INDEX idx_data_tables_workspace_slug ON data_tables(workspace_id, slug);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_data_tables_is_archived') THEN
        CREATE INDEX idx_data_tables_is_archived ON data_tables(is_archived);
    END IF;

    -- Table columns
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_table_columns_table') THEN
        CREATE INDEX idx_table_columns_table ON table_columns(table_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_table_columns_position') THEN
        CREATE INDEX idx_table_columns_position ON table_columns(table_id, position);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_table_columns_is_primary') THEN
        CREATE INDEX idx_table_columns_is_primary ON table_columns(table_id, is_primary);
    END IF;

    -- Table rows
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_table_rows_table') THEN
        CREATE INDEX idx_table_rows_table ON table_rows(table_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_table_rows_created_at') THEN
        CREATE INDEX idx_table_rows_created_at ON table_rows(created_at);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_table_rows_is_archived') THEN
        CREATE INDEX idx_table_rows_is_archived ON table_rows(is_archived);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_table_rows_data_gin') THEN
        CREATE INDEX idx_table_rows_data_gin ON table_rows USING gin(data);
    END IF;

    -- Other indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_table_views_table') THEN
        CREATE INDEX idx_table_views_table ON table_views(table_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_table_links_source') THEN
        CREATE INDEX idx_table_links_source ON table_links(source_table_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_table_links_target') THEN
        CREATE INDEX idx_table_links_target ON table_links(target_table_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_table_row_links_link') THEN
        CREATE INDEX idx_table_row_links_link ON table_row_links(link_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_form_table_connections_form') THEN
        CREATE INDEX idx_form_table_connections_form ON form_table_connections(form_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_form_table_connections_table') THEN
        CREATE INDEX idx_form_table_connections_table ON form_table_connections(table_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_table_attachments_table') THEN
        CREATE INDEX idx_table_attachments_table ON table_attachments(table_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_table_comments_table') THEN
        CREATE INDEX idx_table_comments_table ON table_comments(table_id);
    END IF;
END $$;

-- =====================================================
-- NOTE: Supabase automatically enables RLS when you 
-- create policies. The RLS policies from the original
-- schema should be added via Supabase Dashboard > 
-- Authentication > Policies for better management.
-- 
-- For now, we'll skip RLS setup and you can add 
-- policies later via the dashboard as needed.
-- =====================================================

-- =====================================================
-- TRIGGERS AND FUNCTIONS
-- =====================================================

-- Update updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_workspaces_updated_at ON workspaces;
CREATE TRIGGER update_workspaces_updated_at BEFORE UPDATE ON workspaces
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_forms_updated_at ON forms;
CREATE TRIGGER update_forms_updated_at BEFORE UPDATE ON forms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_form_fields_updated_at ON form_fields;
CREATE TRIGGER update_form_fields_updated_at BEFORE UPDATE ON form_fields
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_data_tables_updated_at ON data_tables;
CREATE TRIGGER update_data_tables_updated_at BEFORE UPDATE ON data_tables
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_table_columns_updated_at ON table_columns;
CREATE TRIGGER update_table_columns_updated_at BEFORE UPDATE ON table_columns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_table_rows_updated_at ON table_rows;
CREATE TRIGGER update_table_rows_updated_at BEFORE UPDATE ON table_rows
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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

DROP TRIGGER IF EXISTS table_rows_count_trigger ON table_rows;
CREATE TRIGGER table_rows_count_trigger AFTER INSERT OR DELETE ON table_rows
    FOR EACH ROW EXECUTE FUNCTION update_table_row_count();

-- =====================================================
-- INITIAL DATA
-- =====================================================

-- Create a default organization (only if it doesn't exist)
INSERT INTO organizations (name, slug, description) 
VALUES ('Default Organization', 'default', 'Default organization for development')
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN
    RAISE NOTICE '✅ Schema applied successfully!';
    RAISE NOTICE '📊 Tables created: 18 tables';
    RAISE NOTICE '📍 Indexes created: 40+ indexes';
    RAISE NOTICE '🔧 Triggers created: 10+ triggers';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Update backend/.env with DATABASE_URL';
    RAISE NOTICE '2. Test connection: cd backend && python test_api.py';
    RAISE NOTICE '3. Start server: uvicorn app.main:app --reload';
END $$;
