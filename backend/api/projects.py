"""Project/repository management endpoints."""
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from middleware.auth import get_current_user

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
