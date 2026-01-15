# Debug AI Connection - Quick Fix Guide

## ✅ Fixes Applied

1. **Health endpoint is now public** (no auth required) - easier to test
2. **Added console logging** to frontend and backend for debugging
3. **Improved error handling** in health check

## 🔍 Quick Test Commands

### 1. Test Ollama Directly
```bash
curl http://127.0.0.1:11434/api/tags
```
**Expected:** JSON with model list

### 2. Test Backend Health Endpoint (No Auth Required)
```bash
curl http://localhost:8000/api/ai/health
```
**Expected:** `{"healthy":true,"models":["llama3.2:latest"],...}`

### 3. Check Backend is Running
```bash
curl http://localhost:8000/health
```
**Expected:** `{"status":"healthy","service":"DocDocs API"}`

## 🐛 Common Issues & Fixes

### Issue: "Checking AI..." Forever

**Cause:** Frontend can't reach backend or Ollama

**Fix Steps:**

1. **Verify backend is running:**
   ```bash
   cd backend
   npm run dev
   ```
   Look for: `✅ AI routes registered at /api/ai`

2. **Check browser console (F12):**
   - Look for `🔍 [AI] Checking health at: ...`
   - Look for `📡 [AI] Response status: ...`
   - Look for any error messages

3. **Verify API URL:**
   - Frontend uses: `http://localhost:8000` (from `VITE_API_URL` or default)
   - Backend runs on: `http://localhost:8000` (from `PORT` env or default)

4. **Test health endpoint directly:**
   ```bash
   curl http://localhost:8000/api/ai/health
   ```

### Issue: "Connection refused"

**Cause:** Backend not running or wrong port

**Fix:**
- Start backend: `cd backend && npm run dev`
- Check port in `backend/src/server.ts` (default: 8000)
- Verify `VITE_API_URL` in frontend matches backend port

### Issue: "401 Unauthorized"

**Cause:** Health endpoint was requiring auth (now fixed)

**Fix:** Health endpoint is now public. If you still see 401, restart backend.

### Issue: "Ollama service unavailable"

**Cause:** Ollama not running

**Fix:**
```bash
# On Windows, Ollama runs as service automatically
# Verify with:
curl http://127.0.0.1:11434/api/tags

# If that fails, start Ollama:
ollama serve
```

## 📊 Expected Console Output

### Backend Terminal:
```
✅ AI routes registered at /api/ai
DocDocs API server running on http://localhost:8000
[AI] Health check requested
[AI] Health check result: { isHealthy: true, modelCount: 1 }
GET /api/ai/health 200 45ms
```

### Browser Console (F12):
```
[AI] Starting health check...
🔍 [AI] Checking health at: http://localhost:8000/api/ai/health
📡 [AI] Response status: 200
✅ [AI] Health check response: {healthy: true, models: ["llama3.2:latest"], ...}
[AI] Health check result: {healthy: true, ...}
[AI] Health check complete. Healthy: true
```

## 🔧 Manual Testing

### Test 1: Backend Health (No Auth)
```bash
curl http://localhost:8000/api/ai/health
```

### Test 2: Backend Health (With Auth - Optional)
```bash
# Get token from browser (F12 → Application → Local Storage)
curl http://localhost:8000/api/ai/health \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test 3: Ollama Direct
```bash
curl http://127.0.0.1:11434/api/tags
```

## ✅ Success Indicators

When everything works:

1. **Backend terminal shows:**
   - `✅ AI routes registered at /api/ai`
   - `[AI] Health check requested` when endpoint is called

2. **Browser console shows:**
   - `✅ [AI] Health check response: {healthy: true, ...}`
   - No errors

3. **Frontend UI shows:**
   - Green "AI Ready" indicator (not "Checking AI...")
   - "AI Improve README" button is enabled

## 🚨 Still Not Working?

1. **Check backend logs** for errors
2. **Check browser console** (F12) for errors
3. **Verify Ollama is running:** `curl http://127.0.0.1:11434/api/tags`
4. **Verify backend is running:** `curl http://localhost:8000/health`
5. **Check CORS:** Make sure frontend origin is in CORS config
6. **Check port mismatch:** Backend (8000) vs Frontend API URL

## 📝 Environment Variables Checklist

**Backend `.env`:**
```env
PORT=8000
OLLAMA_URL=http://127.0.0.1:11434
OLLAMA_MODEL=llama3.2
```

**Frontend `.env`:**
```env
VITE_API_URL=http://localhost:8000
```

---

**Last Updated:** After fixing health endpoint auth requirement
