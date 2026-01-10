# Quick GitHub OAuth Setup - Step by Step

## Error You're Seeing
```
{"code":400,"error_code":"validation_failed", "msg": "Unsupported provider: provider is not enabled"}
```

This means GitHub OAuth is not enabled in Supabase. Follow these steps:

---

## Step 1: Create GitHub OAuth App (5 minutes)

1. **Go to GitHub Developer Settings:**
   - Visit: https://github.com/settings/developers
   - Or: GitHub → Your Profile → Settings → Developer settings → OAuth Apps

2. **Click "New OAuth App"**

3. **Fill in the form:**
   - **Application name:** `DocDocs` (or any name you want)
   - **Homepage URL:** `http://localhost:5173`
   - **Authorization callback URL:** `https://afcgapmhwnxeposwbhdu.supabase.co/auth/v1/callback`
     - ⚠️ **IMPORTANT:** This must be EXACTLY this URL (your Supabase project URL + `/auth/v1/callback`)

4. **Click "Register application"**

5. **Copy your credentials:**
   - **Client ID** (you'll see it immediately)
   - **Client Secret** (click "Generate a new client secret" if needed, then copy it)
   - ⚠️ **Save these - you'll need them in Step 2**

---

## Step 2: Enable GitHub in Supabase (3 minutes)

1. **Go to Supabase Dashboard:**
   - Visit: https://app.supabase.com/dashboard/project/afcgapmhwnxeposwbhdu

2. **Navigate to Authentication:**
   - Click **"Authentication"** in the left sidebar
   - Click **"Providers"** tab

3. **Find GitHub:**
   - Scroll down to find **"GitHub"** in the list
   - Click on it to expand

4. **Enable and Configure:**
   - Toggle **"Enable GitHub provider"** to ON
   - Paste your **Client ID** from Step 1
   - Paste your **Client Secret** from Step 1
   - Click **"Save"**

---

## Step 3: Configure Redirect URLs (2 minutes)

1. **Still in Supabase Dashboard:**
   - Go to **Authentication** → **URL Configuration**

2. **Set Site URL:**
   - **Site URL:** `http://localhost:5173`

3. **Add Redirect URLs:**
   - Click **"Add URL"** and add:
     - `http://localhost:5173/settings?github=connected`
     - `http://localhost:5173/dashboard`
     - `http://localhost:5173`

4. **Click "Save"**

---

## Step 4: Test It! (1 minute)

1. **Go to your app:**
   - Visit: http://localhost:5173/settings

2. **Click "Connect GitHub Account"**

3. **You should be redirected to GitHub:**
   - Authorize the app
   - You'll be redirected back to Settings
   - Should show "Connected to GitHub" ✅

---

## Troubleshooting

### Still getting "provider is not enabled"?
- ✅ Check that GitHub is toggled ON in Supabase
- ✅ Verify Client ID and Secret are correct (no extra spaces)
- ✅ Make sure you clicked "Save" in Supabase

### Redirect URL mismatch?
- ✅ Callback URL in GitHub OAuth App must be: `https://afcgapmhwnxeposwbhdu.supabase.co/auth/v1/callback`
- ✅ Redirect URLs in Supabase must include your localhost URLs

### Can't find GitHub in Supabase?
- Make sure you're in the right project
- Try refreshing the page
- Check that you have admin access to the project

---

## Visual Guide

### GitHub OAuth App Settings:
```
Application name: DocDocs
Homepage URL: http://localhost:5173
Authorization callback URL: https://afcgapmhwnxeposwbhdu.supabase.co/auth/v1/callback
```

### Supabase Provider Settings:
```
✅ Enable GitHub provider: ON
Client ID: [paste from GitHub]
Client Secret: [paste from GitHub]
```

### Supabase URL Configuration:
```
Site URL: http://localhost:5173
Redirect URLs:
  - http://localhost:5173/settings?github=connected
  - http://localhost:5173/dashboard
  - http://localhost:5173
```

---

**Total Time: ~10 minutes**

After completing these steps, GitHub OAuth will work and you can connect repositories!
