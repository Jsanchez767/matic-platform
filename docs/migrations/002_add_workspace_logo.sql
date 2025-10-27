-- Migration: Add logo_url column to workspaces table
-- Date: 2025-10-27
-- Description: Adds support for workspace logos stored in Supabase Storage

-- Add logo_url column to workspaces table
ALTER TABLE workspaces 
ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN workspaces.logo_url IS 'Public URL of the workspace logo stored in Supabase Storage (workspace-assets bucket)';

-- Optional: Add index if we plan to query by logo_url
-- CREATE INDEX IF NOT EXISTS idx_workspaces_logo_url ON workspaces(logo_url);
