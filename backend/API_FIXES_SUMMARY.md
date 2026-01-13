# API Fixes Summary - `/api/generate-docs` Endpoint

## Root Causes Identified

### 1. **Auth Middleware Issue**
- **Problem**: Using service_role key client to verify user tokens doesn't work correctly
- **Fix**: Create separate client with anon key for user token verification
- **Location**: `backend/src/middleware/auth.ts`

### 2. **Missing Request Validation**
- **Problem**: No logging or validation of request body
- **Fix**: Added comprehensive logging and type checking
- **Location**: `backend/src/routes/generateDocs.route.ts`

### 3. **Database Schema Mismatch**
- **Problem**: Code references `status` column that doesn't exist in `generated_docs` table
- **Fix**: Removed all references to `status` column
- **Location**: Multiple files

### 4. **Supabase 406 Errors**
- **Problem**: `.select('*')` with RLS can cause 406 if columns don't exist or RLS blocks
- **Fix**: Explicit column selection and better error handling
- **Location**: `src/pages/ProjectDetail.tsx`

### 5. **Frontend Error Handling**
- **Problem**: Generic error messages, no request validation
- **Fix**: Detailed error messages, request validation, better logging
- **Location**: `src/pages/ProjectDetail.tsx`

## Fixes Applied

### Fix 1: Auth Middleware (`backend/src/middleware/auth.ts`)

**Before:**
```typescript
const { data: { user }, error } = await supabase.auth.getUser(token);
```

**After:**
```typescript
// Create client with anon key for user verification
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
const { data: { user }, error } = await supabaseClient.auth.getUser(token);
```

**Why**: Service role key bypasses RLS and doesn't properly verify user tokens. Anon key is needed for user authentication.

### Fix 2: Route Handler Logging (`backend/src/routes/generateDocs.route.ts`)

**Added:**
- Request body validation and logging
- Type checking for `repository_id`
- Repository ownership verification
- Better error messages with context

**Key Changes:**
```typescript
// Log request for debugging
console.log('[GENERATE-DOCS] Request received:', {
  body: req.body,
  hasAuth: !!req.user,
  userId: req.user?.id
});

// Validate repository_id
if (typeof repository_id !== 'string') {
  return res.status(400).json({ 
    error: 'repository_id must be a string',
    received: typeof repository_id
  });
}

// Verify repository belongs to user
const { data: repo } = await supabase
  .from('repositories')
  .select('id, user_id')
  .eq('id', repository_id)
  .eq('user_id', req.user.id)
  .single();
```

### Fix 3: Removed Status Column References

**Problem**: Database schema doesn't have `status` column in `generated_docs`

**Fixed in:**
- `backend/src/routes/generateDocs.route.ts` - Removed status from upsert
- `backend/src/services/auditDocGenerator.ts` - Removed status from upsert
- `src/pages/ProjectDetail.tsx` - Status determined from content presence

### Fix 4: Frontend Query Fix (`src/pages/ProjectDetail.tsx`)

**Before:**
```typescript
.select('*')
```

**After:**
```typescript
.select('id, repository_id, readme, api_docs, setup_guide, architecture, version, generated_at, updated_at')
```

**Why**: Explicit column selection avoids 406 errors with RLS and ensures compatibility.

### Fix 5: Frontend Error Handling (`src/pages/ProjectDetail.tsx`)

**Added:**
- Session validation before request
- Repository ID validation
- Detailed error messages based on status code
- Request/response logging
- Better polling logic

**Key Changes:**
```typescript
// Validate session
if (!session?.access_token) {
  throw new Error('Not authenticated. Please log in again.');
}

// Validate repository ID
if (!id) {
  throw new Error('Repository ID is missing');
}

// Detailed error handling
if (response.status === 400) {
  errorMessage = responseData.error || 'Invalid request. Check repository ID.';
} else if (response.status === 401) {
  errorMessage = 'Authentication failed. Please log in again.';
}
```

## Environment Variables Required

Add to `backend/.env`:
```bash
SUPABASE_URL=your-url
SUPABASE_SERVICE_ROLE_KEY=your-service-key
SUPABASE_ANON_KEY=your-anon-key  # NEW - needed for auth middleware
OPENAI_API_KEY=your-openai-key
```

## Testing Checklist

- [ ] Backend starts without errors
- [ ] Auth middleware logs show user verification
- [ ] Route handler logs show request details
- [ ] 400 error returned for missing/invalid repository_id
- [ ] 401 error returned for invalid/missing token
- [ ] 404 error returned for non-existent repository
- [ ] Placeholder row created successfully
- [ ] Frontend shows appropriate error messages
- [ ] No 406 errors in console
- [ ] Documentation generation starts successfully

## Debugging Tips

1. **Check backend logs** for `[GENERATE-DOCS]` and `[AUTH]` prefixes
2. **Check frontend console** for `[REGENERATE]` logs
3. **Verify environment variables** are set correctly
4. **Check Supabase RLS policies** allow user access
5. **Verify database schema** matches code expectations

## Common Issues

### Issue: "No token provided"
- **Cause**: Frontend not sending Authorization header
- **Fix**: Check `session?.access_token` exists before request

### Issue: "Invalid token"
- **Cause**: Token expired or invalid
- **Fix**: User needs to log in again

### Issue: "Repository not found"
- **Cause**: Repository doesn't exist or doesn't belong to user
- **Fix**: Verify repository_id and user ownership

### Issue: 406 Not Acceptable
- **Cause**: RLS blocking query or invalid column selection
- **Fix**: Use explicit column selection, verify RLS policies
