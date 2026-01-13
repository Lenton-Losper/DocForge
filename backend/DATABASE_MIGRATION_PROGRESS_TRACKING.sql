-- Add job progress tracking fields to generated_docs table
ALTER TABLE generated_docs 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'idle' CHECK (status IN ('idle', 'generating', 'completed', 'failed')),
ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
ADD COLUMN IF NOT EXISTS current_step TEXT,
ADD COLUMN IF NOT EXISTS error_message TEXT,
ADD COLUMN IF NOT EXISTS generation_started_at TIMESTAMP WITH TIME ZONE;

-- Update existing rows to have default status
UPDATE generated_docs 
SET status = 'completed' 
WHERE status IS NULL AND (readme IS NOT NULL OR api_docs IS NOT NULL OR setup_guide IS NOT NULL OR architecture IS NOT NULL);

UPDATE generated_docs 
SET status = 'idle' 
WHERE status IS NULL;

-- Add index for faster status queries
CREATE INDEX IF NOT EXISTS idx_generated_docs_status ON generated_docs(status);
CREATE INDEX IF NOT EXISTS idx_generated_docs_repository_status ON generated_docs(repository_id, status);
