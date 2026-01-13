/**
 * Centralized job state manager for documentation generation.
 * Provides a single source of truth for updating job progress.
 */
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Update job state in generated_docs table.
 * This is the ONLY function that should update job state.
 */
export async function updateJob(
  repositoryId: string,
  update: {
    progress?: number;
    current_step?: string;
    status?: 'idle' | 'generating' | 'completed' | 'failed';
    error_message?: string | null;
  }
): Promise<void> {
  const updateData: any = {
    ...update,
    updated_at: new Date().toISOString()
  };

  const { error } = await supabase
    .from('generated_docs')
    .update(updateData)
    .eq('repository_id', repositoryId);

  if (error) {
    console.error(`[JOB] Failed to update job state:`, error);
    throw new Error(`Failed to update job state: ${error.message}`);
  }

  const stepInfo = update.current_step ? ` - ${update.current_step}` : '';
  const progressInfo = update.progress !== undefined ? ` (${update.progress}%)` : '';
  console.log(`[JOB] State updated${progressInfo}${stepInfo}`);
}
