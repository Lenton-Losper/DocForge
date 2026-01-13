# Complete Environment Variables Setup

## Backend Environment Variables

Create or update `backend/.env`:

```bash
# Supabase Configuration
SUPABASE_URL=https://afcgapmhwnxeposwbhdu.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
SUPABASE_ANON_KEY=your-anon-key-here  # Required for auth middleware

# OpenAI API (for AI documentation generation)
OPENAI_API_KEY=your-openai-api-key-here

# Optional: Personal GitHub token as fallback
# Only needed if users don't connect via OAuth
GITHUB_TOKEN=your-github-personal-access-token-here
```

## Frontend Environment Variables

Create or update `frontend/.env` (or root `.env` if using Vite):

```bash
VITE_SUPABASE_URL=https://afcgapmhwnxeposwbhdu.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_API_URL=http://localhost:8000
```

## How to Get These Values

### Supabase Keys

1. Go to: https://app.supabase.com/dashboard/project/afcgapmhwnxeposwbhdu
2. Click **Settings** → **API**
3. Copy:
   - **Project URL** → `SUPABASE_URL` / `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY` (frontend) AND `SUPABASE_ANON_KEY` (backend auth)
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ Keep secret!)

### OpenAI API Key

1. Go to: https://platform.openai.com/api-keys
2. Sign up or log in
3. Click **Create new secret key**
4. Name it (e.g., "DocDocs Backend")
5. Copy the key → `OPENAI_API_KEY`

### GitHub Personal Access Token (Optional)

Only needed as a fallback if OAuth tokens aren't available:

1. Go to: https://github.com/settings/tokens
2. Click **Generate new token** → **Generate new token (classic)**
3. Name: `DocDocs Backend`
4. Scopes: Select `repo` (full repository access)
5. Generate and copy → `GITHUB_TOKEN`

## Verification

After setting up:

1. **Backend:**
   ```bash
   cd backend
   npm run dev
   ```
   Should start without errors about missing env vars.

2. **Frontend:**
   ```bash
   npm run dev
   ```
   Should connect to Supabase without errors.

## Security Notes

- ⚠️ **Never commit `.env` files to git**
- ⚠️ **Service role key has admin access** - only use in backend
- ⚠️ **OpenAI API key** - keep secret, has billing access
- ✅ **Anon key** - safe to expose in frontend (has RLS protection)
