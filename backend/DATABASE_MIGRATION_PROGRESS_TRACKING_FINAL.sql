-- ============================================================================
-- Idempotent Migration: Document Generation Progress Tracking
-- ============================================================================
-- This migration adds progress tracking fields to generated_docs table.
-- It is safe to run multiple times (idempotent).
-- 
-- Purpose:
--   - Track generation status (idle, generating, completed, failed)
--   - Track progress percentage (0-100)
--   - Track current step description
--   - Track error messages
--   - Track generation start timestamp for time-based locking
--
-- Backfill Strategy:
--   - If any document content exists → status = 'completed'
--   - Otherwise → status = 'idle'
--   - If generation_started_at is null but generated_at exists → copy it
-- ============================================================================

-- Step 1: Add status column with constraint (idempotent)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'generated_docs' AND column_name = 'status'
  ) THEN
    ALTER TABLE generated_docs 
    ADD COLUMN status TEXT DEFAULT 'idle' 
    CHECK (status IN ('idle', 'generating', 'completed', 'failed'));
  END IF;
END $$;

-- Step 2: Add progress column with constraint (idempotent)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'generated_docs' AND column_name = 'progress'
  ) THEN
    ALTER TABLE generated_docs 
    ADD COLUMN progress INTEGER DEFAULT 0 
    CHECK (progress >= 0 AND progress <= 100);
  END IF;
END $$;

-- Step 3: Add current_step column (idempotent)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'generated_docs' AND column_name = 'current_step'
  ) THEN
    ALTER TABLE generated_docs 
    ADD COLUMN current_step TEXT;
  END IF;
END $$;

-- Step 4: Add error_message column (idempotent)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'generated_docs' AND column_name = 'error_message'
  ) THEN
    ALTER TABLE generated_docs 
    ADD COLUMN error_message TEXT;
  END IF;
END $$;

-- Step 5: Add generation_started_at column (idempotent)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'generated_docs' AND column_name = 'generation_started_at'
  ) THEN
    ALTER TABLE generated_docs 
    ADD COLUMN generation_started_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Step 6: Backfill status for existing rows
-- Strategy: If any content exists → 'completed', otherwise → 'idle'
UPDATE generated_docs 
SET status = CASE 
  WHEN status IS NULL AND (
    readme IS NOT NULL OR 
    api_docs IS NOT NULL OR 
    setup_guide IS NOT NULL OR 
    architecture IS NOT NULL
  ) THEN 'completed'
  WHEN status IS NULL THEN 'idle'
  ELSE status  -- Don't overwrite existing status
END
WHERE status IS NULL;

-- Step 7: Backfill progress for existing rows (default to 0 if null)
UPDATE generated_docs 
SET progress = 0
WHERE progress IS NULL;

-- Step 8: Backfill generation_started_at from generated_at if available
UPDATE generated_docs 
SET generation_started_at = generated_at
WHERE generation_started_at IS NULL 
  AND generated_at IS NOT NULL;

-- Step 9: Ensure default values for new rows (set column defaults if not already set)
-- Note: Defaults are already set in ALTER TABLE above, but we ensure consistency
DO $$ 
BEGIN
  -- Ensure status default
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'generated_docs' 
      AND column_name = 'status' 
      AND column_default = '''idle''::text'
  ) THEN
    ALTER TABLE generated_docs 
    ALTER COLUMN status SET DEFAULT 'idle';
  END IF;

  -- Ensure progress default
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'generated_docs' 
      AND column_name = 'progress' 
      AND column_default = '0'
  ) THEN
    ALTER TABLE generated_docs 
    ALTER COLUMN progress SET DEFAULT 0;
  END IF;
END $$;

-- Step 10: Create indexes safely (idempotent)
CREATE INDEX IF NOT EXISTS idx_generated_docs_status 
ON generated_docs(status);

CREATE INDEX IF NOT EXISTS idx_generated_docs_repository_status 
ON generated_docs(repository_id, status);

-- Step 11: Create index for generation_started_at queries (for time-based locking)
CREATE INDEX IF NOT EXISTS idx_generated_docs_generation_started_at 
ON generated_docs(generation_started_at) 
WHERE generation_started_at IS NOT NULL;

-- ============================================================================
-- Migration Complete
-- ============================================================================
-- All columns are now present with proper defaults and constraints.
-- Existing rows have been backfilled with appropriate values.
-- Indexes are in place for efficient queries.
-- This migration can be run multiple times safely.
-- ============================================================================
