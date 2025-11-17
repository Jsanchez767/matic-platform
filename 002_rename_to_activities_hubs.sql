-- Migration: Rename request_hubs to activities_hubs and add new fields
-- Created: 2025-11-17
-- Description: This migration renames request_hubs and request_hub_tabs to activities_hubs
--              and activities_hub_tabs, and adds new fields for activity management.

-- Rename tables
ALTER TABLE IF EXISTS request_hubs RENAME TO activities_hubs;
ALTER TABLE IF EXISTS request_hub_tabs RENAME TO activities_hub_tabs;

-- Add new columns to activities_hubs table
ALTER TABLE activities_hubs
  ADD COLUMN IF NOT EXISTS category VARCHAR(255),
  ADD COLUMN IF NOT EXISTS begin_date TIMESTAMP,
  ADD COLUMN IF NOT EXISTS end_date TIMESTAMP,
  ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'upcoming',
  ADD COLUMN IF NOT EXISTS participants INTEGER DEFAULT 0;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_activities_hubs_status ON activities_hubs(status);
CREATE INDEX IF NOT EXISTS idx_activities_hubs_begin_date ON activities_hubs(begin_date);
CREATE INDEX IF NOT EXISTS idx_activities_hubs_end_date ON activities_hubs(end_date);
CREATE INDEX IF NOT EXISTS idx_activities_hubs_category ON activities_hubs(category);

-- Update workspace foreign key references (if they exist in other tables)
-- Note: GORM should handle the relationship naming automatically

-- Add check constraint for status values
ALTER TABLE activities_hubs
  ADD CONSTRAINT check_activities_hub_status 
  CHECK (status IN ('active', 'upcoming', 'completed'));

-- Create a comment on the table
COMMENT ON TABLE activities_hubs IS 'Activities Hub - manages activities, events, and programs within a workspace';
COMMENT ON COLUMN activities_hubs.category IS 'Category or program type of the activity';
COMMENT ON COLUMN activities_hubs.begin_date IS 'Start date of the activity';
COMMENT ON COLUMN activities_hubs.end_date IS 'End date of the activity';
COMMENT ON COLUMN activities_hubs.status IS 'Current status: active, upcoming, or completed';
COMMENT ON COLUMN activities_hubs.participants IS 'Number of participants enrolled';
