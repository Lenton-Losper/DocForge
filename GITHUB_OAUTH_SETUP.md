# GitHub OAuth Setup Guide

## ⚠️ IMPORTANT: This Must Be Done Before GitHub OAuth Works

The error `"Unsupported provider: provider is not enabled"` means GitHub is not enabled in Supabase. Follow these steps:

---

## Step 1: Create GitHub OAuth App (5 minutes)

1. **Go to GitHub Developer Settings:**
   - Visit: https://github.com/settings/developers
   - Or: GitHub Profile → Settings → Developer settings → OAuth Apps

2. **Click "New OAuth App"**

3. **Fill in the form EXACTLY:**
   - **Application name:** `DocDocs`
   - **Homepage URL:** `http://localhost:5173`
   - **Authorization callback URL:** `https://afcgapmhwnxeposwbhdu.supabase.co/auth/v1/callback`
     - ⚠️ **CRITICAL:** This must match EXACTLY - copy/paste it!

4. **Click "Register application"**

5. **Copy your credentials:**
   - **Client ID** (visible immediately - copy it)
   - **Client Secret** (click "Generate a new client secret" if needed, then copy it)
   - ⚠️ **Save these in a text file - you'll need them next!**

### Step 2: Enable GitHub in Supabase

1. Go to Supabase Dashboard: https://app.supabase.com
2. Select your project: `afcgapmhwnxeposwbhdu`
3. Navigate to: **Authentication** → **Providers**
4. Find **GitHub** in the list
5. Click to enable it
6. Enter:
   - **Client ID:** (from Step 1)
   - **Client Secret:** (from Step 1)
7. Click **"Save"**

### Step 3: Configure Redirect URLs (2 minutes)

1. **Still in Supabase Dashboard:**
   - Go to **Authentication** → **URL Configuration** tab

2. **Set Site URL:**
   - **Site URL:** `http://localhost:5173`

3. **Add Redirect URLs:**
   - Click **"Add URL"** button
   - Add each URL one at a time:
     - `http://localhost:5173/settings?github=connected`
     - `http://localhost:5173/dashboard`
     - `http://localhost:5173`
   - Click **"Save"** after adding all URLs

### Step 4: Run Database Migration

1. Go to Supabase Dashboard → **SQL Editor**
2. Copy and paste the contents of `backend/DATABASE_MIGRATION_GITHUB.sql`
3. Click **"Run"**

### Step 5: Add Environment Variables

**Backend `.env` file:**
```env
# Existing
SUPABASE_URL=https://afcgapmhwnxeposwbhdu.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Add these for AI documentation generation
ANTHROPIC_API_KEY=your-anthropic-api-key
# OR use OpenAI instead:
# OPENAI_API_KEY=your-openai-api-key

# Optional: Personal GitHub token as fallback
GITHUB_TOKEN=your-github-personal-access-token
```

**Get Anthropic API Key:**
1. Go to: https://console.anthropic.com/
2. Sign up or log in
3. Navigate to **API Keys**
4. Create a new API key
5. Copy and add to `.env`

**Get GitHub Personal Access Token (Optional):**
1. Go to: https://github.com/settings/tokens
2. Click **"Generate new token"** → **"Generate new token (classic)"**
3. Name: `DocDocs Backend`
4. Scopes: Select `repo` (full repository access)
5. Generate and copy the token

## Testing Checklist

After setup, test in this order:

- [ ] Settings page shows "Connect GitHub" button
- [ ] Clicking button redirects to GitHub OAuth
- [ ] After authorizing, returns to Settings with success message
- [ ] Settings shows "Connected to GitHub" with username
- [ ] Dashboard shows repository picker when clicking "Connect Repository"
- [ ] Repository picker loads user's GitHub repos
- [ ] Search filters repositories correctly
- [ ] Selecting a repository saves to database
- [ ] Backend generates documentation (check logs)
- [ ] User is redirected to project detail page
- [ ] Generated docs are visible in project detail page

## Troubleshooting

### "GitHub not connected" error
- Check that GitHub provider is enabled in Supabase
- Verify OAuth app callback URL matches Supabase callback URL
- Check browser console for OAuth errors

### "GitHub token not available" error
- Supabase stores provider_token in session, but it may not persist
- Consider storing the token in your database after OAuth
- Check that user has GitHub identity in Supabase Auth

### Repository picker shows no repos
- Verify GitHub OAuth scopes include `repo`
- Check that user authorized repository access
- Verify GitHub API token is valid

### Documentation generation fails
- Check that ANTHROPIC_API_KEY is set in backend `.env`
- Verify backend can access Supabase database
- Check backend logs for detailed error messages

## Security Notes

- **Never expose GitHub tokens in frontend code**
- Store provider_token securely in database if needed
- Use service_role key only in backend
- Implement rate limiting for GitHub API calls
- Consider caching repository data to reduce API calls
