# How to Run DocDocs Project

This guide explains how to run both the frontend and backend.

## Prerequisites

- **Node.js** 18+ installed
- **npm** or **yarn** package manager
- **Git** (for repository analysis)

## Quick Start

### Option 1: Run Separately (Recommended for Development)

#### 1. Start Backend

```bash
cd backend
npm install
npm run dev
```

Backend runs on: `http://localhost:8000`

#### 2. Start Frontend (in a new terminal)

```bash
# From project root
npm install
npm run dev
```

Frontend runs on: `http://localhost:5173`

### Option 2: Use npm scripts (if configured)

From project root:
```bash
npm run dev:backend  # Start backend
npm run dev:frontend # Start frontend
```

## Detailed Setup

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run development server:**
   ```bash
   npm run dev
   ```
   
   Or build and run production:
   ```bash
   npm run build
   npm start
   ```

4. **Verify backend is running:**
   - Open: `http://localhost:8000`
   - Should see: `{"status":"ok","service":"DocDocs API",...}`
   - Health check: `http://localhost:8000/health`

### Frontend Setup

1. **Navigate to project root:**
   ```bash
   cd ..  # If you're in backend directory
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run development server:**
   ```bash
   npm run dev
   ```

4. **Open in browser:**
   - Frontend runs on: `http://localhost:5173`
   - Should see the DocDocs landing page

## Testing the API

### Test Backend Endpoints

```bash
# Health check
curl http://localhost:8000/health

# Analyze a repository (replace with your repo path)
curl -X POST http://localhost:8000/api/analyze \
  -H "Content-Type: application/json" \
  -d "{\"repoPath\": \"C:\\\\Users\\\\YourName\\\\your-repo\"}"

# Validate documentation
curl -X POST http://localhost:8000/api/validate-docs \
  -H "Content-Type: application/json" \
  -d "{\"repoPath\": \"C:\\\\Users\\\\YourName\\\\your-repo\"}"

# Generate documentation
curl -X POST http://localhost:8000/api/generate-docs \
  -H "Content-Type: application/json" \
  -d "{\"repoPath\": \"C:\\\\Users\\\\YourName\\\\your-repo\", \"format\": \"markdown\", \"runRules\": true}"
```

## Troubleshooting

### Backend Issues

**Port 8000 already in use:**
```bash
# Change port in backend/src/server.ts or use:
PORT=8001 npm run dev
```

**TypeScript errors:**
```bash
cd backend
npm run build  # Check for compilation errors
```

**Missing dependencies:**
```bash
cd backend
rm -rf node_modules package-lock.json
npm install
```

### Frontend Issues

**Port 5173 already in use:**
- Vite will automatically use the next available port
- Check terminal output for the actual port

**CORS errors:**
- Make sure backend is running on port 8000
- Check `backend/src/app.ts` for CORS configuration

**Module not found:**
```bash
rm -rf node_modules package-lock.json
npm install
```

## Development Workflow

1. **Start backend first:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Start frontend in another terminal:**
   ```bash
   npm run dev
   ```

3. **Make changes:**
   - Backend: Auto-reloads with `tsx watch`
   - Frontend: Hot module replacement with Vite

4. **Check output:**
   - Backend analysis: `backend/output/analysis.json`
   - Generated docs: `backend/output/documentation.md`

## Production Build

### Backend
```bash
cd backend
npm run build
npm start
```

### Frontend
```bash
npm run build
npm run preview  # Preview production build
```

## Environment Variables (Optional)

Create `.env` files if needed:

**Backend `.env`:**
```
PORT=8000
NODE_ENV=development
```

**Frontend `.env`:**
```
VITE_API_URL=http://localhost:8000
```

## Project Structure

```
DocForge/
├── backend/          # Node.js + Express backend
│   ├── src/
│   ├── output/      # Analysis output files
│   └── package.json
├── src/             # React frontend
│   ├── components/
│   └── App.tsx
├── package.json     # Frontend dependencies
└── README.md
```

## Next Steps

1. ✅ Backend running on port 8000
2. ✅ Frontend running on port 5173
3. Test API endpoints
4. Integrate frontend with backend API
5. Analyze your first repository!
