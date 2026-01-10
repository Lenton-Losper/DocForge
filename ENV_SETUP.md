# Environment Variables Setup

## ✅ Your .env file has been created!

Your Supabase credentials have been added to `.env`:

```env
VITE_SUPABASE_URL=https://afcgapmhwnxeposwbhdu.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_NG8xGRokHTjxCQDbZGW9zw_kDtyyzbG
```

## ⚠️ Important Note About Keys

The key format you provided (`sb_publishable_...`) is unusual. Standard Supabase anon keys typically:
- Start with `eyJ` (JWT format)
- Are found in **Settings → API → Project API keys → anon/public**

### To Verify Your Anon Key:

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project: "Lenton-Losper's Project"
3. Navigate to **Settings** → **API** (not JWT Keys)
4. Look for **Project API keys** section
5. Copy the **anon/public** key (should start with `eyJ...`)

### If Your Key Format is Different:

If Supabase has updated their key format and `sb_publishable_...` is correct:
- The current `.env` should work
- Test authentication to confirm

If authentication fails:
- Replace `VITE_SUPABASE_ANON_KEY` with the key from Settings → API
- The key should be the **anon/public** key, NOT the service_role key

## 🔒 Secret Key Security

**DO NOT** add the secret key (`sb_secret_...`) to your `.env` file!

- Secret keys are for **backend/server-side only**
- Never expose them in frontend code
- They have admin privileges and can bypass Row Level Security

## 🧪 Testing the Connection

1. **Restart your dev server** (required for .env changes):
   ```bash
   # Stop the server (Ctrl+C)
   npm run dev
   ```

2. **Test authentication**:
   - Click "Upload Documentation" or "Connect GitHub"
   - Try to sign up with a test email
   - Check browser console for any errors

3. **Common Errors**:
   - "Missing Supabase environment variables" → Check `.env` file exists
   - "Invalid API key" → Get the correct anon key from Settings → API
   - "Network error" → Check project URL is correct

## 📍 Where to Find Correct Keys

**Correct Location:**
- Settings → **API** → Project API keys → **anon/public**

**NOT:**
- ❌ Settings → JWT Keys (these are for JWT signing, not API access)
- ❌ Settings → API → service_role (this is secret, not for frontend)

## ✅ Next Steps

1. Verify the anon key format (should start with `eyJ`)
2. Update `.env` if needed
3. Restart dev server
4. Test sign-up functionality

If you need help finding the correct key, let me know!
