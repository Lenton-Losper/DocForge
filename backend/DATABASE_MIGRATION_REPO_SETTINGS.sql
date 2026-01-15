-- Migration: Repository Settings Table
-- Run this in Supabase SQL Editor

-- Create repo_settings table
CREATE TABLE IF NOT EXISTS repo_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  repository_id UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
  auto_regenerate_on_push BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(repository_id) -- One settings record per repository
);

-- Enable RLS
ALTER TABLE repo_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own repo settings
CREATE POLICY "Users can view their own repo settings"
  ON repo_settings
  FOR SELECT
  USING (user_id = auth.uid());

-- Policy: Users can insert their own repo settings
CREATE POLICY "Users can insert their own repo settings"
  ON repo_settings
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Policy: Users can update their own repo settings
CREATE POLICY "Users can update their own repo settings"
  ON repo_settings
  FOR UPDATE
  USING (user_id = auth.uid());

-- Policy: Users can delete their own repo settings
CREATE POLICY "Users can delete their own repo settings"
  ON repo_settings
  FOR DELETE
  USING (user_id = auth.uid());

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_repo_settings_repository_id ON repo_settings(repository_id);
CREATE INDEX IF NOT EXISTS idx_repo_settings_user_id ON repo_settings(user_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_repo_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_repo_settings_updated_at_trigger ON repo_settings;
CREATE TRIGGER update_repo_settings_updated_at_trigger
  BEFORE UPDATE ON repo_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_repo_settings_updated_at();

-- Ensure repositories table has required columns
ALTER TABLE repositories ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE repositories ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE repositories ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'github';
ALTER TABLE repositories ADD COLUMN IF NOT EXISTS default_branch TEXT DEFAULT 'main';

-- Add index for repository lookups
CREATE INDEX IF NOT EXISTS idx_repositories_user_id ON repositories(user_id);
CREATE INDEX IF NOT EXISTS idx_repositories_full_name ON repositories(full_name);
