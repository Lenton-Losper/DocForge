# How to Run Database Migration

## Migration File Location
```
DocForge/backend/DATABASE_MIGRATION_PROGRESS_TRACKING.sql
```

## Method 1: Supabase Dashboard (Easiest) ⭐ Recommended

1. Go to: https://app.supabase.com/project/afcgapmhwnxeposwbhdu
2. Click **SQL Editor** in the left sidebar
3. Click **New query**
4. Copy and paste the entire contents of `DATABASE_MIGRATION_PROGRESS_TRACKING.sql`
5. Click **Run** (or press `Ctrl+Enter` / `Cmd+Enter`)

## Method 2: Using psql (Command Line)

If you have the database connection string:

```bash
# Get connection string from Supabase Dashboard:
# Settings → Database → Connection string → URI
# Format: postgresql://postgres:[PASSWORD]@db.afcgapmhwnxeposwbhdu.supabase.co:5432/postgres

psql "postgresql://postgres:[YOUR_PASSWORD]@db.afcgapmhwnxeposwbhdu.supabase.co:5432/postgres" -f DATABASE_MIGRATION_PROGRESS_TRACKING.sql
```

## Method 3: Using Supabase CLI

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref afcgapmhwnxeposwbhdu

# Run migration
supabase db push
```

## Verify Migration

After running, verify the columns were added:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'generated_docs' 
AND column_name IN ('status', 'progress', 'current_step', 'error_message');
```

You should see all 4 columns listed.

## Migration Contents

The migration adds:
- `status` (TEXT): 'idle' | 'generating' | 'completed' | 'failed'
- `progress` (INTEGER): 0-100
- `current_step` (TEXT): Human-readable step description
- `error_message` (TEXT): Error details if generation fails

Plus indexes for faster queries.
