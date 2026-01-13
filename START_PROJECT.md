# 🚀 How to Start DocDocs Project

Complete guide to get the entire DocDocs application running.

## 📋 Prerequisites

- **Node.js 18+** installed ([Download](https://nodejs.org/))
- **npm** (comes with Node.js)
- **Supabase account** (for authentication & database)
- **OpenAI API key** (for documentation generation)
- **GitHub account** (for OAuth integration)

## 🔧 Step 1: Install Dependencies

From the project root (`DocForge/DocForge/`):

```bash
# Install all dependencies (frontend + backend)
npm run install:all
```

Or install separately:

```bash
# Frontend dependencies
npm install

# Backend dependencies
cd backend
npm install
cd ..
```

## 🔐 Step 2: Set Up Environment Variables

### Frontend Environment Variables

Create `.env` file in the **root** directory (`DocForge/DocForge/.env`):

```bash
VITE_SUPABASE_URL=https://afcgapmhwnxeposwbhdu.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_API_URL=http://localhost:8000
```

### Backend Environment Variables

Create `.env` file in the **backend** directory (`DocForge/DocForge/backend/.env`):

```bash
# Supabase Configuration
SUPABASE_URL=https://afcgapmhwnxeposwbhdu.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# OpenAI API (for AI documentation generation)
OPENAI_API_KEY=your-openai-api-key-here

# Optional: Personal GitHub token as fallback
GITHUB_TOKEN=your-github-personal-access-token-here
```

### How to Get These Values

1. **Supabase Keys:**
   - Go to: https://app.supabase.com/dashboard/project/afcgapmhwnxeposwbhdu
   - Click **Settings** → **API**
   - Copy:
     - **Project URL** → `SUPABASE_URL` / `VITE_SUPABASE_URL`
     - **anon public** key → `VITE_SUPABASE_ANON_KEY`
     - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` ⚠️ Keep secret!

2. **OpenAI API Key:**
   - Go to: https://platform.openai.com/api-keys
   - Sign up or log in
   - Click **Create new secret key**
   - Copy the key → `OPENAI_API_KEY`

3. **GitHub Token (Optional):**
   - Only needed as fallback if OAuth tokens aren't available
   - Go to: https://github.com/settings/tokens
   - Generate new token (classic) with `repo` scope

## 🎯 Step 3: Start the Application

You need **TWO terminal windows** running simultaneously:

### Terminal 1: Backend Server

```bash
cd backend
npm run dev
```

✅ Backend will start at: **http://localhost:8000**

You should see:
```
DocDocs API server running on http://localhost:8000
Health check: http://localhost:8000/health
```

### Terminal 2: Frontend Server

```bash
# From project root (DocForge/DocForge/)
npm run dev
```

✅ Frontend will start at: **http://localhost:5173**

You should see:
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

## ✅ Step 4: Verify Everything Works

### 1. Backend Health Check

Open in browser: **http://localhost:8000/health**

Should see:
```json
{"status":"healthy","service":"DocDocs API"}
```

### 2. Frontend Landing Page

Open in browser: **http://localhost:5173**

Should see:
- DocDocs landing page
- Navigation bar
- Hero section
- Sign up buttons

### 3. Test Authentication

1. Click "Get Started" or "Upload Documentation"
2. Sign up with email or GitHub
3. Should redirect to dashboard

## 🎨 Quick Commands Reference

```bash
# Install all dependencies
npm run install:all

# Start frontend only
npm run dev

# Start backend only
cd backend && npm run dev

# Build frontend for production
npm run build

# Build backend for production
npm run build:backend
```

## 🐛 Troubleshooting

### Backend won't start?

1. **Check Node.js version:**
   ```bash
   node --version  # Should be 18+
   ```

2. **Reinstall dependencies:**
   ```bash
   cd backend
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Check environment variables:**
   - Ensure `backend/.env` exists
   - Verify all required keys are set

4. **Port already in use?**
   - Change `PORT` in `backend/src/server.ts`
   - Or kill process using port 8000:
     ```bash
     # Windows
     netstat -ano | findstr :8000
     taskkill /PID <PID> /F
     
     # Mac/Linux
     lsof -ti:8000 | xargs kill
     ```

### Frontend won't start?

1. **Reinstall dependencies:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Check environment variables:**
   - Ensure `.env` file exists in root
   - Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set

3. **Port conflict?**
   - Vite will automatically use next available port
   - Or specify port: `npm run dev -- --port 3000`

### "Missing Supabase environment variables" error?

1. **Check `.env` file exists** in project root
2. **Restart the dev server** after creating/updating `.env`
3. **Verify variable names** start with `VITE_` for frontend

### Can't connect to Supabase?

1. **Check Supabase project is active**
2. **Verify API keys** are correct
3. **Check network connection**
4. **Verify RLS policies** are set up (see `SUPABASE_SETUP.md`)

## 📚 Next Steps

Once everything is running:

1. **Set up GitHub OAuth:**
   - See `GITHUB_OAUTH_QUICK_SETUP.md`

2. **Run database migrations:**
   - See `backend/DATABASE_MIGRATION_GITHUB.sql`
   - See `backend/DATABASE_MIGRATION_GENERATED_DOCS.sql`

3. **Test the full flow:**
   - Sign up → Connect GitHub → Select repository → Generate docs

## 🎉 You're Ready!

Your DocDocs application should now be running:
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:8000

Happy coding! 🚀
