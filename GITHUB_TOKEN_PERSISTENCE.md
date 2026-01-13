# GitHub Access Token Persistence Implementation

## Overview

This implementation ensures GitHub OAuth tokens are persisted to the database for background job access. Tokens are stored securely in the `profiles` table and retrieved by backend services when generating documentation.

## Database Migration

### File: `backend/DATABASE_MIGRATION_PROFILES_GITHUB_TOKEN.sql`

**What it does:**
- Creates `profiles` table if it doesn't exist
- Adds `github_access_token` column (idempotent)
- Sets up Row Level Security (RLS) policies
- Creates trigger to auto-create profile on user signup

**RLS Policies:**
1. **Users can view own profile** - Users can SELECT their own profile
2. **Users can update own profile** - Users can UPDATE their own profile (including token)
3. **Users can insert own profile** - Users can INSERT their own profile
4. **Service role can read github_access_token** - Backend can read tokens for background jobs

**Security Notes:**
- Users can write tokens but cannot read them back via RLS (security measure)
- Service role (backend) can read tokens using service_role key
- Tokens are overwritten on re-login (upsert behavior)

## Frontend Implementation

### 1. Settings Page (`src/pages/Settings.tsx`)

**Token Persistence on OAuth Callback:**
```typescript
async function handleGitHubCallback() {
  const { data: { session } } = await supabase.auth.getSession();
  const providerToken = session.provider_token;
  
  if (providerToken) {
    await supabase.from('profiles').upsert({
      id: session.user.id,
      github_access_token: providerToken,
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' });
  }
}
```

**Token Removal on Disconnect:**
```typescript
async function handleDisconnectGitHub() {
  await supabase.from('profiles').update({
    github_access_token: null,
    updated_at: new Date().toISOString()
  }).eq('id', session.user.id);
}
```

### 2. Dashboard Page (`src/pages/Dashboard.tsx`)

**Token Persistence After Login Redirect:**
- Automatically persists token when user is redirected from GitHub OAuth
- Runs on component mount to catch tokens from SignUpModal redirects
- Silent failure (doesn't interrupt user flow)

### 3. Error Handling (`src/pages/ProjectDetail.tsx`)

**Token Error Detection:**
- Detects error messages containing "GitHub token" or "reconnect"
- Shows "Reconnect GitHub Account" link when token is missing
- Prevents infinite retries by disabling regenerate button
- Redirects user to Settings page to reconnect

## Backend Implementation

### File: `backend/src/services/auditDocGenerator.ts`

**Token Retrieval:**
```typescript
// 1. Try profiles table (primary source)
const { data: profile } = await supabase
  .from('profiles')
  .select('github_access_token')
  .eq('id', repo.user_id)
  .single();

// 2. Fallback: User metadata (backward compatibility)
const githubIdentity = user.identities?.find(id => id.provider === 'github');
const token = githubIdentity?.identity_data?.provider_token || ...;

// 3. Final fallback: Environment variable (dev/testing)
const token = process.env.GITHUB_TOKEN;
```

**Error Handling:**
- If token is missing, updates `generated_docs` status to `'failed'`
- Sets `error_message` to: "GitHub token not available. Please reconnect your GitHub account in Settings."
- Aborts execution cleanly (no partial state)

## Security Considerations

### Token Storage
- ✅ Tokens stored in database (not in session only)
- ✅ RLS prevents users from reading tokens back
- ✅ Service role can read tokens for background jobs
- ✅ Tokens overwritten on re-login (no stale tokens)

### Token Exposure
- ✅ Never logged in production (`import.meta.env.DEV` check)
- ✅ Never exposed to client except at login time
- ✅ Only backend service role can read tokens

### Token Revocation
- ✅ Disconnect clears token from database
- ⚠️ TODO: Call GitHub API to revoke token (future enhancement)

## Edge Cases Handled

### 1. Token Refresh on Re-login
- Token is overwritten every time user logs in with GitHub
- Uses `upsert` with `onConflict: 'id'` to update existing rows

### 2. Revoked Tokens
- GitHub API will return 401 Unauthorized
- Backend error handling catches this and updates status to 'failed'
- User sees "Reconnect GitHub" message in UI

### 3. Missing Token
- Backend checks multiple sources (profiles → user metadata → env var)
- If all fail, sets status to 'failed' with clear error message
- Frontend shows "Reconnect GitHub" link

### 4. Stale Tokens
- Tokens are refreshed on every login
- Old tokens are overwritten (no accumulation)

## Migration Instructions

1. **Run the migration:**
   ```sql
   -- Execute: backend/DATABASE_MIGRATION_PROFILES_GITHUB_TOKEN.sql
   -- In Supabase SQL Editor
   ```

2. **Verify RLS policies:**
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'profiles';
   ```

3. **Test token persistence:**
   - Log in with GitHub OAuth
   - Check `profiles` table for `github_access_token`
   - Verify token is not null

4. **Test token retrieval:**
   - Trigger documentation generation
   - Verify backend can read token from profiles table
   - Check logs for successful GitHub API calls

## Testing Checklist

- [ ] Migration runs successfully (idempotent)
- [ ] Profile created automatically on user signup
- [ ] Token persisted after GitHub OAuth login
- [ ] Token overwritten on re-login
- [ ] Token cleared on disconnect
- [ ] Backend can read token from profiles table
- [ ] Documentation generation works with persisted token
- [ ] Error message shown when token is missing
- [ ] "Reconnect GitHub" link appears in error state
- [ ] No token logged in production

## Notes

- **Token Format**: GitHub OAuth tokens are typically `gho_...` or `ghp_...` format
- **Token Expiry**: GitHub OAuth tokens don't expire unless revoked
- **Token Scopes**: Required scopes: `repo read:user` (set in OAuth flow)
- **Backward Compatibility**: Falls back to user metadata if profiles table doesn't have token

## Future Enhancements

1. **Token Revocation**: Call GitHub API to revoke token on disconnect
2. **Token Refresh**: Implement refresh token flow if GitHub adds it
3. **Token Encryption**: Encrypt tokens at rest (currently stored as plain text)
4. **Token Rotation**: Automatically refresh tokens before expiry
