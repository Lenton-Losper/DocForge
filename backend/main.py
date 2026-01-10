"""FastAPI application entry point."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.analyze import router as analyze_router
from api.suggest_fixes import router as suggest_fixes_router
from api.auth import router as auth_router
from api.projects import router as projects_router
from api.github import router as github_router

app = FastAPI(
    title="DocDocs API",
    description="AI-powered documentation linting service",
    version="1.0.0"
)

# CORS configuration for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Vite default ports
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routes
app.include_router(analyze_router, prefix="/api", tags=["analysis"])
app.include_router(suggest_fixes_router, prefix="/api", tags=["ai"])
app.include_router(auth_router, prefix="/api", tags=["auth"])
app.include_router(projects_router, prefix="/api", tags=["projects"])
app.include_router(github_router, prefix="/api", tags=["github"])


@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "status": "ok",
        "service": "DocForge API",
        "version": "1.0.0"
    }


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "healthy"}
