# Quick Environment Setup

## ⚠️ Error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY

If you see this error, you need to create a `.env` file in the `backend` directory.

## Quick Fix (2 minutes)

### Step 1: Get Your Supabase Keys

1. Go to: https://app.supabase.com/dashboard/project/afcgapmhwnxeposwbhdu/settings/api
2. Scroll to **Project API keys** section
3. Copy:
   - **Project URL** → Use for `SUPABASE_URL`
   - **service_role** key (the secret one) → Use for `SUPABASE_SERVICE_ROLE_KEY`

### Step 2: Create `.env` File

Create `backend/.env` file with:

```env
# Supabase Configuration
SUPABASE_URL=https://afcgapmhwnxeposwbhdu.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sb_secret_your-actual-key-here

# Ollama Configuration (for AI features)
OLLAMA_URL=http://127.0.0.1:11434
OLLAMA_MODEL=llama3.2

# Server Configuration
PORT=8000
```

### Step 3: Restart Server

```bash
cd backend
python -m uvicorn main:app --reload --port 8000
```

## ✅ Success

You should see:
```
✅ AI routes registered at /api/ai
INFO:     Uvicorn running on http://127.0.0.1:8000
```

## 📝 Notes

- The `.env` file is already in `.gitignore` (won't be committed)
- Never share your `SUPABASE_SERVICE_ROLE_KEY` publicly
- The service_role key has admin access - keep it secret!

## 🔍 Still Having Issues?

1. **Check file location:** Make sure `.env` is in `backend/` directory (same level as `main.py`)
2. **Check file name:** Must be exactly `.env` (not `.env.txt` or `env`)
3. **Check format:** No spaces around `=` sign
4. **Restart server:** Environment variables are loaded at startup

---

**See `ENV_SETUP_COMPLETE.md` for detailed instructions.**
