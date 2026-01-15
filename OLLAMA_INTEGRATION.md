# Ollama Integration Guide

## ✅ Integration Complete

Ollama has been successfully integrated into DocForge! The following features are now available:

### Backend Features
- ✅ Ollama service with singleton pattern
- ✅ 7 AI endpoints (improve-readme, generate-description, generate-setup, generate-api-docs, generate-diagram, analyze-quality, health)
- ✅ Health checking with caching
- ✅ Error handling and graceful degradation
- ✅ JWT authentication on all routes

### Frontend Features
- ✅ AI API client with authentication
- ✅ Ollama status indicator in ProjectDetail page
- ✅ "AI Improve README" button
- ✅ "Generate Diagram" button
- ✅ Offline warning banner
- ✅ Improved README modal with copy/download

## 🚀 Setup Instructions

### 1. Environment Variables

**Backend** (`backend/.env`):
```env
# Ollama Configuration
OLLAMA_URL=http://127.0.0.1:11434
OLLAMA_MODEL=llama3.2
```

**Frontend** (`frontend/.env` or `.env`):
```env
VITE_API_URL=http://localhost:8000
```

### 2. Verify Ollama is Running

On Windows, Ollama runs as a background service. Verify it's running:

```bash
curl http://127.0.0.1:11434/api/tags
```

If you get a JSON response with models, Ollama is running!

### 3. Start the Application

**Backend:**
```bash
cd backend
npm run dev
```

**Frontend:**
```bash
npm run dev
```

## 📡 API Endpoints

All endpoints require authentication (JWT token in Authorization header).

### Health Check
```
GET /api/ai/health
```

### Improve README
```
POST /api/ai/improve-readme
Body: { readme: string, projectInfo: object }
```

### Generate Description
```
POST /api/ai/generate-description
Body: { projectInfo: object }
```

### Generate Setup Guide
```
POST /api/ai/generate-setup
Body: { projectInfo: object }
```

### Generate API Docs
```
POST /api/ai/generate-api-docs
Body: { endpoints: array }
```

### Generate Diagram
```
POST /api/ai/generate-diagram
Body: { type: 'architecture' | 'dependency' | 'flow', data: object }
```

### Analyze Quality
```
POST /api/ai/analyze-quality
Body: { codeStructure: object }
```

## 🧪 Testing

### Manual Backend Test

```bash
# Health check (replace YOUR_JWT_TOKEN)
curl http://localhost:8000/api/ai/health \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Improve README
curl -X POST http://localhost:8000/api/ai/improve-readme \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "readme": "# Test Project\nA simple app.",
    "projectInfo": {
      "name": "test-project",
      "languages": ["TypeScript"],
      "dependencies": 10,
      "directories": ["src/"],
      "version": "1.0.0"
    }
  }'
```

### Frontend Testing

1. Navigate to a project detail page
2. Check that AI status indicator shows "AI Ready" (green) or "AI Offline" (red)
3. Click "AI Improve README" button
4. Wait for improvement (2-5 seconds)
5. View improved content in modal
6. Test copy/download functionality

## 🐛 Troubleshooting

### Issue: "Ollama service unavailable"
**Solution**: Ollama is not running. On Windows, it should run automatically. If not:
- Check Windows Services for "Ollama"
- Or run: `ollama serve` in terminal

### Issue: "Connection refused"
**Solution**: 
- Verify Ollama URL in `.env` is correct: `http://127.0.0.1:11434`
- Check if Ollama is running: `curl http://127.0.0.1:11434/api/tags`

### Issue: Slow responses
**Solution**: 
- First generation is slower (model loading)
- Subsequent requests are faster
- Consider using smaller model: `ollama pull phi3` and update `OLLAMA_MODEL=phi3`

### Issue: Out of memory
**Solution**: 
- llama3.2 uses ~2GB RAM
- Close other applications
- Or use smaller model (phi3 uses ~1.5GB)

## 📝 Files Created/Modified

### Backend
- `backend/src/services/ollama.service.ts` - Ollama service
- `backend/src/controllers/ai.controller.ts` - AI controller
- `backend/src/routes/ai.routes.ts` - AI routes
- `backend/src/app.ts` - Registered AI routes
- `backend/package.json` - Added axios dependency

### Frontend
- `src/lib/aiApi.ts` - AI API client
- `src/pages/ProjectDetail.tsx` - Added AI features

## 🎯 Next Steps (Optional Enhancements)

1. **Mermaid Rendering**: Install `mermaid` package and create component to render diagrams
2. **Comparison View**: Create side-by-side comparison component for original vs improved README
3. **Batch Operations**: Allow improving multiple READMEs at once
4. **Request Caching**: Cache AI responses to reduce load
5. **Queue System**: Add request queueing for high traffic

## 📚 Documentation

- [Ollama Documentation](https://ollama.com/docs)
- [Ollama API Reference](https://github.com/ollama/ollama/blob/main/docs/api.md)

---

**Status**: ✅ Integration Complete
**Last Updated**: January 2025
