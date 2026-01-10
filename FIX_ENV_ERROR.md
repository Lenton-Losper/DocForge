# Fix: "Missing Supabase environment variables" Error

## ✅ Your .env file is correct!

The file exists and has the right content:
```
VITE_SUPABASE_URL=https://afcgapmhwnxeposwbhdu.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_NG8xGRokHTjxCQDbZGW9zw_kDtyyzbG
```

## 🔄 Solution: Restart Dev Server

**Vite only reads `.env` files when the server starts.** You need to restart it:

1. **Stop the current dev server:**
   - Press `Ctrl + C` in the terminal where `npm run dev` is running
   - Wait for it to fully stop

2. **Start it again:**
   ```bash
   npm run dev
   ```

3. **Refresh your browser:**
   - Hard refresh: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
   - Or close and reopen the browser tab

## 🔍 Verify It's Working

After restarting, check the browser console:
- The error should be gone
- You should see no Supabase-related errors
- Try clicking "Upload Documentation" - the sign-up modal should work

## ⚠️ If Still Not Working

1. **Check file location:**
   - `.env` must be in `DocForge/` folder (same level as `package.json`)
   - NOT in `DocForge/DocForge/` or `DocForge/src/`

2. **Check file format:**
   - No quotes around values
   - No spaces around `=`
   - Each variable on its own line
   - No trailing spaces

3. **Check variable names:**
   - Must start with `VITE_` (required for Vite)
   - Case-sensitive: `VITE_SUPABASE_URL` not `vite_supabase_url`

4. **Clear browser cache:**
   - Open DevTools (F12)
   - Right-click refresh button → "Empty Cache and Hard Reload"

## 📝 Correct .env Format

```env
VITE_SUPABASE_URL=https://afcgapmhwnxeposwbhdu.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_NG8xGRokHTjxCQDbZGW9zw_kDtyyzbG
```

No quotes, no spaces, exactly as shown above.
