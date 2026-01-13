/** Account management routes. */
import { Router, Response } from 'express';
import { verifyAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { deleteUserAccount } from '../services/accountDeletionService.js';

const router = Router();

/**
 * DELETE /api/account
 * 
 * Permanently delete the authenticated user's account and all associated data.
 * 
 * Requires: Authorization: Bearer <token>
 * 
 * Deletes in order:
 * 1. generated_docs (by repository_id)
 * 2. repositories (by user_id)
 * 3. profiles (by id)
 * 4. auth.users (via Admin API)
 * 
 * Returns 200 on success, 500 on failure.
 */
router.delete('/account', verifyAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Get user ID from verified JWT (never trust client-supplied IDs)
    const userId = req.user?.id;

    if (!userId) {
      console.error('[ACCOUNT-DELETE] No user ID in request');
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'User ID not found in token' 
      });
    }

    console.log(`[ACCOUNT-DELETE] Delete account request received for user: ${userId}`);

    // Perform deletion
    const result = await deleteUserAccount(userId);

    if (!result.success) {
      console.error(`[ACCOUNT-DELETE] Deletion failed for user ${userId}:`, result.error);
      return res.status(500).json({
        error: 'Account deletion failed',
        message: result.error || 'Unknown error occurred'
      });
    }

    console.log(`[ACCOUNT-DELETE] Account successfully deleted for user ${userId}`);
    
    return res.status(200).json({
      success: true,
      message: 'Account and all associated data have been permanently deleted',
      deletedCounts: result.deletedCounts
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[ACCOUNT-DELETE] Unexpected error during account deletion:', errorMessage);
    
    return res.status(500).json({
      error: 'Account deletion failed',
      message: errorMessage
    });
  }
});

export default router;
