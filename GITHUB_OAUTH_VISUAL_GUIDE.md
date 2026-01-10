# GitHub OAuth Setup - Visual Step-by-Step

## 🎯 Goal
Enable GitHub OAuth so DocDocs can access your GitHub repositories.

---

## 📸 Step 1: Create GitHub OAuth App

### 1.1 Go to GitHub Developer Settings
**URL:** https://github.com/settings/developers

**Path:** 
- Click your profile picture (top right)
- Click **Settings**
- Scroll down → Click **Developer settings** (left sidebar)
- Click **OAuth Apps**

### 1.2 Create New OAuth App
- Click green button: **"New OAuth App"**

### 1.3 Fill in the Form

**Application name:**
```
DocDocs
```

**Homepage URL:**
```
http://localhost:5173
```

**Authorization callback URL:**
```
https://afcgapmhwnxeposwbhdu.supabase.co/auth/v1/callback
```
⚠️ **Copy this EXACTLY** - it's your Supabase project callback URL

### 1.4 Register and Copy Credentials
- Click **"Register application"**
- You'll see your **Client ID** (copy it)
- Click **"Generate a new client secret"** if needed
- Copy the **Client Secret** (you can only see it once!)

---

## 🔧 Step 2: Enable GitHub in Supabase

### 2.1 Go to Supabase Dashboard
**URL:** https://app.supabase.com/dashboard/project/afcgapmhwnxeposwbhdu

### 2.2 Navigate to Authentication Providers
- Click **"Authentication"** (left sidebar)
- Click **"Providers"** tab (top of page)

### 2.3 Find and Enable GitHub
- Scroll down to find **"GitHub"** in the provider list
- Click on **"GitHub"** to expand it
- Toggle **"Enable GitHub provider"** to **ON** (green)

### 2.4 Enter Credentials
- **Client ID (for OAuth App):** Paste your GitHub Client ID
- **Client Secret:** Paste your GitHub Client Secret
- Click **"Save"** button

---

## 🔗 Step 3: Configure Redirect URLs

### 3.1 Go to URL Configuration
- Still in Supabase Dashboard
- Click **"URL Configuration"** tab (next to Providers)

### 3.2 Set Site URL
- **Site URL:** `http://localhost:5173`

### 3.3 Add Redirect URLs
Click **"Add URL"** and add each of these (one at a time):
1. `http://localhost:5173/settings?github=connected`
2. `http://localhost:5173/dashboard`
3. `http://localhost:5173`

### 3.4 Save
- Click **"Save"** button

---

## ✅ Step 4: Test Connection

### 4.1 Go to Settings Page
- Visit: http://localhost:5173/settings
- You should see **"Connect GitHub Account"** button

### 4.2 Click Connect
- Click the button
- You should be redirected to GitHub authorization page

### 4.3 Authorize
- Click **"Authorize DocDocs"** (or your app name)
- GitHub will redirect you back

### 4.4 Verify Success
- You should be back at `/settings`
- Should see: **"Connected to GitHub"** with your username ✅

---

## 🐛 Common Issues & Fixes

### Issue: "Unsupported provider: provider is not enabled"
**Fix:**
- Go back to Supabase → Authentication → Providers
- Make sure GitHub toggle is **ON** (green)
- Verify Client ID and Secret are entered correctly
- Click **"Save"** again

### Issue: "Redirect URI mismatch"
**Fix:**
- Check GitHub OAuth App callback URL is exactly:
  `https://afcgapmhwnxeposwbhdu.supabase.co/auth/v1/callback`
- Check Supabase redirect URLs include your localhost URLs
- Make sure there are no trailing slashes

### Issue: "Invalid client"
**Fix:**
- Double-check Client ID and Secret are correct
- Make sure there are no extra spaces when copying
- Try generating a new Client Secret in GitHub

### Issue: Can't see GitHub in Supabase Providers
**Fix:**
- Refresh the Supabase dashboard page
- Make sure you're in the correct project
- Check you have admin/owner access

---

## 📋 Quick Checklist

Before testing, verify:

- [ ] GitHub OAuth App created
- [ ] Callback URL set correctly in GitHub
- [ ] Client ID copied
- [ ] Client Secret copied
- [ ] GitHub provider enabled in Supabase
- [ ] Client ID pasted in Supabase
- [ ] Client Secret pasted in Supabase
- [ ] "Save" clicked in Supabase
- [ ] Site URL set in Supabase
- [ ] Redirect URLs added in Supabase
- [ ] Frontend running on localhost:5173

---

## 🎉 Success Indicators

When it's working, you'll see:
- ✅ GitHub authorization page appears when clicking "Connect"
- ✅ After authorizing, you're redirected back to Settings
- ✅ Settings shows "Connected to GitHub" with username
- ✅ Dashboard "Connect Repository" button works
- ✅ Repository picker loads your GitHub repos

---

**Need Help?** Check the error message in browser console (F12) for specific details.
