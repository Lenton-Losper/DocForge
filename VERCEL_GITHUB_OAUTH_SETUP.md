# Fix GitHub OAuth for Vercel Deployment

## Problem
GitHub OAuth redirects to `localhost:3000` instead of your Vercel domain, causing connection refused errors.

## Solution
You need to add your Vercel domain to Supabase's allowed redirect URLs.

---

## Step 1: Get Your Vercel Domain

Your Vercel deployment URL should look like:
- `https://docforge-xxxxx.vercel.app` (preview)
- `https://docforge.vercel.app` (production)
- Or your custom domain if configured

**Find it in:**
- Vercel Dashboard → Your Project → Deployments → Click on a deployment → Copy the URL

---

## Step 2: Update Supabase Redirect URLs

1. **Go to Supabase Dashboard:**
   - Visit: https://app.supabase.com
   - Select your project

2. **Navigate to Authentication Settings:**
   - Click **"Authentication"** (left sidebar)
   - Click **"URL Configuration"** tab

3. **Update Site URL:**
   - **Site URL:** Change from `http://localhost:5173` to your Vercel production URL
   - Example: `https://docforge.vercel.app`

4. **Add Redirect URLs:**
   - Click **"Add URL"** button
   - Add each of these URLs (one at a time):
     ```
     https://your-vercel-domain.vercel.app/dashboard
     https://your-vercel-domain.vercel.app/settings?github=connected
     https://your-vercel-domain.vercel.app
     ```
   - **Keep the localhost URLs too** (for local development):
     ```
     http://localhost:5173/dashboard
     http://localhost:5173/settings?github=connected
     http://localhost:5173
     ```

5. **Click "Save"**

---

## Step 3: (Optional) Update GitHub OAuth App Homepage

1. **Go to GitHub Developer Settings:**
   - Visit: https://github.com/settings/developers
   - Click on your OAuth App (e.g., "DocDocs")

2. **Update Homepage URL:**
   - **Homepage URL:** Change from `http://localhost:5173` to your Vercel URL
   - Example: `https://docforge.vercel.app`
   - ⚠️ **Keep the Authorization callback URL unchanged:**
     ```
     https://afcgapmhwnxeposwbhdu.supabase.co/auth/v1/callback
     ```
     (This should NOT change - it's your Supabase callback URL)

3. **Click "Update application"**

---

## Step 4: Test

1. **Visit your Vercel deployment:**
   - Go to: `https://your-vercel-domain.vercel.app`

2. **Try GitHub Login:**
   - Click "Sign in with GitHub" or "Connect GitHub"
   - You should be redirected to GitHub
   - After authorizing, you should be redirected back to your Vercel domain (not localhost)

---

## Quick Checklist

- [ ] Supabase Site URL updated to Vercel domain
- [ ] Supabase Redirect URLs include:
  - [ ] `https://your-vercel-domain.vercel.app/dashboard`
  - [ ] `https://your-vercel-domain.vercel.app/settings?github=connected`
  - [ ] `https://your-vercel-domain.vercel.app`
  - [ ] Localhost URLs (for development)
- [ ] GitHub OAuth App Homepage URL updated (optional)
- [ ] GitHub OAuth App Callback URL unchanged (must stay as Supabase callback)
- [ ] Tested login on Vercel deployment

---

## Environment Variables (If Needed)

If you're using environment variables for the redirect URL, make sure they're set in Vercel:

1. **Go to Vercel Dashboard:**
   - Your Project → Settings → Environment Variables

2. **Add/Update:**
   - `VITE_SUPABASE_URL` - Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` - Your Supabase anon key

3. **Redeploy** after adding environment variables

---

## Common Issues

### Still redirecting to localhost?
- ✅ Check that Supabase redirect URLs include your Vercel domain
- ✅ Clear browser cache and cookies
- ✅ Make sure you're testing on the actual Vercel URL, not localhost

### "Redirect URI mismatch" error?
- ✅ Verify the redirect URLs in Supabase match exactly (no trailing slashes)
- ✅ Check that `window.location.origin` in your code resolves to the Vercel domain

### Works locally but not on Vercel?
- ✅ Supabase redirect URLs must include BOTH localhost AND Vercel domains
- ✅ Environment variables must be set in Vercel dashboard

---

## Notes

- The **Authorization callback URL** in GitHub OAuth App should ALWAYS be your Supabase callback URL (doesn't change)
- The **redirect URLs in Supabase** are where users land AFTER authentication (these need your Vercel domain)
- You can have multiple redirect URLs in Supabase (for both localhost and production)
