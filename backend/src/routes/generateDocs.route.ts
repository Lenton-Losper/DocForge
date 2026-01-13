/** Documentation generation routes. */
import { Router, Response } from 'express';
import { verifyAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { generateDocsForRepository } from '../services/docGenerationService.js';

const router = Router();

router.post('/generate-docs', verifyAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Log request for debugging
    console.log('[GENERATE-DOCS] Request received:', {
      body: req.body,
      hasAuth: !!req.user,
      userId: req.user?.id,
      contentType: req.headers['content-type']
    });

    // Validate request body
    if (!req.body || typeof req.body !== 'object') {
      console.warn('[GENERATE-DOCS] Invalid request body:', req.body);
      return res.status(400).json({ 
        error: 'Invalid request body',
        expected: { repository_id: 'string' }
      });
    }

    const { repository_id } = req.body;

    // Validate repository_id
    if (!repository_id) {
      console.warn('[GENERATE-DOCS] Missing repository_id in body:', req.body);
      return res.status(400).json({ 
        error: 'repository_id is required',
        received: Object.keys(req.body)
      });
    }

    if (typeof repository_id !== 'string') {
      console.warn('[GENERATE-DOCS] Invalid repository_id type:', typeof repository_id);
      return res.status(400).json({ 
        error: 'repository_id must be a string',
        received: typeof repository_id
      });
    }

    // Verify user is authenticated
    if (!req.user) {
      console.warn('[GENERATE-DOCS] No user in request (auth middleware failed)');
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Create placeholder row immediately (if doesn't exist)
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Verify repository belongs to user
    const { data: repo, error: repoError } = await supabase
      .from('repositories')
      .select('id, user_id')
      .eq('id', repository_id)
      .eq('user_id', req.user.id)
      .single();

    if (repoError || !repo) {
      console.warn('[GENERATE-DOCS] Repository not found or access denied:', {
        repository_id,
        userId: req.user.id,
        error: repoError?.message
      });
      return res.status(404).json({ 
        error: 'Repository not found or access denied',
        repository_id
      });
    }

    // Time-based lock check: Check if generation is already in progress (within 5 minutes)
    const { isGenerationInProgress } = await import('../services/docGenerationService.js');
    const inProgress = await isGenerationInProgress(repository_id);
    
    if (inProgress) {
      console.warn('[GENERATE-DOCS] Generation already in progress (within 5 minutes):', repository_id);
      return res.status(409).json({ 
        error: 'Documentation generation is already in progress',
        repository_id,
        status: 'generating'
      });
    }

    // Load GitHub token from profiles BEFORE starting generation
    // This ensures we fail fast if token is missing
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('github_access_token')
      .eq('id', req.user.id)
      .single();

    if (profileError || !profile) {
      console.warn('[GENERATE-DOCS] GitHub token not found:', {
        userId: req.user.id,
        error: profileError?.message
      });
      return res.status(400).json({
        error: 'GitHub token not available',
        message: 'Please reconnect your GitHub account in Settings'
      });
    }

    if (!profile.github_access_token || profile.github_access_token.trim() === '') {
      console.warn('[GENERATE-DOCS] GitHub token is empty:', { userId: req.user.id });
      return res.status(400).json({
        error: 'GitHub token not available',
        message: 'Please reconnect your GitHub account in Settings'
      });
    }

    // Set initial state atomically
    const now = new Date().toISOString();
    const { error: upsertError } = await supabase
      .from('generated_docs')
      .upsert({
        repository_id: repository_id,
        readme: null,
        api_docs: null,
        setup_guide: null,
        architecture: null,
        version: '1.0.0',
        status: 'generating',
        progress: 0,
        current_step: 'Starting generation',
        error_message: null,
        generation_started_at: now,
        updated_at: now
      }, {
        onConflict: 'repository_id'
      });

    if (upsertError) {
      console.error('[GENERATE-DOCS] Failed to set initial state:', upsertError);
      return res.status(500).json({
        error: 'Failed to initialize generation job',
        message: upsertError.message
      });
    }

    console.log('[GENERATE-DOCS] Initial state set, starting background generation for:', repository_id);

    // Start background generation (non-blocking)
    // Do NOT await - return immediately
    generateDocsForRepository(repository_id).catch(err => {
      console.error('[GENERATE-DOCS] Background generation error:', err);
      // Error handling is done inside generateDocsForRepository
    });

    // Return immediately - do NOT block
    res.json({
      success: true,
      message: 'Documentation generation started',
      data: { repository_id, status: 'generating' }
    });
  } catch (error) {
    console.error('[GENERATE-DOCS] Unexpected error:', error);
    res.status(500).json({
      error: 'Failed to start documentation generation',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
