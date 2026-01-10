# Quick Start Guide

## 🚀 Run Everything

### Step 1: Install All Dependencies

```bash
# From project root
npm run install:all
```

Or manually:
```bash
npm install              # Frontend dependencies
cd backend && npm install # Backend dependencies
```

### Step 2: Start Backend

```bash
cd backend
npm run dev
```

✅ Backend running at `http://localhost:8000`

### Step 3: Start Frontend (New Terminal)

```bash
# From project root
npm run dev
```

✅ Frontend running at `http://localhost:5173`

## 🧪 Test It Works

1. **Backend Health Check:**
   - Open: http://localhost:8000/health
   - Should see: `{"status":"healthy","service":"DocDocs API"}`

2. **Frontend:**
   - Open: http://localhost:5173
   - Should see: DocDocs landing page

3. **Test API:**
   ```bash
   curl http://localhost:8000/health
   ```

## 📁 Output Files

After running analysis:
- `backend/output/analysis.json` - Analysis results
- `backend/output/documentation.md` - Generated docs

## 🛠️ Troubleshooting

**Backend won't start?**
```bash
cd backend
npm install
npm run dev
```

**Frontend won't start?**
```bash
npm install
npm run dev
```

**Port conflicts?**
- Backend: Change `PORT` in `backend/src/server.ts`
- Frontend: Vite auto-finds next available port

## 📚 More Info

See `RUN.md` for detailed instructions.
