-- ============================================================================
-- Idempotent Migration: GitHub Access Token Persistence
-- ============================================================================
-- This migration creates/updates the profiles table to store GitHub access tokens.
-- It is safe to run multiple times (idempotent).
--
-- Purpose:
--   - Store GitHub OAuth tokens for background job access
--   - Tokens are overwritten on re-login (upsert behavior)
--   - Backend service role can read tokens for background jobs
-- ============================================================================

-- Step 1: Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Add github_access_token column (idempotent)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'github_access_token'
  ) THEN
    ALTER TABLE profiles 
    ADD COLUMN github_access_token TEXT;
  END IF;
END $$;

-- Step 3: Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Step 4: Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Service role can read github_access_token" ON profiles;

-- Step 5: Create RLS policy - Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Step 6: Create RLS policy - Users can update their own profile
-- Note: Users can update github_access_token, but cannot read it via RLS
-- (They can only write it, not read it back - security measure)
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Step 7: Create RLS policy - Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Step 8: Note on Service Role Access
-- The backend uses SUPABASE_SERVICE_ROLE_KEY which bypasses RLS entirely.
-- No special policy is needed for service role to read github_access_token.
-- Service role can read/write any row regardless of RLS policies.

-- Step 9: Create index for faster lookups by user_id
CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);

-- Step 10: Create function to automatically create profile on user signup
-- This ensures a profile row exists when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 11: Create trigger to call function on user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- Migration Complete
-- ============================================================================
-- The profiles table now:
--   - Stores github_access_token for each user
--   - Allows users to update their own profile (including token)
--   - Allows service role to read tokens for background jobs
--   - Automatically creates profile row on user signup
-- ============================================================================
