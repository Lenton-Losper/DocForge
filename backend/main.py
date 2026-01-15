"""FastAPI application entry point."""
from dotenv import load_dotenv
import os

# Load environment FIRST
load_dotenv()

print("=" * 80)
print("[STARTUP] DocDocs API Starting...")
print(f"[STARTUP] OLLAMA_URL: {os.getenv('OLLAMA_URL', 'NOT SET')}")
print(f"[STARTUP] OLLAMA_MODEL: {os.getenv('OLLAMA_MODEL', 'NOT SET')}")
print("=" * 80)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.analyze import router as analyze_router
from api.suggest_fixes import router as suggest_fixes_router
from api.auth import router as auth_router
from api.projects import router as projects_router
from api.github import router as github_router

# Import Account router
try:
    from api.account import router as account_router
    print("[STARTUP] [OK] Account router imported successfully")
except Exception as e:
    print(f"[STARTUP] [ERROR] Failed to import Account router: {e}")
    import traceback
    traceback.print_exc()
    raise

# Import AI router with error handling
try:
    from api.ai import router as ai_router
    print("[STARTUP] [OK] AI router imported successfully")
except Exception as e:
    print(f"[STARTUP] [ERROR] Failed to import AI router: {e}")
    import traceback
    traceback.print_exc()
    raise

# Import Settings router
try:
    from api.settings import router as settings_router
    print("[STARTUP] [OK] Settings router imported successfully")
except Exception as e:
    print(f"[STARTUP] [ERROR] Failed to import Settings router: {e}")
    import traceback
    traceback.print_exc()
    raise

app = FastAPI(
    title="DocDocs API",
    description="AI-powered documentation linting service",
    version="1.0.0"
)

# CORS configuration for frontend integration
# Allow multiple development ports since Vite randomly assigns ports
ALLOWED_ORIGINS = [
    "http://localhost:3000",   # React default
    "http://localhost:5173",   # Vite default
    "http://localhost:5174",   # Vite alternative
    "http://localhost:5175",   # Vite alternative
    "http://localhost:5176",   # Vite alternative
    "http://localhost:8080",   # Common alternative
    "http://127.0.0.1:3000",   # Localhost alternative
    "http://127.0.0.1:5173",   # Localhost alternative
    "http://127.0.0.1:5174",   # Localhost alternative
    "http://127.0.0.1:5175",   # Localhost alternative
    "http://127.0.0.1:5176",   # Localhost alternative
]

print("[CORS] Development mode - allowing multiple origins")
print(f"[CORS] Allowed origins: {', '.join(ALLOWED_ORIGINS)}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

print("[STARTUP] [OK] CORS middleware configured")

# Register API routes
app.include_router(analyze_router, prefix="/api", tags=["analysis"])
app.include_router(suggest_fixes_router, prefix="/api", tags=["ai"])
app.include_router(auth_router, prefix="/api", tags=["auth"])
app.include_router(projects_router, prefix="/api", tags=["projects"])
app.include_router(github_router, prefix="/api", tags=["github"])
app.include_router(account_router)  # Account routes already have /api/account prefix
app.include_router(ai_router, tags=["ai"])  # AI routes already have /api/ai prefix
app.include_router(settings_router)  # Settings routes already have /api/settings prefix

print("[STARTUP] [OK] All routers registered")
print("[STARTUP] [OK] API ready to accept requests")
print("=" * 80)


@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "message": "DocDocs API is running",
        "version": "1.0.0",
        "ai_enabled": True
    }


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
