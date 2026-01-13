/** Account deletion service - handles secure deletion of user data and auth account. */
import { supabase } from '../config/supabase.js';

export interface DeletionResult {
  success: boolean;
  error?: string;
  deletedCounts?: {
    documents: number;
    analysisResults: number;
    generatedDocs: number;
    repositories: number;
    profiles: number;
  };
}

/**
 * Delete all user-owned data and the auth user account.
 * Deletes in order: generated_docs → repositories → profiles → auth.users
 * 
 * @param userId - User ID from JWT (never trust client-supplied IDs)
 * @returns Deletion result with counts and success status
 */
export async function deleteUserAccount(userId: string): Promise<DeletionResult> {
  console.log(`[ACCOUNT-DELETE] Starting deletion for user: ${userId}`);

  try {
    // Step 1: Delete documents
    console.log(`[ACCOUNT-DELETE] Step 1: Deleting documents for user ${userId}`);
    const { data: documentsData, error: documentsError } = await supabase
      .from('documents')
      .delete()
      .eq('user_id', userId)
      .select('id');

    if (documentsError) {
      console.error(`[ACCOUNT-DELETE] Failed to delete documents:`, documentsError);
      throw new Error(`Failed to delete documents: ${documentsError.message}`);
    }

    const documentsCount = documentsData?.length || 0;
    console.log(`[ACCOUNT-DELETE] Deleted ${documentsCount} documents`);

    // Step 2: Delete analysis_results
    console.log(`[ACCOUNT-DELETE] Step 2: Deleting analysis_results for user ${userId}`);
    const { data: analysisResultsData, error: analysisResultsError } = await supabase
      .from('analysis_results')
      .delete()
      .eq('user_id', userId)
      .select('id');

    if (analysisResultsError) {
      console.error(`[ACCOUNT-DELETE] Failed to delete analysis_results:`, analysisResultsError);
      throw new Error(`Failed to delete analysis_results: ${analysisResultsError.message}`);
    }

    const analysisResultsCount = analysisResultsData?.length || 0;
    console.log(`[ACCOUNT-DELETE] Deleted ${analysisResultsCount} analysis_results`);

    // Step 3: Get all repositories for this user (to find their generated_docs)
    console.log(`[ACCOUNT-DELETE] Step 3: Fetching repositories for user ${userId}`);
    const { data: reposData, error: reposFetchError } = await supabase
      .from('repositories')
      .select('id')
      .eq('user_id', userId);

    if (reposFetchError) {
      console.error(`[ACCOUNT-DELETE] Failed to fetch repositories:`, reposFetchError);
      throw new Error(`Failed to fetch repositories: ${reposFetchError.message}`);
    }

    const repoIds = reposData?.map(r => r.id) || [];
    console.log(`[ACCOUNT-DELETE] Found ${repoIds.length} repositories to process`);

    // Step 4: Delete generated_docs for all user's repositories
    let generatedDocsCount = 0;
    if (repoIds.length > 0) {
      console.log(`[ACCOUNT-DELETE] Step 4: Deleting generated_docs for ${repoIds.length} repositories`);
      const { data: generatedDocsData, error: generatedDocsError } = await supabase
        .from('generated_docs')
        .delete()
        .in('repository_id', repoIds)
        .select('id');

      if (generatedDocsError) {
        console.error(`[ACCOUNT-DELETE] Failed to delete generated_docs:`, generatedDocsError);
        throw new Error(`Failed to delete generated_docs: ${generatedDocsError.message}`);
      }

      generatedDocsCount = generatedDocsData?.length || 0;
      console.log(`[ACCOUNT-DELETE] Deleted ${generatedDocsCount} generated_docs rows`);
    } else {
      console.log(`[ACCOUNT-DELETE] No repositories found, skipping generated_docs deletion`);
    }

    // Step 5: Delete repositories
    console.log(`[ACCOUNT-DELETE] Step 5: Deleting repositories for user ${userId}`);
    const { data: reposDeleteData, error: reposError } = await supabase
      .from('repositories')
      .delete()
      .eq('user_id', userId)
      .select('id');

    if (reposError) {
      console.error(`[ACCOUNT-DELETE] Failed to delete repositories:`, reposError);
      throw new Error(`Failed to delete repositories: ${reposError.message}`);
    }

    const repositoriesCount = reposDeleteData?.length || 0;
    console.log(`[ACCOUNT-DELETE] Deleted ${repositoriesCount} repositories`);

    // Step 6: Delete profile
    console.log(`[ACCOUNT-DELETE] Step 6: Deleting profile for user ${userId}`);
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId)
      .select('id');

    if (profileError) {
      console.error(`[ACCOUNT-DELETE] Failed to delete profile:`, profileError);
      throw new Error(`Failed to delete profile: ${profileError.message}`);
    }

    const profilesCount = profileData?.length || 0;
    console.log(`[ACCOUNT-DELETE] Deleted ${profilesCount} profile rows`);

    // Step 7: Delete auth user (requires Admin API)
    console.log(`[ACCOUNT-DELETE] Step 7: Deleting auth user ${userId}`);
    const { error: authDeleteError } = await supabase.auth.admin.deleteUser(userId);

    if (authDeleteError) {
      console.error(`[ACCOUNT-DELETE] Failed to delete auth user:`, authDeleteError);
      throw new Error(`Failed to delete auth user: ${authDeleteError.message}`);
    }

    console.log(`[ACCOUNT-DELETE] Successfully deleted auth user ${userId}`);

    const result: DeletionResult = {
      success: true,
      deletedCounts: {
        documents: documentsCount,
        analysisResults: analysisResultsCount,
        generatedDocs: generatedDocsCount,
        repositories: repositoriesCount,
        profiles: profilesCount
      }
    };

    console.log(`[ACCOUNT-DELETE] Account deletion completed successfully for user ${userId}`, result);
    return result;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error during account deletion';
    console.error(`[ACCOUNT-DELETE] Account deletion failed for user ${userId}:`, errorMessage);
    
    return {
      success: false,
      error: errorMessage
    };
  }
}
