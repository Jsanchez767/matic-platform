-- ============================================================================
-- Add barcode_column_id to pulse_enabled_tables
-- Migration to support configurable barcode column for scanning
-- ============================================================================

-- Add barcode_column_id column to pulse_enabled_tables
ALTER TABLE pulse_enabled_tables 
ADD COLUMN IF NOT EXISTS barcode_column_id UUID REFERENCES table_columns(id);

-- Add comment for documentation
COMMENT ON COLUMN pulse_enabled_tables.barcode_column_id IS 
  'Column ID containing barcode values to match when scanning (for check-in lookups)';

-- Update existing records to use check_in_column_id as default if not set
UPDATE pulse_enabled_tables
SET barcode_column_id = check_in_column_id
WHERE barcode_column_id IS NULL AND check_in_column_id IS NOT NULL;

