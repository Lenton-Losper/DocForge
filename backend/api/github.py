"""GitHub API endpoints for repository management."""
from fastapi import APIRouter, Depends, HTTPException, status
from middleware.auth import get_current_user
from models.github import GitHubReposRequest, GitHubReposResponse, GitHubRepo
from services.github_service import GitHubService
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/github/repos", response_model=GitHubReposResponse)
async def get_github_repositories(
    request: GitHubReposRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Fetch authenticated user's GitHub repositories.
    
    This endpoint:
    1. Validates the Supabase JWT token
    2. Accepts a GitHub access token (provider_token)
    3. Fetches repositories from GitHub API
    4. Returns a clean, frontend-friendly response
    
    Args:
        request: Request body containing GitHub token
        current_user: Authenticated user from JWT (injected via dependency)
        
    Returns:
        GitHubReposResponse: List of user's GitHub repositories
        
    Raises:
        HTTPException: 
            - 401: Invalid Supabase JWT or GitHub token
            - 403: Insufficient GitHub token permissions
            - 429: GitHub API rate limit exceeded
            - 500: Internal server error
    """
    user_id = current_user["id"]
    user_email = current_user.get("email", "unknown")
    
    logger.info(f"Fetching GitHub repos for user: {user_id} ({user_email})")
    
    try:
        # Fetch repositories from GitHub API
        repos_data = await GitHubService.fetch_user_repositories(request.github_token)
        
        # Transform to clean format
        repos = [
            GitHubRepo(**GitHubService.transform_repo(repo))
            for repo in repos_data
        ]
        
        logger.info(f"Successfully fetched {len(repos)} repositories for user {user_id}")
        
        return GitHubReposResponse(repos=repos)
        
    except HTTPException:
        # Re-raise HTTPExceptions (already properly formatted)
        raise
    
    except Exception as e:
        logger.error(f"Unexpected error in get_github_repositories: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch GitHub repositories: {str(e)}"
        )
