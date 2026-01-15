"""AI Routes for Ollama-powered features."""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
import traceback
import sys
import os

# Add parent directory to path to import services
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

try:
    from services.ollama_service import ollama_service
    print("[AI Routes] [OK] Successfully imported ollama_service")
except Exception as e:
    print(f"[AI Routes] [ERROR] Failed to import ollama_service: {e}")
    traceback.print_exc()
    raise

from middleware.auth import get_current_user, get_optional_user

router = APIRouter(prefix="/api/ai", tags=["ai"])
print("[AI Routes] [OK] All routes registered")


# Request/Response Models
class ImproveReadmeRequest(BaseModel):
    readme: str
    projectInfo: Dict[str, Any]

class GenerateDescriptionRequest(BaseModel):
    projectInfo: Dict[str, Any]

class GenerateSetupRequest(BaseModel):
    projectInfo: Dict[str, Any]

class GenerateApiDocsRequest(BaseModel):
    endpoints: List[Dict[str, Any]]

class GenerateDiagramRequest(BaseModel):
    type: str  # 'architecture' | 'dependency' | 'flow'
    data: Dict[str, Any]

class AnalyzeQualityRequest(BaseModel):
    codeStructure: Dict[str, Any]

class HealthResponse(BaseModel):
    healthy: bool
    models: List[str]
    baseUrl: str
    model: str


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Check Ollama service status (no auth required for health check)"""
    try:
        print("=" * 80)
        print("[AI /health] Health check endpoint called")
        
        # Check Ollama
        is_healthy = await ollama_service.health_check()
        print(f"[AI /health] Ollama healthy: {is_healthy}")
        
        # Get models if healthy
        models = []
        if is_healthy:
            models = await ollama_service.list_models()
            print(f"[AI /health] Models found: {models}")
        
        result = HealthResponse(
            healthy=is_healthy,
            models=models,
            baseUrl=ollama_service.base_url,
            model=ollama_service.model
        )
        
        print(f"[AI /health] Returning: healthy={is_healthy}, models={len(models)}")
        print("=" * 80)
        return result
    except Exception as e:
        print(f"[AI /health] [ERROR] Exception: {type(e).__name__}: {str(e)}")
        traceback.print_exc()
        print("=" * 80)
        
        # Return unhealthy status instead of raising error
        return HealthResponse(
            healthy=False,
            models=[],
            baseUrl=ollama_service.base_url,
            model=ollama_service.model
        )


@router.post("/improve-readme")
async def improve_readme(
    request: ImproveReadmeRequest,
    current_user: dict = Depends(get_current_user)
):
    """Improve README content with AI"""
    try:
        print("=" * 80)
        print(f"[AI /improve-readme] Request from user: {current_user.get('email')}")
        print(f"[AI /improve-readme] README length: {len(request.readme)} chars")
        print(f"[AI /improve-readme] Project info: {request.projectInfo}")
        
        # Validate input
        if not request.readme or len(request.readme.strip()) == 0:
            print("[AI /improve-readme] [ERROR] Empty README")
            raise HTTPException(
                status_code=400,
                detail="README content is required"
            )
        
        # Check if Ollama is available
        print("[AI /improve-readme] Checking Ollama health...")
        is_healthy = await ollama_service.health_check()
        if not is_healthy:
            print("[AI /improve-readme] [ERROR] Ollama not healthy")
            raise HTTPException(
                status_code=503,
                detail="Ollama service is not available. Please start Ollama with: ollama serve"
            )
        
        # Generate improved README
        print("[AI /improve-readme] Calling ollama_service.improve_readme...")
        improved_readme = await ollama_service.improve_readme(
            request.readme,
            request.projectInfo
        )
        
        print(f"[AI /improve-readme] [OK] Success! New length: {len(improved_readme)} chars")
        print("=" * 80)
        
        return {
            "success": True,
            "content": improved_readme,
            "metadata": {
                "originalLength": len(request.readme),
                "improvedLength": len(improved_readme),
                "model": ollama_service.model
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e)
        error_type = type(e).__name__
        print(f"[AI /improve-readme] [ERROR] Unexpected error: {error_type}: {error_msg}")
        traceback.print_exc()
        print("=" * 80)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to improve README: {error_msg}"
        )


@router.post("/generate-description")
async def generate_description(
    request: GenerateDescriptionRequest,
    current_user: dict = Depends(get_current_user)
):
    """Generate project description"""
    try:
        is_healthy = await ollama_service.health_check()
        if not is_healthy:
            raise HTTPException(
                status_code=503,
                detail="Ollama service is not available"
            )
        
        description = await ollama_service.generate_project_description(
            request.projectInfo
        )
        
        return {
            "success": True,
            "content": description,
            "metadata": {
                "model": ollama_service.model
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f'[AI] Error generating description: {e}')
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate description: {str(e)}"
        )


@router.post("/generate-setup")
async def generate_setup(
    request: GenerateSetupRequest,
    current_user: dict = Depends(get_current_user)
):
    """Generate setup/installation guide"""
    try:
        is_healthy = await ollama_service.health_check()
        if not is_healthy:
            raise HTTPException(
                status_code=503,
                detail="Ollama service is not available"
            )
        
        guide = await ollama_service.generate_setup_guide(request.projectInfo)
        
        return {
            "success": True,
            "content": guide,
            "metadata": {
                "model": ollama_service.model
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f'[AI] Error generating setup guide: {e}')
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate setup guide: {str(e)}"
        )


@router.post("/generate-api-docs")
async def generate_api_docs(
    request: GenerateApiDocsRequest,
    current_user: dict = Depends(get_current_user)
):
    """Generate API documentation"""
    try:
        is_healthy = await ollama_service.health_check()
        if not is_healthy:
            raise HTTPException(
                status_code=503,
                detail="Ollama service is not available"
            )
        
        if not request.endpoints or len(request.endpoints) == 0:
            raise HTTPException(
                status_code=400,
                detail="endpoints array is required and must not be empty"
            )
        
        docs = await ollama_service.generate_api_docs(request.endpoints)
        
        return {
            "success": True,
            "content": docs,
            "metadata": {
                "endpointCount": len(request.endpoints),
                "model": ollama_service.model
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f'[AI] Error generating API docs: {e}')
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate API documentation: {str(e)}"
        )


@router.post("/generate-diagram")
async def generate_diagram(
    request: GenerateDiagramRequest,
    current_user: dict = Depends(get_current_user)
):
    """Generate Mermaid diagram"""
    try:
        print("=" * 80)
        print(f"[AI /generate-diagram] Request type: {request.type}")
        print(f"[AI /generate-diagram] Data keys: {list(request.data.keys())}")
        
        # Validate type
        if request.type not in ['architecture', 'dependency', 'flow']:
            print(f"[AI /generate-diagram] [ERROR] Invalid type: {request.type}")
            raise HTTPException(
                status_code=400,
                detail="Invalid diagram type. Must be: architecture, dependency, or flow"
            )
        
        # Check Ollama health
        print("[AI /generate-diagram] Checking Ollama health...")
        is_healthy = await ollama_service.health_check()
        if not is_healthy:
            print("[AI /generate-diagram] [ERROR] Ollama not healthy")
            raise HTTPException(
                status_code=503,
                detail="Ollama service is not available. Please start Ollama with: ollama serve"
            )
        
        # Generate diagram
        print("[AI /generate-diagram] Calling ollama_service.generate_mermaid_diagram...")
        diagram_code = await ollama_service.generate_mermaid_diagram(
            request.type,
            request.data
        )
        
        print(f"[AI /generate-diagram] [OK] Success! Diagram length: {len(diagram_code)} chars")
        print("=" * 80)
        
        return {
            "success": True,
            "content": diagram_code,
            "metadata": {
                "type": request.type,
                "model": ollama_service.model
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[AI /generate-diagram] [ERROR] Unexpected error: {type(e).__name__}: {str(e)}")
        traceback.print_exc()
        print("=" * 80)
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )


@router.post("/analyze-quality")
async def analyze_quality(
    request: AnalyzeQualityRequest,
    current_user: dict = Depends(get_current_user)
):
    """Analyze code quality and return suggestions"""
    try:
        is_healthy = await ollama_service.health_check()
        if not is_healthy:
            raise HTTPException(
                status_code=503,
                detail="Ollama service is not available"
            )
        
        suggestions = await ollama_service.analyze_code_quality(request.codeStructure)
        
        return {
            "success": True,
            "content": suggestions,
            "metadata": {
                "suggestionCount": len(suggestions),
                "model": ollama_service.model
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f'[AI] Error analyzing code quality: {e}')
        raise HTTPException(
            status_code=500,
            detail=f"Failed to analyze code quality: {str(e)}"
        )
