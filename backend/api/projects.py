"""Project/repository management endpoints."""
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from middleware.auth import get_current_user
from services.github_service import GitHubService
from supabase import create_client
import os
import logging

logger = logging.getLogger(__name__)

def get_supabase_client():
    """Get Supabase client with service role key."""
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not supabase_url or not supabase_service_key:
        raise ValueError("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
    
    from supabase import create_client
    return create_client(supabase_url, supabase_service_key)

router = APIRouter()


@router.get("/projects")
async def get_projects(current_user: dict = Depends(get_current_user)):
    """
    Get all projects/repositories for the authenticated user.
    
    Returns:
        dict: List of projects
    """
    user_id = current_user["id"]
    
    # TODO: Fetch from database using user_id
    # For now, return mock data
    return {
        "projects": [
            {
                "id": "1",
                "name": "api-server",
                "owner": "acme",
                "url": "https://github.com/acme/api-server",
                "lastUpdate": "2 hours ago",
                "status": "up-to-date",
                "docCount": 5,
            },
            {
                "id": "2",
                "name": "frontend-app",
                "owner": "acme",
                "url": "https://github.com/acme/frontend-app",
                "lastUpdate": "1 day ago",
                "status": "needs-refresh",
                "docCount": 4,
            },
        ]
    }


@router.get("/projects/{project_id}")
async def get_project(
    project_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get a specific project by ID.
    
    Args:
        project_id: Project identifier
        
    Returns:
        dict: Project information and documentation
    """
    user_id = current_user["id"]
    
    # TODO: Verify project belongs to user and fetch from database
    # For now, return mock data
    return {
        "id": project_id,
        "name": "api-server",
        "owner": "acme",
        "url": "https://github.com/acme/api-server",
        "sections": [
            {"id": "readme", "title": "README", "type": "readme"},
            {"id": "api", "title": "API Documentation", "type": "api"},
            {"id": "setup", "title": "Setup Guide", "type": "setup"},
            {"id": "architecture", "title": "Architecture", "type": "architecture"},
        ],
        "content": {
            "readme": "# README Documentation\n\nThis is the README...",
            "api": "# API Documentation\n\nAPI endpoints...",
            "setup": "# Setup Guide\n\nInstallation steps...",
            "architecture": "# Architecture\n\nSystem design...",
        },
    }


@router.post("/projects")
async def create_project(
    repo_url: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Connect a new GitHub repository.
    
    Args:
        repo_url: GitHub repository URL
        
    Returns:
        dict: Created project information
    """
    user_id = current_user["id"]
    
    # TODO: Validate repo URL, connect to GitHub, create project in database
    return {
        "id": "new-project-id",
        "name": "new-repo",
        "owner": "user",
        "url": repo_url,
        "status": "connected",
    }


@router.delete("/projects/{project_id}")
async def delete_project(
    project_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Disconnect a repository.
    
    Args:
        project_id: Project identifier
        
    Returns:
        dict: Success message
    """
    user_id = current_user["id"]
    
    # TODO: Verify ownership and delete from database
    return {"message": "Project disconnected successfully"}


@router.get("/repositories/{repo_id}/readme")
async def get_repository_readme(
    repo_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Fetch the actual README.md content from a GitHub repository.
    
    Args:
        repo_id: Repository UUID from database
        
    Returns:
        dict: README content and metadata
    """
    user_id = current_user["id"]
    
    try:
        logger.info(f"[REPOS] Fetching README for repo: {repo_id}, user: {user_id}")
        
        # Get Supabase client
        supabase = get_supabase_client()
        
        # 1. Fetch repository info from database
        repo_response = supabase.table("repositories").select("*").eq("id", repo_id).eq("user_id", user_id).single().execute()
        
        if not repo_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Repository not found or you don't have access"
            )
        
        repo = repo_response.data
        repo_owner = repo.get("repo_owner")
        repo_name = repo.get("repo_name")
        
        if not repo_owner or not repo_name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Repository missing owner or name information"
            )
        
        # 2. Get GitHub token from user's profile
        profile_response = supabase.table("profiles").select("github_access_token").eq("id", user_id).single().execute()
        
        github_token = None
        if profile_response.data:
            github_token = profile_response.data.get("github_access_token")
        
        # Fallback: Try to get from session (if available in request context)
        if not github_token:
            # Try user metadata as fallback
            user_response = supabase.auth.admin.get_user_by_id(user_id)
            if user_response and hasattr(user_response, 'user'):
                user = user_response.user
                if hasattr(user, 'identities') and user.identities:
                    github_identity = next((id for id in user.identities if id.provider == 'github'), None)
                    if github_identity and hasattr(github_identity, 'identity_data'):
                        github_token = github_identity.identity_data.get('provider_token')
        
        if not github_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="GitHub token not available. Please reconnect your GitHub account in Settings."
            )
        
        # 3. Fetch README from GitHub
        readme_content = await GitHubService.fetch_readme_content(
            owner=repo_owner,
            repo=repo_name,
            github_token=github_token,
            branch=repo.get("default_branch", "main")
        )
        
        logger.info(f"[REPOS] Successfully fetched README for {repo_owner}/{repo_name}, length: {len(readme_content)}")
        
        return {
            "success": True,
            "content": readme_content,
            "repository_id": repo_id,
            "file_path": "README.md",
            "owner": repo_owner,
            "repo": repo_name
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[REPOS] Error fetching README: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch README: {str(e)}"
        )
