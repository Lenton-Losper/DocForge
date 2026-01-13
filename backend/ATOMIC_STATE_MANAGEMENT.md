# Atomic State Management Implementation

## Overview

This document describes the implementation of robust job state handling that prevents stuck "generating" states and ensures guaranteed state cleanup.

## Problem Solved

**Before:** Documentation generation could get permanently stuck in "generating" state if:
- Backend crashed during generation
- Exception occurred without proper cleanup
- Network failure during state update

**After:** 
- ✅ Atomic state updates with guaranteed cleanup
- ✅ Time-based lock (5 minutes) prevents permanent deadlocks
- ✅ Frontend button locking prevents spam clicks
- ✅ Accurate UI state mapping

## Database Changes

### Migration: `DATABASE_MIGRATION_PROGRESS_TRACKING.sql`

Added `generation_started_at` field:
```sql
ADD COLUMN IF NOT EXISTS generation_started_at TIMESTAMP WITH TIME ZONE;
```

This timestamp is used for time-based lock checking.

## Backend Implementation

### 1. Atomic State Updates (`docGenerationService.ts`)

**Key Principle:** Status = "generating" will NEVER survive an exception.

```typescript
export async function generateDocsForRepository(repositoryId: string) {
  const startedAt = new Date().toISOString();
  
  try {
    // ATOMIC: Set generating state BEFORE starting
    await supabase.from('generated_docs').update({
      status: 'generating',
      progress: 0,
      generation_started_at: startedAt,
      error_message: null
    }).eq('repository_id', repositoryId);

    // ... generation logic with progress updates ...

    // ATOMIC: Mark completed on success
    await supabase.from('generated_docs').update({
      status: 'completed',
      progress: 100,
      error_message: null
    }).eq('repository_id', repositoryId);
    
  } catch (error) {
    // ATOMIC: Guaranteed cleanup on failure
    await supabase.from('generated_docs').update({
      status: 'failed',
      progress: 0,
      error_message: error.message
    }).eq('repository_id', repositoryId);
    throw error;
  }
}
```

### 2. Progress Updates

Progress milestones:
- **10%** - Fetching repository (set in `docGenerationService`)
- **30%** - Fetching repository metadata
- **40%** - Fetching GitHub authentication
- **50%** - Analyzing codebase structure
- **60%** - Generating documentation sections
- **60-90%** - Incremental per section
- **95%** - Finalizing output
- **100%** - Completed

### 3. Time-Based Lock (`generateDocs.route.ts`)

**Before:** Naive check - if status === "generating", block forever.

**After:** Time-based check - only block if generation started < 5 minutes ago.

```typescript
export async function isGenerationInProgress(repositoryId: string): Promise<boolean> {
  const { data } = await supabase
    .from('generated_docs')
    .select('status, generation_started_at')
    .eq('repository_id', repositoryId)
    .single();

  if (data?.status !== 'generating') {
    return false;
  }

  if (data.generation_started_at) {
    const minutesElapsed = (Date.now() - new Date(data.generation_started_at).getTime()) / (1000 * 60);
    return minutesElapsed < 5; // Only block if < 5 minutes
  }

  return false; // No timestamp = stale, allow regeneration
}
```

**Benefits:**
- Stale jobs auto-recover after 5 minutes
- No permanent deadlocks
- User can retry after timeout

## Frontend Implementation

### 1. Button Locking (`ProjectDetail.tsx`)

**Local State:**
```typescript
const [isRegenerating, setIsRegenerating] = useState(false);
```

**Button Disabled When:**
- `isRegenerating === true` (local lock)
- `docsStatus === 'generating'` (backend status)

**Re-enabled When:**
- Status becomes `'completed'` or `'failed'`
- Error occurs during request

### 2. Accurate State Mapping

**Backend Status → Frontend Status:**
```
generating  → 'generating'  (Show progress UI)
completed   → 'complete'    (Show docs)
failed      → 'failed'      (Show error + retry)
idle        → 'not_started' (Show regenerate button)
```

**Never show "Generation failed" when status is "generating"**

### 3. Progress UI

Shows:
- Progress bar (0-100%)
- Current step description
- Percentage indicator

Updates automatically via polling (every 5 seconds).

## State Flow

```
User clicks "Regenerate"
  ↓
setIsRegenerating(true)  // Lock button immediately
  ↓
POST /api/generate-docs
  ↓
Backend: Check time-based lock
  ↓
If locked (< 5 min): Return 409 Conflict
If not locked: Start generation
  ↓
Backend: Set status = "generating" + generation_started_at
  ↓
Generation runs with progress updates
  ↓
On Success: status = "completed", progress = 100
On Failure: status = "failed", error_message = "..."
  ↓
Frontend: Polling detects status change
  ↓
setIsRegenerating(false)  // Unlock button
```

## Error Handling

### Backend Crash During Generation

1. Exception caught in `generateDocsForRepository` catch block
2. State updated to `'failed'` with error message
3. Frontend detects `'failed'` status
4. Button unlocked, user can retry

### Network Failure

1. Frontend request fails
2. `setIsRegenerating(false)` in catch block
3. User can retry immediately
4. Backend time-based lock prevents duplicate jobs

### Stale Job (> 5 minutes)

1. `isGenerationInProgress` returns `false` (timestamp > 5 min)
2. New generation allowed
3. Old job state overwritten

## Testing Checklist

- [ ] Generation completes successfully → Status = "completed"
- [ ] Generation fails → Status = "failed", error message stored
- [ ] Backend crash → Status = "failed" (guaranteed cleanup)
- [ ] Duplicate request within 5 min → 409 Conflict
- [ ] Duplicate request after 5 min → Allowed (stale job recovery)
- [ ] Button disabled during generation
- [ ] Button re-enabled on completion/failure
- [ ] Progress bar updates during generation
- [ ] UI shows correct state (never "failed" when "generating")

## Migration Required

Run the updated migration:
```sql
-- Execute: DATABASE_MIGRATION_PROGRESS_TRACKING.sql
-- This adds generation_started_at column
```

## Summary

✅ **No stuck "generating" state** - Guaranteed cleanup in catch block
✅ **Time-based lock** - Auto-recovery after 5 minutes
✅ **Button spam prevention** - Local + backend state checks
✅ **Progress tracking** - Real-time updates at milestones
✅ **Accurate UI state** - Correct mapping from backend to frontend
