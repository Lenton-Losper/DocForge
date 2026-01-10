/** Documentation generation routes. */
import { Router, Response } from 'express';
import { verifyAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { generateDocsForRepository } from '../services/docGenerationService.js';

const router = Router();

router.post('/generate-docs', verifyAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { repository_id } = req.body;

    if (!repository_id) {
      return res.status(400).json({ error: 'repository_id is required' });
    }

    // Start doc generation (can be async/background job in production)
    const result = await generateDocsForRepository(repository_id);

    res.json({
      success: true,
      message: 'Documentation generated successfully',
      data: result
    });
  } catch (error) {
    console.error('Doc generation error:', error);
    res.status(500).json({
      error: 'Failed to generate documentation',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
