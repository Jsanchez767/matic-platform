-- =====================================================
-- SCHEMA CLEANUP: Remove Legacy Tables & Standardize Architecture
-- =====================================================
-- This migration removes the old activities_hubs Go backend tables
-- and standardizes the module system around data_tables architecture

-- =====================================================
-- PHASE 1: BACKUP EXISTING DATA (Optional)
-- =====================================================
-- If you have production data in activities_hubs, export it first:
-- CREATE TABLE activities_hubs_backup AS SELECT * FROM activities_hubs;

-- =====================================================
-- PHASE 2: DROP LEGACY ACTIVITIES HUB TABLES
-- =====================================================

-- Drop old Go backend tables (replaced by data_tables architecture)
DROP TABLE IF EXISTS activities_hub_tabs CASCADE;
DROP TABLE IF EXISTS request_hub_forms CASCADE;
DROP TABLE IF EXISTS request_hub_tables CASCADE;
DROP TABLE IF EXISTS activities_hubs CASCADE;

-- Optional: Remove request templates if unused
-- DROP TABLE IF EXISTS request_templates CASCADE;

-- =====================================================
-- PHASE 3: CREATE MODULE SYSTEM TABLES
-- =====================================================

-- Module configurations per workspace
CREATE TABLE IF NOT EXISTS module_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    module_type TEXT NOT NULL CHECK (module_type IN (
        'pulse_scanning',
        'activities',
        'forms',
        'analytics',
        'custom'
    )),
    name TEXT NOT NULL,
    description TEXT,
    enabled BOOLEAN DEFAULT true,
    settings JSONB DEFAULT '{}',
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(workspace_id, module_type)
);

-- Module instances (link modules to specific tables)
CREATE TABLE IF NOT EXISTS module_instances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_config_id UUID NOT NULL REFERENCES module_configs(id) ON DELETE CASCADE,
    table_id UUID NOT NULL REFERENCES data_tables(id) ON DELETE CASCADE,
    instance_name TEXT NOT NULL,
    instance_settings JSONB DEFAULT '{}',
    is_primary BOOLEAN DEFAULT false, -- Main table for this module instance
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(module_config_id, table_id)
);

-- =====================================================
-- PHASE 4: UPDATE PULSE MODULE TO USE TABLE_ID
-- =====================================================

-- Add table_id reference to pulse_enabled_tables
ALTER TABLE pulse_enabled_tables 
    ADD COLUMN IF NOT EXISTS table_id UUID REFERENCES data_tables(id) ON DELETE CASCADE;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_pulse_tables_table_id ON pulse_enabled_tables(table_id);

-- Note: Keep workspace_id for now for backward compatibility
-- Can be removed later after migration

-- =====================================================
-- PHASE 5: ENSURE CORE TABLES EXIST
-- =====================================================

