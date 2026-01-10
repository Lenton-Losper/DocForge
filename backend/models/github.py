"""Pydantic models for GitHub API requests and responses."""
from pydantic import BaseModel, Field
from typing import List, Optional


class GitHubReposRequest(BaseModel):
    """Request model for fetching GitHub repositories."""
    github_token: str = Field(..., description="GitHub access token (provider_token)")


class GitHubRepo(BaseModel):
    """GitHub repository model for API response."""
    id: int = Field(..., description="Repository ID")
    name: str = Field(..., description="Repository name")
    full_name: str = Field(..., description="Full repository name (owner/repo)")
    private: bool = Field(..., description="Whether repository is private")
    description: Optional[str] = Field(None, description="Repository description")
    default_branch: str = Field(..., description="Default branch name")
    html_url: str = Field(..., description="Repository URL on GitHub")


class GitHubReposResponse(BaseModel):
    """Response model for GitHub repositories list."""
    repos: List[GitHubRepo] = Field(..., description="List of GitHub repositories")
