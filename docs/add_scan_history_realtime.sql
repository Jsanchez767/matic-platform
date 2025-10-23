-- ============================================================================
-- ADD SCAN_HISTORY TO REALTIME PUBLICATION
-- Run this in Supabase SQL Editor to enable real-time updates for scan results
-- ============================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE scan_history;

-- Verify it was added
SELECT tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'scan_history';
