# OpenAI API Key Environment Variable Fix

## Problem

The backend was showing the error:
> "AI documentation generation not configured. Please add OPENAI_API_KEY to backend.env"

Even though the `.env` file contained the key.

## Root Cause

The OpenAI client was being initialized at the **module level** in `auditDocGenerator.ts`, which runs when the module is imported. If `dotenv/config` wasn't loaded before the module was imported, `process.env.OPENAI_API_KEY` would be `undefined`.

## Solution

### 1. Centralized OpenAI Configuration

**File:** `backend/src/config/openai.ts` (NEW)

- Loads `dotenv/config` at the very top
- Validates that `OPENAI_API_KEY` exists
- Creates the OpenAI client in one place
- Logs helpful debug information
- Single source of truth for OpenAI client

### 2. Updated Imports

**Files Updated:**
- `backend/src/app.ts` - Added `import 'dotenv/config'` at top
- `backend/src/services/auditDocGenerator.ts` - Uses centralized config
- `backend/src/server.ts` - Already had `import 'dotenv/config'` ✅

### 3. Better Error Messages

The error message now includes:
- Clear path: `backend/.env` (not just `.env`)
- Instruction to restart server
- Helpful logging in console

## Verification Steps

### Step 1: Check .env File Location

Make sure your `.env` file is at:
```
backend/
  ├── .env          ✅ CORRECT
  ├── src/
  └── package.json
```

NOT at:
```
root/.env          ❌ WRONG
frontend/.env      ❌ WRONG
```

### Step 2: Verify .env Contents

Your `backend/.env` should contain:
```env
SUPABASE_URL=https://afcgapmhwnxeposwbhdu.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
OPENAI_API_KEY=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
```

### Step 3: Run Environment Checker

```bash
cd backend
npx tsx src/utils/checkEnv.ts
```

Expected output:
```
=== Environment Variable Check ===

Required Variables:
  SUPABASE_URL: ✅ https://afcg...
  SUPABASE_SERVICE_ROLE_KEY: ✅ eyJhbGciOi...
  OPENAI_API_KEY: ✅ sk-proj-...

✅ All required environment variables are present!
✅ OpenAI client should initialize correctly.
```

### Step 4: Restart Backend Server

**IMPORTANT:** After fixing the `.env` file, you MUST restart the backend server:

```bash
# Stop the current server (Ctrl+C)
# Then restart:
cd backend
npm run dev
```

Look for this in the console:
```
[OPENAI] Client initialized successfully
```

If you see:
```
[OPENAI] Client not initialized - OPENAI_API_KEY missing
```

Then the `.env` file is still not being loaded correctly.

## Common Issues

### Issue 1: .env in Wrong Location

**Symptom:** `checkEnv.ts` shows all variables as missing

**Fix:** Move `.env` to `backend/.env`

### Issue 2: Server Not Restarted

**Symptom:** Error persists even after fixing `.env`

**Fix:** Restart the backend server completely

### Issue 3: Typo in Variable Name

**Symptom:** Key exists but client still not initialized

**Fix:** Check exact spelling: `OPENAI_API_KEY` (not `OPEN_AI_KEY` or `OpenAI_API_KEY`)

### Issue 4: Extra Spaces or Quotes

**Symptom:** Key appears present but doesn't work

**Fix:** Remove quotes and spaces:
```env
# ❌ WRONG
OPENAI_API_KEY="sk-..."
OPENAI_API_KEY = sk-...

# ✅ CORRECT
OPENAI_API_KEY=sk-...
```

## Files Changed

1. `backend/src/config/openai.ts` (NEW) - Centralized OpenAI config
2. `backend/src/services/auditDocGenerator.ts` - Uses centralized config
3. `backend/src/app.ts` - Added dotenv import at top
4. `backend/src/utils/checkEnv.ts` (NEW) - Environment checker utility

## Testing

After restarting the server:

1. Try generating documentation for a repository
2. Check backend console for `[OPENAI] Client initialized successfully`
3. Documentation should generate instead of showing "not configured" message

## Next Steps

If the issue persists:

1. Run `npx tsx src/utils/checkEnv.ts` to verify env vars
2. Check backend console for `[OPENAI]` log messages
3. Verify `.env` file is in `backend/` directory
4. Ensure server was restarted after changes
