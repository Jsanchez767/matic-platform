-- Create scan_history table if it doesn't exist
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS scan_history (
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

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_scan_history_table ON scan_history (table_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scan_history_workspace ON scan_history (workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scan_history_barcode ON scan_history (barcode);
CREATE INDEX IF NOT EXISTS idx_scan_history_column_name ON scan_history (table_id, column_name, created_at DESC);

-- Enable Realtime for scan_history table
ALTER PUBLICATION supabase_realtime ADD TABLE scan_history;

-- Grant necessary permissions
GRANT ALL ON scan_history TO authenticated;
GRANT ALL ON scan_history TO service_role;

-- Verify table was created
SELECT 'scan_history table created successfully!' as message;
