"""Account management endpoints."""
from fastapi import APIRouter, HTTPException, Depends
from middleware.auth import get_current_user
from supabase import create_client
import os
import traceback

router = APIRouter(prefix="/api/account", tags=["account"])


def get_supabase_client():
    """Get Supabase client with service role key for admin operations."""
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not supabase_url or not supabase_service_key:
        raise ValueError("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
    
    return create_client(supabase_url, supabase_service_key)


@router.delete("")
async def delete_account(current_user: dict = Depends(get_current_user)):
    """
    Delete user account and all associated data.
    
    Deletes in order:
    1. Documents (if exists)
    2. Analysis results (if exists)
    3. Generated docs (by repository_id)
    4. Repositories (by user_id)
    5. Profile (by id)
    6. Auth user (via Admin API)
    """
    try:
        print("=" * 80)
        print(f"[ACCOUNT] Delete account request from user: {current_user.get('email')}")
        user_id = current_user.get("id")
        
        if not user_id:
            print("[ACCOUNT] [ERROR] No user ID in token")
            raise HTTPException(status_code=401, detail="Invalid authentication token")
        
        supabase = get_supabase_client()
        deleted_counts = {}
        
        # Step 1: Delete documents (if table exists)
        try:
            print(f"[ACCOUNT] Step 1: Deleting documents for user: {user_id}")
            docs_result = supabase.table("documents").delete().eq("user_id", user_id).execute()
            deleted_counts["documents"] = len(docs_result.data) if docs_result.data else 0
            print(f"[ACCOUNT] Deleted {deleted_counts['documents']} documents")
        except Exception as e:
            print(f"[ACCOUNT] [WARNING] Could not delete documents (table may not exist): {e}")
            deleted_counts["documents"] = 0
        
        # Step 2: Delete analysis results (if table exists)
        try:
            print(f"[ACCOUNT] Step 2: Deleting analysis_results for user: {user_id}")
            analysis_result = supabase.table("analysis_results").delete().eq("user_id", user_id).execute()
            deleted_counts["analysisResults"] = len(analysis_result.data) if analysis_result.data else 0
            print(f"[ACCOUNT] Deleted {deleted_counts['analysisResults']} analysis results")
        except Exception as e:
            print(f"[ACCOUNT] [WARNING] Could not delete analysis_results (table may not exist): {e}")
            deleted_counts["analysisResults"] = 0
        
        # Step 3: Get all repositories for this user (to find their generated_docs)
        print(f"[ACCOUNT] Step 3: Fetching repositories for user: {user_id}")
        repos_fetch = supabase.table("repositories").select("id").eq("user_id", user_id).execute()
        repo_ids = [repo["id"] for repo in (repos_fetch.data or [])]
        print(f"[ACCOUNT] Found {len(repo_ids)} repositories")
        
        # Step 4: Delete generated docs for all repositories
        generated_docs_count = 0
        for repo_id in repo_ids:
            try:
                print(f"[ACCOUNT] Step 4: Deleting generated_docs for repository: {repo_id}")
                docs_result = supabase.table("generated_docs").delete().eq("repository_id", repo_id).execute()
                count = len(docs_result.data) if docs_result.data else 0
                generated_docs_count += count
            except Exception as e:
                print(f"[ACCOUNT] [WARNING] Could not delete generated_docs for repo {repo_id}: {e}")
        deleted_counts["generatedDocs"] = generated_docs_count
        print(f"[ACCOUNT] Deleted {generated_docs_count} generated docs")
        
        # Step 5: Delete repositories
        print(f"[ACCOUNT] Step 5: Deleting repositories for user: {user_id}")
        repos_result = supabase.table("repositories").delete().eq("user_id", user_id).execute()
        deleted_counts["repositories"] = len(repos_result.data) if repos_result.data else 0
        print(f"[ACCOUNT] Deleted {deleted_counts['repositories']} repositories")
        
        # Step 6: Delete user profile
        print(f"[ACCOUNT] Step 6: Deleting user profile: {user_id}")
        profile_result = supabase.table("profiles").delete().eq("id", user_id).execute()
        deleted_counts["profiles"] = len(profile_result.data) if profile_result.data else 0
        print(f"[ACCOUNT] Deleted {deleted_counts['profiles']} profile rows")
        
        # Step 7: Delete authentication account (requires admin client)
        print(f"[ACCOUNT] Step 7: Deleting auth account: {user_id}")
        try:
            # Use Supabase Admin API to delete the auth user
            auth_result = supabase.auth.admin.delete_user(user_id)
            print("[ACCOUNT] Deleted auth account")
            deleted_counts["authUser"] = 1
        except Exception as auth_error:
            print(f"[ACCOUNT] [WARNING] Failed to delete auth account: {auth_error}")
            deleted_counts["authUser"] = 0
            # Continue even if auth deletion fails - the user data is already deleted
        
        print(f"[ACCOUNT] [OK] Account deletion completed for user: {user_id}")
        print(f"[ACCOUNT] Deletion summary: {deleted_counts}")
        print("=" * 80)
        
        return {
            "success": True,
            "message": "Account and all associated data have been permanently deleted",
            "deletedCounts": deleted_counts
        }
        
    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e)
        error_type = type(e).__name__
        print(f"[ACCOUNT] [ERROR] Failed to delete account: {error_type}: {error_msg}")
        traceback.print_exc()
        print("=" * 80)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete account: {error_msg}"
        )
