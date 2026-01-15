"""GitHub API service for fetching user repositories."""
import httpx
import base64
from typing import List, Dict, Any
from fastapi import HTTPException, status
import logging

logger = logging.getLogger(__name__)

GITHUB_API_BASE = "https://api.github.com"
GITHUB_API_TIMEOUT = 30.0  # seconds


class GitHubService:
    """Service for interacting with GitHub API."""
    
    @staticmethod
    async def fetch_user_repositories(github_token: str) -> List[Dict[str, Any]]:
        """
        Fetch user's GitHub repositories.
        
        Args:
            github_token: GitHub access token (OAuth token)
            
        Returns:
            List of repository dictionaries
            
        Raises:
            HTTPException: If GitHub API call fails or token is invalid
        """
        if not github_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="GitHub token is required"
            )
        
        # Sanitize token for logging (never log full token)
        token_preview = f"{github_token[:8]}..." if len(github_token) > 8 else "***"
        logger.info(f"Fetching GitHub repositories with token: {token_preview}")
        
        headers = {
            "Authorization": f"token {github_token}",
            "Accept": "application/vnd.github+json",
            "User-Agent": "DocDocs/1.0"
        }
        
        url = f"{GITHUB_API_BASE}/user/repos"
        params = {
            "per_page": 100,
            "sort": "updated",
            "affiliation": "owner,collaborator"  # Get repos user owns or collaborates on
        }
        
        try:
            async with httpx.AsyncClient(timeout=GITHUB_API_TIMEOUT) as client:
                response = await client.get(url, headers=headers, params=params)
                
                # Handle different error status codes
                if response.status_code == 401:
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Invalid GitHub token. Please reconnect your GitHub account."
                    )
                
                if response.status_code == 403:
                    # Check if it's a rate limit issue
                    rate_limit_remaining = response.headers.get("X-RateLimit-Remaining", "0")
                    if rate_limit_remaining == "0":
                        raise HTTPException(
                            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                            detail="GitHub API rate limit exceeded. Please try again later."
                        )
                    else:
                        raise HTTPException(
                            status_code=status.HTTP_403_FORBIDDEN,
                            detail="Insufficient GitHub token permissions. Token may need 'repo' scope."
                        )
                
                if response.status_code == 404:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="GitHub API endpoint not found"
                    )
                
                if not response.is_success:
                    error_detail = "Unknown GitHub API error"
                    try:
                        error_data = response.json()
                        error_detail = error_data.get("message", error_detail)
                    except Exception:
                        pass
                    
                    logger.error(f"GitHub API error: {response.status_code} - {error_detail}")
                    raise HTTPException(
                        status_code=status.HTTP_502_BAD_GATEWAY,
                        detail=f"GitHub API error: {error_detail}"
                    )
                
                repos = response.json()
                logger.info(f"Successfully fetched {len(repos)} repositories from GitHub")
                
                return repos
                
        except httpx.TimeoutException:
            logger.error("GitHub API request timed out")
            raise HTTPException(
                status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                detail="GitHub API request timed out. Please try again."
            )
        
        except httpx.RequestError as e:
            logger.error(f"GitHub API request error: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Failed to connect to GitHub API: {str(e)}"
            )
        
        except HTTPException:
            # Re-raise HTTPExceptions as-is
            raise
        
        except Exception as e:
            logger.error(f"Unexpected error fetching GitHub repos: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Unexpected error: {str(e)}"
            )
    
    @staticmethod
    def transform_repo(repo: Dict[str, Any]) -> Dict[str, Any]:
        """
        Transform GitHub API repository response to our clean format.
        
        Args:
            repo: Raw repository data from GitHub API
            
        Returns:
            Cleaned repository dictionary
        """
        return {
            "id": repo.get("id"),
            "name": repo.get("name"),
            "full_name": repo.get("full_name"),
            "private": repo.get("private", False),
            "description": repo.get("description"),
            "default_branch": repo.get("default_branch", "main"),
            "html_url": repo.get("html_url")
        }
    
    @staticmethod
    async def fetch_readme_content(
        owner: str,
        repo: str,
        github_token: str,
        branch: str = "main"
    ) -> str:
        """
        Fetch README.md content from a GitHub repository.
        
        Args:
            owner: Repository owner (username or org)
            repo: Repository name
            github_token: GitHub access token
            branch: Branch name (default: "main")
            
        Returns:
            README content as string
            
        Raises:
            HTTPException: If README cannot be fetched
        """
        if not github_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="GitHub token is required"
            )
        
        headers = {
            "Authorization": f"token {github_token}",
            "Accept": "application/vnd.github.v3.raw",  # Get raw content
            "User-Agent": "DocDocs/1.0"
        }
        
        # Try common README filenames
        readme_paths = ["README.md", "readme.md", "Readme.md", "README.rst", "README.txt"]
        
        for readme_path in readme_paths:
            try:
                url = f"{GITHUB_API_BASE}/repos/{owner}/{repo}/contents/{readme_path}"
                params = {"ref": branch}
                
                async with httpx.AsyncClient(timeout=GITHUB_API_TIMEOUT) as client:
                    response = await client.get(url, headers=headers, params=params)
                    
                    if response.status_code == 200:
                        # GitHub returns base64-encoded content
                        data = response.json()
                        if "content" in data:
                            import base64
                            content = base64.b64decode(data["content"]).decode("utf-8")
                            logger.info(f"Successfully fetched README from {owner}/{repo}")
                            return content
                    
                    elif response.status_code == 404:
                        # Try next README filename
                        continue
                    
                    elif response.status_code == 401:
                        raise HTTPException(
                            status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Invalid GitHub token. Please reconnect your GitHub account."
                        )
                    
                    elif response.status_code == 403:
                        raise HTTPException(
                            status_code=status.HTTP_403_FORBIDDEN,
                            detail="Insufficient GitHub token permissions or repository is private."
                        )
                    
                    else:
                        logger.warning(f"Unexpected status {response.status_code} for {readme_path}")
                        continue
                        
            except httpx.TimeoutException:
                raise HTTPException(
                    status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                    detail="GitHub API request timed out. Please try again."
                )
            
            except httpx.RequestError as e:
                logger.error(f"GitHub API request error for {readme_path}: {str(e)}")
                continue
        
        # If no README found, return a basic template
        logger.warning(f"No README found in {owner}/{repo}, returning template")
        return f"""# {repo}

## Overview
A {repo} project.

## Installation
\`\`\`bash
npm install
\`\`\`

## Usage
\`\`\`bash
npm start
\`\`\`

## Features
- Feature 1
- Feature 2

## Contributing
Contributions are welcome!## License
MIT
"""
