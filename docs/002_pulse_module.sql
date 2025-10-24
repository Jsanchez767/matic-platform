-- ============================================================================
-- PULSE MODULE - Event Check-In System
-- Add-on module for real-time event check-in tracking
-- Run this after 001_initial_schema.sql
-- ============================================================================

-- Table to enable Pulse on specific data tables
CREATE TABLE IF NOT EXISTS pulse_enabled_tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id UUID NOT NULL REFERENCES data_tables(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  
  -- Pulse configuration
  enabled BOOLEAN DEFAULT true,
  check_in_column_id UUID REFERENCES table_columns(id), -- Which column contains the barcode/ID
  display_columns UUID[], -- Array of column IDs to show in dashboard
  
  -- Settings
  settings JSONB DEFAULT '{
    "show_popup": true,
    "play_sound": false,
    "highlight_checked_in": true,
    "allow_duplicate_scans": false,
    "scan_mode": "rapid",
    "offline_mode": true,
    "guest_scanning_enabled": true
  }'::jsonb,
  
  -- Stats (cached for performance)
  total_rsvps INTEGER DEFAULT 0,
  checked_in_count INTEGER DEFAULT 0,
  walk_in_count INTEGER DEFAULT 0,
  last_check_in_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  UNIQUE(table_id)
);

-- Pulse check-in events (separate from scan_history for isolation)
CREATE TABLE IF NOT EXISTS pulse_check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pulse_table_id UUID NOT NULL REFERENCES pulse_enabled_tables(id) ON DELETE CASCADE,
  table_id UUID NOT NULL REFERENCES data_tables(id) ON DELETE CASCADE,
  row_id UUID NOT NULL REFERENCES table_rows(id) ON DELETE CASCADE,
  
  -- Check-in metadata
  barcode_scanned TEXT NOT NULL,
  scanner_user_name TEXT, -- Guest scanner name
  scanner_user_email TEXT, -- Guest scanner email
  scanner_device_id TEXT,
  check_in_time TIMESTAMPTZ DEFAULT NOW(),
  check_in_count INTEGER DEFAULT 1, -- Allow tracking multiple scans
  
  -- Row data snapshot (for reporting even if row deleted)
  row_data JSONB,
  
  -- Context
  is_walk_in BOOLEAN DEFAULT false,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) -- System user for guests
);

-- Pulse scanner sessions (track active scanners)
CREATE TABLE IF NOT EXISTS pulse_scanner_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pulse_table_id UUID NOT NULL REFERENCES pulse_enabled_tables(id) ON DELETE CASCADE,
  
  pairing_code TEXT NOT NULL,
  scanner_name TEXT NOT NULL,
  scanner_email TEXT,
  device_id TEXT,
  
  is_active BOOLEAN DEFAULT true,
  last_scan_at TIMESTAMPTZ,
  total_scans INTEGER DEFAULT 0,
  
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_pulse_checkins_table ON pulse_check_ins(table_id);
CREATE INDEX IF NOT EXISTS idx_pulse_checkins_row ON pulse_check_ins(row_id);
CREATE INDEX IF NOT EXISTS idx_pulse_checkins_time ON pulse_check_ins(check_in_time DESC);
CREATE INDEX IF NOT EXISTS idx_pulse_sessions_table ON pulse_scanner_sessions(pulse_table_id);
CREATE INDEX IF NOT EXISTS idx_pulse_sessions_active ON pulse_scanner_sessions(is_active, pulse_table_id);

-- Enable RLS
ALTER TABLE pulse_enabled_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE pulse_check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE pulse_scanner_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for authenticated users
DROP POLICY IF EXISTS "Users can view Pulse tables in their workspaces" ON pulse_enabled_tables;
CREATE POLICY "Users can view Pulse tables in their workspaces"
ON pulse_enabled_tables FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id 
    FROM workspace_members 
    WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can manage Pulse in their workspaces" ON pulse_enabled_tables;
CREATE POLICY "Users can manage Pulse in their workspaces"
ON pulse_enabled_tables FOR ALL
USING (
  workspace_id IN (
    SELECT workspace_id 
    FROM workspace_members 
    WHERE user_id = auth.uid()
  )
);

-- Guest scanner policies (anonymous)
DROP POLICY IF EXISTS "Guest scanners can read Pulse config" ON pulse_enabled_tables;
CREATE POLICY "Guest scanners can read Pulse config"
ON pulse_enabled_tables FOR SELECT
TO anon
USING (enabled = true AND (settings->>'guest_scanning_enabled')::boolean = true);

