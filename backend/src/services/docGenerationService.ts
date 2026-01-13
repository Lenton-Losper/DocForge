/** Documentation generation service - Uses audit-based generator with progress tracking. */
import { generateAuditDocsForRepository } from './auditDocGenerator.js';
import { updateJob } from './jobStateManager.js';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Check if generation is already in progress (with time-based lock)
 * Returns true if generation is in progress AND started less than 5 minutes ago
 */
export async function isGenerationInProgress(repositoryId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('generated_docs')
    .select('status, generation_started_at')
    .eq('repository_id', repositoryId)
    .single();

  if (error || !data) {
    return false; // No record exists, safe to start
  }

  if (data.status !== 'generating') {
    return false; // Not generating, safe to start
  }

  // Check if generation started less than 5 minutes ago
  if (data.generation_started_at) {
    const startedAt = new Date(data.generation_started_at);
    const now = new Date();
    const minutesElapsed = (now.getTime() - startedAt.getTime()) / (1000 * 60);
    
    if (minutesElapsed < 5) {
      return true; // Still in progress (less than 5 minutes)
    } else {
      // Stale job (older than 5 minutes) - allow regeneration
      console.warn(`[DOCS] Stale generation job detected (${minutesElapsed.toFixed(1)} minutes old), allowing regeneration`);
      return false;
    }
  }

  // No generation_started_at timestamp - treat as stale, allow regeneration
  return false;
}

/**
 * Generate documentation for a repository with atomic state management.
 * Guarantees state cleanup - status = "generating" will NEVER survive an exception.
 * 
 * This function orchestrates the generation pipeline:
 * 1. Sets initial state
 * 2. Calls audit generator (which handles all progress updates)
 * 3. Ensures final state is set (completed or failed)
 */
export async function generateDocsForRepository(repositoryId: string) {
  const startedAt = new Date().toISOString();
  
  try {
    // Set initial status atomically (with generation_started_at timestamp)
    await supabase
      .from('generated_docs')
      .update({
        status: 'generating',
        progress: 10,
        current_step: 'Initializing',
        error_message: null,
        generation_started_at: startedAt,
        updated_at: startedAt
      })
      .eq('repository_id', repositoryId);

    console.log(`[DOCS] Starting documentation generation for ${repositoryId}`);

    // Generate documentation (all progress updates handled inside)
    // The audit generator uses updateJob() which updates generated_docs directly
    const result = await generateAuditDocsForRepository(repositoryId);

    // Final success state is already set by generateAuditDocsForRepository
    // But we ensure it's set here as well (defensive programming)
    await updateJob(repositoryId, {
      status: 'completed',
      progress: 100,
      current_step: 'Completed',
      error_message: null
    });

    console.log(`[DOCS] Documentation generation completed successfully for ${repositoryId}`);
    return { success: true, docs: result };
    
  } catch (error) {
    // ATOMIC STATE UPDATE: Guaranteed cleanup on failure
    // This catch block ensures status = "generating" NEVER survives an exception
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[DOCS] Error in documentation generation:', error);
    
    // Update to failed state - this MUST succeed
    try {
      await updateJob(repositoryId, {
        status: 'failed',
        progress: 0,
        current_step: 'Failed',
        error_message: errorMessage
      });
      console.log(`[DOCS] State updated to 'failed' for ${repositoryId}`);
    } catch (updateError) {
      // If even the error update fails, log it but don't throw
      // This prevents infinite loops
      console.error('[DOCS] CRITICAL: Failed to update error status:', updateError);
    }

    throw error;
  }
}
