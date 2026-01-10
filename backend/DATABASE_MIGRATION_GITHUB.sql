-- Database migration for GitHub OAuth and documentation generation
-- Run this in Supabase SQL Editor

-- Create generated_docs table
CREATE TABLE IF NOT EXISTS generated_docs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repository_id UUID REFERENCES repositories(id) ON DELETE CASCADE,
  readme TEXT,
  api_docs TEXT,
  setup_guide TEXT,
  architecture TEXT,
  version TEXT DEFAULT '1.0.0',
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE generated_docs ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can view docs for their repos
CREATE POLICY "Users can view docs for their repos"
  ON generated_docs
  FOR SELECT
  USING (
    repository_id IN (
      SELECT id FROM repositories WHERE user_id = auth.uid()
    )
  );

-- Create policy: Users can insert docs for their repos
CREATE POLICY "Users can insert docs for their repos"
  ON generated_docs
  FOR INSERT
  WITH CHECK (
    repository_id IN (
      SELECT id FROM repositories WHERE user_id = auth.uid()
    )
  );

-- Create policy: Users can update docs for their repos
CREATE POLICY "Users can update docs for their repos"
  ON generated_docs
  FOR UPDATE
  USING (
    repository_id IN (
      SELECT id FROM repositories WHERE user_id = auth.uid()
    )
  );

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_generated_docs_repository_id ON generated_docs(repository_id);

-- Update repositories table to track doc generation status
ALTER TABLE repositories ADD COLUMN IF NOT EXISTS docs_generated BOOLEAN DEFAULT FALSE;
ALTER TABLE repositories ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE repositories ADD COLUMN IF NOT EXISTS github_id TEXT;
ALTER TABLE repositories ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT FALSE;
ALTER TABLE repositories ADD COLUMN IF NOT EXISTS language TEXT;
ALTER TABLE repositories ADD COLUMN IF NOT EXISTS description TEXT;

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to generated_docs
DROP TRIGGER IF EXISTS update_generated_docs_updated_at ON generated_docs;
CREATE TRIGGER update_generated_docs_updated_at 
  BEFORE UPDATE ON generated_docs
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
