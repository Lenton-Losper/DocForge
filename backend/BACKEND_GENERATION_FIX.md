# Backend Documentation Generation - Robust Pipeline Fix

## Overview

This document describes the refactoring of the backend documentation generation pipeline to be robust, linear, and fail-safe. The pipeline now uses explicit state machine, centralized progress updates, and proper error handling.

## Key Changes

### 1. Centralized Job State Manager

**File:** `backend/src/services/jobStateManager.ts` (NEW)

- Single source of truth for updating job progress
- All progress updates go through `updateJob()` function
- Ensures consistency and prevents duplicate update logic

```typescript
export async function updateJob(
  repositoryId: string,
  update: {
    progress?: number;
    current_step?: string;
    status?: 'idle' | 'generating' | 'completed' | 'failed';
    error_message?: string | null;
  }
): Promise<void>
```

### 2. Token Retrieval Without Auth Session

**Problem:** Background jobs don't have user sessions, so `supabase.auth.getUserById()` was failing.

**Solution:** Fetch token directly from `profiles` table using service role client.

```typescript
// ❌ OLD (doesn't work in background jobs)
const { data: { user } } = await supabase.auth.admin.getUserById(repo.user_id);
const token = user.identities?.find(...)?.identity_data?.provider_token;

// ✅ NEW (works in background jobs)
const { data: profile } = await supabase
  .from('profiles')
  .select('github_access_token')
  .eq('id', repo.user_id)
  .single();
const token = profile.github_access_token;
```

### 3. Explicit Job State Machine

**Progress Steps:**
- **10%** - Initializing
- **40%** - Fetching GitHub authentication
- **50%** - Validating GitHub token
- **60%** - Fetching repository contents
- **70-85%** - Generating documentation sections (incremental)
- **85%** - Finalizing output
- **100%** - Completed

Every step updates `generated_docs` table via `updateJob()`.

### 4. GitHub Token Validation

After retrieving token, validate it with a lightweight GitHub API call:

```typescript
const octokit = new Octokit({ auth: githubToken });
const { data: user } = await octokit.users.getAuthenticated();
```

If validation fails (401), fail immediately with clear error message.

### 5. Comprehensive Error Handling

**No Silent Failures:**
- All errors are caught and logged
- Job state is always updated to 'failed' on error
- Error messages are stored in `error_message` field
- Errors are re-thrown to ensure caller knows generation failed

**Error Flow:**
```typescript
try {
  // ... generation logic ...
} catch (error) {
  await updateJob(repositoryId, {
    status: 'failed',
    progress: 0,
    current_step: 'Failed',
    error_message: error.message
  });
  throw error; // Re-throw to ensure caller knows
}
```

### 6. Final Success Update

When generation completes:

```typescript
await updateJob(repositoryId, {
  status: 'completed',
  progress: 100,
  current_step: 'Completed',
  error_message: null
});
```

## Architecture

### Service Layer Structure

```
docGenerationService.ts (orchestrator)
  ├── Sets initial state (10%)
  ├── Calls auditDocGenerator
  └── Ensures final state (completed/failed)

auditDocGenerator.ts (pipeline)
  ├── Step 1: Fetch repository (10% → 40%)
  ├── Step 2: Fetch token (40% → 50%)
  ├── Step 3: Validate token (50% → 60%)
  ├── Step 4: Fetch repo contents (60% → 70%)
  ├── Step 5: Generate sections (70% → 85%)
  ├── Step 6: Save to database (85% → 100%)
  └── Step 7: Mark completed (100%)

jobStateManager.ts (state updates)
  └── updateJob() - Single function for all state updates
```

## Logging

All steps log clearly:

```
[GENERATION] Starting documentation generation for repository <id>
[GENERATION] Step 1: Fetching repository metadata...
[GENERATION] Step 2: Fetching GitHub token from profiles...
[GENERATION] Step 3: Validating GitHub token...
[GENERATION] Step 4: Fetching repository contents from GitHub...
[GENERATION] Step 5: Generating documentation sections...
[GENERATION] Step 6: Saving documentation to database...
[GENERATION] Documentation generation completed successfully
```

## Error Messages

Clear, actionable error messages:

- **Token missing:** "GitHub token not available. Please reconnect your GitHub account in Settings."
- **Token invalid:** "GitHub token is invalid or expired. Please reconnect your GitHub account."
- **Repository empty:** "Repository appears to be empty or inaccessible"
- **API error:** "GitHub API error: <specific error>"

## Testing Checklist

- [x] Token retrieved from profiles table (not auth session)
- [x] Token validated before use
- [x] Progress updates at each step
- [x] Errors caught and logged
- [x] Job state always updated (never stuck in 'generating')
- [x] Final state set correctly (completed or failed)
- [x] No silent failures
- [x] Clear logging at each step

## Benefits

1. **No Stuck Jobs:** Job state always updated, never stuck in 'generating'
2. **Clear Progress:** UI shows exact step and progress percentage
3. **Fast Failures:** Token validation fails immediately if invalid
4. **Debugging:** Comprehensive logging makes issues easy to trace
5. **Maintainability:** Centralized state management makes changes easy

## Migration Notes

- No database migration needed
- Backward compatible (old code still works)
- Can be deployed without downtime
- Existing jobs will continue with new code

## Future Enhancements

1. **Retry Logic:** Retry failed steps automatically
2. **Progress Persistence:** Save progress to survive restarts
3. **Cancellation:** Allow users to cancel in-progress jobs
4. **Notifications:** Notify users when generation completes/fails