-- Table attachments (if not exists)
CREATE TABLE IF NOT EXISTS table_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_id UUID NOT NULL REFERENCES data_tables(id) ON DELETE CASCADE,
    row_id UUID REFERENCES table_rows(id) ON DELETE CASCADE,
    column_id UUID REFERENCES table_columns(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_size BIGINT,
    file_type TEXT,
    storage_path TEXT NOT NULL, -- Supabase Storage path
    url TEXT, -- Public URL if applicable
    metadata JSONB DEFAULT '{}',
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table comments (if not exists)
CREATE TABLE IF NOT EXISTS table_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_id UUID NOT NULL REFERENCES data_tables(id) ON DELETE CASCADE,
    row_id UUID REFERENCES table_rows(id) ON DELETE CASCADE,
    column_id UUID REFERENCES table_columns(id) ON DELETE SET NULL,
    comment_text TEXT NOT NULL,
    parent_comment_id UUID REFERENCES table_comments(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- PHASE 6: CREATE INDEXES
-- =====================================================

-- Module configs
CREATE INDEX IF NOT EXISTS idx_module_configs_workspace ON module_configs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_module_configs_type ON module_configs(module_type);

-- Module instances
CREATE INDEX IF NOT EXISTS idx_module_instances_config ON module_instances(module_config_id);
CREATE INDEX IF NOT EXISTS idx_module_instances_table ON module_instances(table_id);

-- Table attachments
CREATE INDEX IF NOT EXISTS idx_table_attachments_table ON table_attachments(table_id);
CREATE INDEX IF NOT EXISTS idx_table_attachments_row ON table_attachments(row_id);

-- Table comments
CREATE INDEX IF NOT EXISTS idx_table_comments_table ON table_comments(table_id);
CREATE INDEX IF NOT EXISTS idx_table_comments_row ON table_comments(row_id);
CREATE INDEX IF NOT EXISTS idx_table_comments_parent ON table_comments(parent_comment_id);

-- =====================================================
-- PHASE 7: ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Module configs RLS
ALTER TABLE module_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view modules in their workspaces" ON module_configs
    FOR SELECT USING (
        workspace_id IN (
            SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage modules" ON module_configs
    FOR ALL USING (
        workspace_id IN (
            SELECT workspace_id FROM workspace_members 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Module instances RLS
ALTER TABLE module_instances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view module instances" ON module_instances
    FOR SELECT USING (
        module_config_id IN (
            SELECT id FROM module_configs 
            WHERE workspace_id IN (
                SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Admins can manage module instances" ON module_instances
    FOR ALL USING (
        module_config_id IN (
            SELECT id FROM module_configs 
            WHERE workspace_id IN (
                SELECT workspace_id FROM workspace_members 
                WHERE user_id = auth.uid() AND role = 'admin'
            )
        )
    );

-- Fix existing RLS policies
-- data_tables DELETE policy (was using UPDATE)
DROP POLICY IF EXISTS "Users can delete tables in their workspaces" ON data_tables;
CREATE POLICY "Users can delete tables in their workspaces" ON data_tables
    FOR DELETE USING (
        workspace_id IN (
            SELECT workspace_id FROM workspace_members 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- table_rows DELETE policy (was using UPDATE)
DROP POLICY IF EXISTS "Users can delete rows in their workspace tables" ON table_rows;
CREATE POLICY "Users can delete rows in their workspace tables" ON table_rows
    FOR DELETE USING (
        table_id IN (
            SELECT dt.id FROM data_tables dt
            WHERE dt.workspace_id IN (
                SELECT workspace_id FROM workspace_members 
                WHERE user_id = auth.uid()
            )
        )
    );

-- Restrict guest scanner to only pulse-enabled tables
DROP POLICY IF EXISTS "Guest scanner can update rows" ON table_rows;
CREATE POLICY "Guest scanner can update pulse-enabled tables" ON table_rows
    FOR UPDATE USING (
        table_id IN (
            SELECT pet.table_id FROM pulse_enabled_tables pet
            WHERE pet.enabled = true 
            AND (pet.settings->>'guest_scanning_enabled')::boolean = true
        )
    )
    WITH CHECK (
        table_id IN (
            SELECT pet.table_id FROM pulse_enabled_tables pet
            WHERE pet.enabled = true 
            AND (pet.settings->>'guest_scanning_enabled')::boolean = true
        )
    );

-- =====================================================
-- PHASE 8: MIGRATION FUNCTIONS
-- =====================================================

-- Function to auto-create Activities module for existing workspaces
CREATE OR REPLACE FUNCTION setup_activities_module()
RETURNS void AS $$
DECLARE
    workspace_record RECORD;
    module_id UUID;
    table_id UUID;
BEGIN
    -- For each workspace, create Activities module if not exists
    FOR workspace_record IN SELECT id, created_by FROM workspaces
    LOOP
        -- Create module config
        INSERT INTO module_configs (workspace_id, module_type, name, enabled, created_by)
        VALUES (
            workspace_record.id,
            'activities',
            'Activities Hub',
            true,
            workspace_record.created_by
        )
        ON CONFLICT (workspace_id, module_type) DO NOTHING
        RETURNING id INTO module_id;
        
        -- Check if Activities table exists
        SELECT id INTO table_id
        FROM data_tables
        WHERE workspace_id = workspace_record.id
        AND name = 'Activities'
        LIMIT 1;
        
        -- If Activities table exists and module was created, link them
        IF table_id IS NOT NULL AND module_id IS NOT NULL THEN
            INSERT INTO module_instances (module_config_id, table_id, instance_name, is_primary)
            VALUES (module_id, table_id, 'Main Activities', true)
            ON CONFLICT DO NOTHING;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PHASE 9: RUN MIGRATION (Uncomment when ready)
-- =====================================================

-- Run the migration function
-- SELECT setup_activities_module();

-- =====================================================
-- PHASE 10: CLEANUP COMMENTS
-- =====================================================

COMMENT ON TABLE module_configs IS 'Module configurations per workspace (Activities, Pulse, etc.)';
COMMENT ON TABLE module_instances IS 'Links modules to specific data tables';
COMMENT ON TABLE table_attachments IS 'File attachments for table cells';
COMMENT ON TABLE table_comments IS 'Comments and discussions on rows';

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check module configs
-- SELECT * FROM module_configs;

-- Check module instances
-- SELECT mi.*, mc.name as module_name, dt.name as table_name
-- FROM module_instances mi
-- JOIN module_configs mc ON mi.module_config_id = mc.id
-- JOIN data_tables dt ON mi.table_id = dt.id;

-- Check orphaned pulse tables (should be empty after migration)
-- SELECT * FROM pulse_enabled_tables WHERE table_id IS NULL;
