"""Settings and preferences endpoints."""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from middleware.auth import get_current_user

router = APIRouter(prefix="/api/settings", tags=["settings"])


class UpdatePreferencesRequest(BaseModel):
    autoRegenerate: bool


@router.post("/preferences")
async def update_preferences(
    request: UpdatePreferencesRequest,
    current_user: dict = Depends(get_current_user)
):
    """Update user preferences"""
    try:
        print(f"[SETTINGS] Update preferences for: {current_user.get('email')}")
        print(f"[SETTINGS] Auto-regenerate: {request.autoRegenerate}")
        
        # TODO: Save to database
        
        return {
            "success": True,
            "message": "Preferences updated successfully",
            "preferences": {
                "autoRegenerate": request.autoRegenerate
            }
        }
        
    except Exception as e:
        print(f"[SETTINGS] Error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/preferences")
async def get_preferences(current_user: dict = Depends(get_current_user)):
    """Get user preferences"""
    try:
        print(f"[SETTINGS] Get preferences for: {current_user.get('email')}")
        
        # TODO: Get from database
        
        return {
            "preferences": {
                "autoRegenerate": False
            }
        }
        
    except Exception as e:
        print(f"[SETTINGS] Error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
