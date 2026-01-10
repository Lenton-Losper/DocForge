# Testing Guide - Frontend & Backend

## ✅ Step 1: Backend is Running

Your backend is already running and responding:
- **Backend URL:** http://localhost:8000
- **Health Check:** http://localhost:8000/health ✅
- **Status:** Healthy

## 🚀 Step 2: Start Frontend

Open a **NEW terminal window** and run:

```powershell
cd C:\Users\223125318\Desktop\DocForge\DocForge
npm run dev
```

The frontend will start on **http://localhost:5173** (Vite default port)

## 🧪 Step 3: Test the Connection

### Test 1: Open Frontend in Browser
1. Open your browser
2. Go to: **http://localhost:5173**
3. You should see the DocDocs landing page

### Test 2: Test Backend API from Browser
1. Open browser DevTools (F12)
2. Go to Console tab
3. Run this command:
```javascript
fetch('http://localhost:8000/health')
  .then(r => r.json())
  .then(console.log)
```
Should return: `{status: "healthy", service: "DocDocs API"}`

### Test 3: Test Authentication Flow
1. Click "Upload Documentation" or "Connect GitHub" button
2. Sign up modal should appear
3. Create an account
4. After signup, you should be redirected (or see success)

### Test 4: Test Protected API Endpoint
After signing in, test from browser console:
```javascript
// Get your session token
const { data: { session } } = await supabase.auth.getSession();

// Test authenticated endpoint
fetch('http://localhost:8000/api/documents', {
  headers: {
    'Authorization': `Bearer ${session.access_token}`
  }
})
  .then(r => r.json())
  .then(console.log)
```

Should return: `{documents: []}` (empty array if no documents yet)

## 🔍 Troubleshooting

### Frontend can't connect to backend?
- Check backend is running: `curl http://localhost:8000/health`
- Check CORS is enabled (already configured in backend)
- Check browser console for errors

### Authentication not working?
- Check `.env` file in frontend has `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Check Supabase project is active
- Check browser console for errors

### Port conflicts?
- Backend: Change `PORT=8000` in `backend/.env` to another port
- Frontend: Vite will auto-use next available port if 5173 is taken

## 📋 Quick Checklist

- [ ] Backend running on port 8000
- [ ] Frontend running on port 5173
- [ ] Can access http://localhost:5173
- [ ] Can see landing page
- [ ] Sign up modal appears
- [ ] Can create account
- [ ] Backend API responds to requests
