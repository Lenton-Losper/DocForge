"""AI fix suggestions API endpoint (Phase 2)."""
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from pydantic import BaseModel

from models.issue_model import Issue
from models.document_model import Document
from ai.fixer import generate_fixes, FixSuggestion

router = APIRouter()


class FixSuggestionResponse(BaseModel):
    """Response model for fix suggestions."""
    issue_id: str
    original: str
    suggested: str
    confidence: float


class SuggestFixesRequest(BaseModel):
    """Request model for fix suggestions."""
    issues: List[Issue]
    document: Optional[Document] = None


@router.post("/suggest-fixes")
async def suggest_fixes_endpoint(
    request: SuggestFixesRequest,
    enabled: bool = Query(default=False, description="Enable AI fix generation")
) -> dict:
    """
    Generate AI-powered fix suggestions for detected issues.
    
    This endpoint requires:
    - issues: List of issues from /analyze
    - document: (optional) Full document context for better suggestions
    - enabled: Flag to enable AI (disabled by default)
    
    Returns:
        List of fix suggestions with confidence scores
    """
    if not enabled:
        return {
            "suggestions": [],
            "message": "AI fixes are disabled. Set enabled=true to activate."
        }
    
    if not request.document:
        raise HTTPException(
            status_code=400,
            detail="Document context required for AI suggestions"
        )
    
    suggestions = generate_fixes(request.document, request.issues, enabled=True)
    
    # Convert to response format
    response_suggestions = [
        FixSuggestionResponse(
            issue_id=s.issue_id,
            original=s.original,
            suggested=s.suggested,
            confidence=s.confidence
        )
        for s in suggestions
    ]
    
    return {
        "suggestions": response_suggestions
    }
