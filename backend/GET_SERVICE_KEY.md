# How to Get Your Service Role Key

## Quick Steps

1. **Go to Supabase Dashboard:**
   https://app.supabase.com/dashboard/project/afcgapmhwnxeposwbhdu/settings/api

2. **Scroll down to "Project API keys" section**

3. **Find the "service_role" key** (it's the SECRET one, not publishable)

4. **Copy the entire key** - it starts with `sb_secret_...`

5. **Open `backend/.env` file** and replace `your-service-role-key-here` with your actual key

## Your .env file should look like:

```env
SUPABASE_URL=https://afcgapmhwnxeposwbhdu.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sb_secret_your-service-role-key-here
PORT=8000
```

⚠️ **Important:** 
- The service_role key has ADMIN ACCESS
- Never commit it to git (it's already in .gitignore)
- Never use it in frontend code
- Only use it in backend/server code

## After Adding the Key

1. Save the `.env` file
2. Restart your backend server:
   ```bash
   npm run dev
   ```

The error should be gone!
