"""Authentication endpoints."""
from fastapi import APIRouter, Depends, HTTPException, status
from middleware.auth import get_current_user

router = APIRouter()


@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    """
    Get current authenticated user information.
    
    Returns:
        dict: User information (id, email)
    """
    return {
        "id": current_user["id"],
        "email": current_user["email"],
    }
