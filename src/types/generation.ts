/**
 * Type definitions for document generation progress tracking.
 * These types match the database schema after migration.
 */

/**
 * Backend status values from generated_docs.status column.
 * These are the exact values stored in the database.
 */
export type GenerationStatus = 'idle' | 'generating' | 'completed' | 'failed';

/**
 * Frontend status values for UI state management.
 * Maps from backend status to frontend display state.
 */
export type FrontendGenerationStatus = 'not_started' | 'generating' | 'complete' | 'failed';

/**
 * Raw row from generated_docs table.
 * All fields may be null if migration hasn't run or row doesn't exist.
 */
export interface GeneratedDocsRow {
  id?: string;
  repository_id?: string;
  readme?: string | null;
  api_docs?: string | null;
  setup_guide?: string | null;
  architecture?: string | null;
  version?: string | null;
  generated_at?: string | null;
  updated_at?: string | null;
  // Progress tracking fields (added by migration)
  status?: GenerationStatus | null;
  progress?: number | null;
  current_step?: string | null;
  error_message?: string | null;
  generation_started_at?: string | null;
}

/**
 * Parsed and normalized generation state.
 * All fields have safe defaults - never null/undefined.
 */
export interface ParsedGenerationState {
  status: FrontendGenerationStatus;
  progress: number; // 0-100, always defined
  currentStep: string; // Empty string if not set
  errorMessage: string; // Empty string if no error
  hasContent: boolean; // True if any doc content exists
}

/**
 * Safe parser for generated_docs rows.
 * 
 * This function:
 * - Handles null/undefined values gracefully
 * - Maps backend status to frontend status
 * - Provides safe defaults for all fields
 * - Never throws errors
 * 
 * @param row - Raw row from Supabase (may be null/undefined)
 * @returns Parsed state with safe defaults
 */
export function parseGenerationState(row: GeneratedDocsRow | null | undefined): ParsedGenerationState {
  // Default state when no row exists
  if (!row) {
    return {
      status: 'not_started',
      progress: 0,
      currentStep: '',
      errorMessage: '',
      hasContent: false
    };
  }

  // Check if any documentation content exists
  const hasContent = !!(
    row.readme || 
    row.api_docs || 
    row.setup_guide || 
    row.architecture
  );

  // Map backend status to frontend status
  // Backend: 'idle' | 'generating' | 'completed' | 'failed'
  // Frontend: 'not_started' | 'generating' | 'complete' | 'failed'
  let frontendStatus: FrontendGenerationStatus;
  const backendStatus = row.status;

  if (backendStatus === 'generating') {
    frontendStatus = 'generating';
  } else if (backendStatus === 'completed') {
    frontendStatus = 'complete';
  } else if (backendStatus === 'failed') {
    frontendStatus = 'failed';
  } else if (backendStatus === 'idle') {
    frontendStatus = 'not_started';
  } else {
    // Fallback: if status column doesn't exist or is null,
    // determine from content
    frontendStatus = hasContent ? 'complete' : 'not_started';
  }

  // Safe defaults for progress (0-100)
  const progress = typeof row.progress === 'number' 
    ? Math.max(0, Math.min(100, row.progress)) // Clamp to 0-100
    : 0;

  // Safe defaults for text fields (empty string if null/undefined)
  const currentStep = row.current_step || '';
  const errorMessage = row.error_message || '';

  return {
    status: frontendStatus,
    progress,
    currentStep,
    errorMessage,
    hasContent
  };
}
