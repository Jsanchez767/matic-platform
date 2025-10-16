-- Migration: Add 'link' column type to table_columns check constraint
-- Date: 2025-10-16
-- Purpose: Enable link column type for table relationships

-- Drop the existing check constraint
ALTER TABLE table_columns DROP CONSTRAINT table_columns_column_type_check;

-- Add the new check constraint with 'link' included
ALTER TABLE table_columns ADD CONSTRAINT table_columns_column_type_check 
CHECK (column_type IN (
    'text', 'number', 'email', 'url', 'phone',
    'select', 'multiselect', 'checkbox',
    'date', 'datetime',
    'attachment', 'image',
    'user', 'formula', 'rollup', 'lookup', 'link',
    'rating', 'currency', 'percent',
    'duration', 'barcode', 'button'
));