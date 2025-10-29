-- ============================================================================
-- Add barcode_column_id to pulse_enabled_tables
-- Migration to support configurable barcode column for scanning
-- 
-- IMPORTANT: Run this migration to enable the barcode column selector in Pulse settings!
-- Without this column, the selector will appear but settings won't save.
-- ============================================================================

-- Add barcode_column_id column to pulse_enabled_tables
ALTER TABLE pulse_enabled_tables 
ADD COLUMN IF NOT EXISTS barcode_column_id UUID REFERENCES table_columns(id);

-- Add comment for documentation
COMMENT ON COLUMN pulse_enabled_tables.barcode_column_id IS 
  'Column ID containing barcode values to match when scanning (for check-in lookups)';

-- Update existing records to use check_in_column_id as default if not set
-- This ensures existing Pulse setups continue working without manual configuration
UPDATE pulse_enabled_tables
SET barcode_column_id = check_in_column_id
WHERE barcode_column_id IS NULL AND check_in_column_id IS NOT NULL;

-- Verify the migration worked
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'pulse_enabled_tables' 
    AND column_name = 'barcode_column_id'
  ) THEN
    RAISE NOTICE '✅ Migration successful! barcode_column_id column added to pulse_enabled_tables';
  ELSE
    RAISE EXCEPTION '❌ Migration failed! barcode_column_id column was not created';
  END IF;
END $$;