DROP POLICY IF EXISTS "Guest scanners can create check-ins" ON pulse_check_ins;
CREATE POLICY "Guest scanners can create check-ins"
ON pulse_check_ins FOR INSERT
TO anon
WITH CHECK (
  pulse_table_id IN (
    SELECT id FROM pulse_enabled_tables 
    WHERE enabled = true 
    AND (settings->>'guest_scanning_enabled')::boolean = true
  )
);

DROP POLICY IF EXISTS "Users can view check-ins in their workspaces" ON pulse_check_ins;
CREATE POLICY "Users can view check-ins in their workspaces"
ON pulse_check_ins FOR SELECT
USING (
  table_id IN (
    SELECT id FROM data_tables 
    WHERE workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "Guest scanners can view check-ins" ON pulse_check_ins;
CREATE POLICY "Guest scanners can view check-ins"
ON pulse_check_ins FOR SELECT
TO anon
USING (
  pulse_table_id IN (
    SELECT id FROM pulse_enabled_tables 
    WHERE enabled = true 
    AND (settings->>'guest_scanning_enabled')::boolean = true
  )
);

-- Scanner sessions policies
DROP POLICY IF EXISTS "Users can manage scanner sessions" ON pulse_scanner_sessions;
CREATE POLICY "Users can manage scanner sessions"
ON pulse_scanner_sessions FOR ALL
USING (
  pulse_table_id IN (
    SELECT id FROM pulse_enabled_tables 
    WHERE workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "Guest scanners can manage sessions" ON pulse_scanner_sessions;
CREATE POLICY "Guest scanners can manage sessions"
ON pulse_scanner_sessions FOR ALL
TO anon
USING (
  pulse_table_id IN (
    SELECT id FROM pulse_enabled_tables 
    WHERE enabled = true 
    AND (settings->>'guest_scanning_enabled')::boolean = true
  )
);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON pulse_enabled_tables TO authenticated;
GRANT SELECT, INSERT ON pulse_check_ins TO authenticated;
GRANT SELECT, INSERT, UPDATE ON pulse_scanner_sessions TO authenticated;

GRANT SELECT ON pulse_enabled_tables TO anon;
GRANT SELECT, INSERT ON pulse_check_ins TO anon;
GRANT SELECT, INSERT, UPDATE ON pulse_scanner_sessions TO anon;

-- Realtime publication (skip if already added)
DO $$
BEGIN
  -- Add pulse_check_ins to realtime if not already added
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'pulse_check_ins'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE pulse_check_ins;
  END IF;
  
  -- Add pulse_scanner_sessions to realtime if not already added
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'pulse_scanner_sessions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE pulse_scanner_sessions;
  END IF;
END $$;

-- Function to update cached stats
CREATE OR REPLACE FUNCTION update_pulse_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE pulse_enabled_tables
  SET 
    checked_in_count = (
      SELECT COUNT(DISTINCT row_id) 
      FROM pulse_check_ins 
      WHERE pulse_table_id = NEW.pulse_table_id
    ),
    walk_in_count = (
      SELECT COUNT(DISTINCT row_id) 
      FROM pulse_check_ins 
      WHERE pulse_table_id = NEW.pulse_table_id AND is_walk_in = true
    ),
    last_check_in_at = NEW.check_in_time,
    updated_at = NOW()
  WHERE id = NEW.pulse_table_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS pulse_stats_trigger ON pulse_check_ins;
CREATE TRIGGER pulse_stats_trigger
AFTER INSERT ON pulse_check_ins
FOR EACH ROW
EXECUTE FUNCTION update_pulse_stats();

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check tables were created
SELECT 
  tablename,
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = t.tablename
  ) THEN '✓ RLS Enabled' ELSE '✗ No RLS' END as rls_status
FROM (
  VALUES 
    ('pulse_enabled_tables'),
    ('pulse_check_ins'),
    ('pulse_scanner_sessions')
) AS t(tablename)
WHERE EXISTS (
  SELECT 1 FROM pg_tables 
  WHERE schemaname = 'public' AND tablename = t.tablename
);

-- Check realtime publication
SELECT tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename IN ('pulse_check_ins', 'pulse_scanner_sessions');

-- ============================================================================
-- DONE! Pulse module tables created
-- ============================================================================
