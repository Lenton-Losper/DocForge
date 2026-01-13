/** Audit-based documentation generator - Evidence-first, no hallucination. */
import 'dotenv/config'; // Ensure env is loaded before any process.env access
import { createClient } from '@supabase/supabase-js';
import { Octokit } from '@octokit/rest';
import { analyzeRepository, RepoStructure } from './repositoryAnalyzer.js';
import { analyzeEvidence, SectionAnalysis } from './evidenceAnalyzer.js';
import { updateJob } from './jobStateManager.js';
import { openai } from '../config/openai.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const checklistSchema = JSON.parse(
  readFileSync(join(__dirname, '../schemas/documentationChecklist.json'), 'utf-8')
);

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface DocumentationSection {
  id: string;
  title: string;
  status: 'complete' | 'partial' | 'missing';
  confidence: 'verified' | 'inferred' | 'unverified' | 'missing';
  evidence: string[];
  content: string | null;
  missing_reason: string | null;
}

interface DocumentationResult {
  project_id: string;
  overall_score: number;
  sections: DocumentationSection[];
}

export async function generateAuditDocsForRepository(
  repositoryId: string
): Promise<DocumentationResult> {
  try {
    console.log(`[GENERATION] Starting documentation generation for repository ${repositoryId}`);

    // ============================================================================
    // STEP 1: Fetch Repository Metadata (10% → 40%)
    // ============================================================================
    await updateJob(repositoryId, {
      progress: 10,
      current_step: 'Initializing',
      status: 'generating'
    });
    console.log(`[GENERATION] Step 1: Fetching repository metadata...`);

    const { data: repo, error: repoError } = await supabase
      .from('repositories')
      .select('id, user_id, repo_owner, repo_name, description')
      .eq('id', repositoryId)
      .single();

    if (repoError || !repo) {
      throw new Error(`Repository not found: ${repoError?.message || 'No repository data'}`);
    }

    console.log(`[GENERATION] Repository found: ${repo.repo_owner}/${repo.repo_name}`);

    // ============================================================================
    // STEP 2: Fetch GitHub Token from Profiles (40% → 50%)
    // ============================================================================
    await updateJob(repositoryId, {
      progress: 40,
      current_step: 'Fetching GitHub authentication'
    });
    console.log(`[GENERATION] Step 2: Fetching GitHub token from profiles...`);

    // Fetch token from profiles table using service role client
    // NO auth session - background jobs don't have user sessions
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('github_access_token')
      .eq('id', repo.user_id)
      .single();

    if (profileError || !profile) {
      const errorMsg = `GitHub token not found in profiles table: ${profileError?.message || 'Profile not found'}`;
      console.error(`[GENERATION] ${errorMsg}`);
      await updateJob(repositoryId, {
        status: 'failed',
        progress: 0,
        current_step: 'Failed',
        error_message: 'GitHub token not available. Please reconnect your GitHub account in Settings.'
      });
      throw new Error('GitHub token not available. Please reconnect your GitHub account.');
    }

    const githubToken = profile.github_access_token;

    if (!githubToken || githubToken.trim() === '') {
      const errorMsg = 'GitHub token is empty in profiles table';
      console.error(`[GENERATION] ${errorMsg}`);
      await updateJob(repositoryId, {
        status: 'failed',
        progress: 0,
        current_step: 'Failed',
        error_message: 'GitHub token not available. Please reconnect your GitHub account in Settings.'
      });
      throw new Error('GitHub token not available. Please reconnect your GitHub account.');
    }

    console.log(`[GENERATION] GitHub token retrieved (length: ${githubToken.length})`);

    // ============================================================================
    // STEP 3: Validate GitHub Token (50% → 60%)
    // ============================================================================
    await updateJob(repositoryId, {
      progress: 50,
      current_step: 'Validating GitHub token'
    });
    console.log(`[GENERATION] Step 3: Validating GitHub token...`);

    const octokit = new Octokit({ auth: githubToken });
    
    try {
      // Make lightweight call to validate token
      const { data: user } = await octokit.users.getAuthenticated();
      console.log(`[GENERATION] Token validated for user: ${user.login}`);
    } catch (error: any) {
      const errorMsg = error.status === 401 
        ? 'GitHub token is invalid or expired. Please reconnect your GitHub account.'
        : `GitHub API error: ${error.message || 'Unknown error'}`;
      
      console.error(`[GENERATION] Token validation failed:`, errorMsg);
      await updateJob(repositoryId, {
        status: 'failed',
        progress: 0,
        current_step: 'Failed',
        error_message: errorMsg
      });
      throw new Error(errorMsg);
    }

    // ============================================================================
    // STEP 4: Fetch Repository Contents (60% → 70%)
    // ============================================================================
    await updateJob(repositoryId, {
      progress: 60,
      current_step: 'Fetching repository contents'
    });
    console.log(`[GENERATION] Step 4: Fetching repository contents from GitHub...`);
    
    let repoStructure: RepoStructure;
    try {
      repoStructure = await analyzeRepository(repo.repo_owner, repo.repo_name, githubToken);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to fetch repository from GitHub';
      console.error(`[GENERATION] Failed to fetch repository:`, errorMsg);
      await updateJob(repositoryId, {
        status: 'failed',
        progress: 0,
        current_step: 'Failed',
        error_message: `GitHub API error: ${errorMsg}`
      });
      throw new Error(`GitHub API error: ${errorMsg}`);
    }

    if (!repoStructure || !repoStructure.files || repoStructure.files.length === 0) {
      const errorMsg = 'Repository appears to be empty or inaccessible';
      console.error(`[GENERATION] ${errorMsg}`);
      await updateJob(repositoryId, {
        status: 'failed',
        progress: 0,
        current_step: 'Failed',
        error_message: errorMsg
      });
      throw new Error(errorMsg);
    }

    console.log(`[GENERATION] Found ${repoStructure.files.length} files in repository`);

    // ============================================================================
    // STEP 5: Generate Documentation Sections (70% → 85%)
    // ============================================================================
    await updateJob(repositoryId, {
      progress: 70,
      current_step: 'Generating documentation sections'
    });
    console.log(`[GENERATION] Step 5: Generating documentation sections...`);
    
    const fileTree = repoStructure.files.map(f => f.path);

    const sections: DocumentationSection[] = [];
    let totalScore = 100;
    const totalSections = checklistSchema.sections.length;

    for (let i = 0; i < checklistSchema.sections.length; i++) {
      const schemaSection = checklistSchema.sections[i];
      // Progress: 70% → 85% (15% for all sections)
      const sectionProgress = 70 + Math.floor((i / totalSections) * 15);
      
      await updateJob(repositoryId, {
        progress: sectionProgress,
        current_step: `Generating documentation: ${schemaSection.title}`
      });
      
      console.log(`[GENERATION] Processing section ${i + 1}/${totalSections}: ${schemaSection.id}`);

      // Analyze evidence for this section
      const analysis = analyzeEvidence(
        schemaSection.id,
        schemaSection.evidence_requirements,
        repoStructure.files,
        fileTree
      );

      // Determine status and confidence
      let status: 'complete' | 'partial' | 'missing';
      let confidence: 'verified' | 'inferred' | 'unverified' | 'missing';
      let content: string | null = null;
      let missing_reason: string | null = null;

      if (analysis.evidence.length === 0) {
        status = 'missing';
        confidence = 'missing';
        missing_reason = `Required evidence not found: ${analysis.missingEvidence.join(', ')}`;
        
        if (schemaSection.required) {
          totalScore -= 10; // Penalize missing required sections
        }
      } else if (analysis.hasRequiredEvidence) {
        status = 'complete';
        confidence = analysis.evidence.some(e => e.confidence === 'verified') 
          ? 'verified' 
          : 'inferred';
      } else {
        status = 'partial';
        confidence = analysis.evidence.some(e => e.confidence === 'verified')
          ? 'verified'
          : 'inferred';
        missing_reason = `Some evidence missing: ${analysis.missingEvidence.join(', ')}`;
        
        if (schemaSection.required) {
          totalScore -= 5; // Smaller penalty for partial
        }
      }

      // Generate content only if allowed and evidence exists
      if (schemaSection.ai_allowed && analysis.evidence.length > 0) {
        try {
          content = await generateSectionContent(
            schemaSection,
            repo,
            repoStructure,
            analysis
          );
          
          // If content is generated but seems uncertain, add warning
          if (content && confidence === 'inferred' || confidence === 'unverified') {
            content = `${content}\n\n⚠️ **Note:** This section was generated from inferred evidence. Please verify accuracy.`;
          }
        } catch (error) {
          console.error(`[AUDIT] Error generating content for ${schemaSection.id}:`, error);
          
          // Check if this is a critical error that should fail the entire job
          const isRateLimit = error && typeof error === 'object' && 'status' in error && error.status === 429;
          const isQuotaError = error && typeof error === 'object' && 'code' in error && error.code === 'insufficient_quota';
          
          if (isRateLimit || isQuotaError) {
            // Rate limit or quota exceeded - fail the entire job
            throw new Error(`OpenAI API rate limit or quota exceeded. Please check your OpenAI account billing and try again later. Original error: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
          
          // For other errors, continue with fallback content
          content = `⚠️ **Unable to generate content for this section.**\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease verify the evidence manually.`;
        }
      } else if (!schemaSection.ai_allowed && analysis.evidence.length === 0) {
        // Don't generate if not allowed and no evidence
        content = null;
      } else if (analysis.evidence.length === 0) {
        // No evidence found - mark explicitly
        content = `⚠️ **No evidence found for this section.**\n\nRequired evidence: ${schemaSection.evidence_requirements.join(', ')}\n\nPlease add the required files or configuration to enable documentation generation.`;
      }

      sections.push({
        id: schemaSection.id,
        title: schemaSection.title,
        status,
        confidence,
        evidence: analysis.evidence.map(e => e.file),
        content,
        missing_reason
      });
    }

    // Ensure score doesn't go below 0
    const overall_score = Math.max(0, totalScore);

    const result: DocumentationResult = {
      project_id: `${repo.repo_owner}/${repo.repo_name}`,
      overall_score,
      sections
    };

    // ============================================================================
    // STEP 6: Save Documentation to Database (85% → 100%)
    // ============================================================================
    await updateJob(repositoryId, {
      progress: 85,
      current_step: 'Finalizing output'
    });
    console.log(`[GENERATION] Step 6: Saving documentation to database...`);
    
    const markdownDocs = convertToMarkdown(result);
    
    // Save docs with status
    const { error: upsertError } = await supabase
      .from('generated_docs')
      .update({
        readme: markdownDocs.readme,
        api_docs: markdownDocs.api,
        setup_guide: markdownDocs.setup,
        architecture: markdownDocs.architecture,
        version: '1.0.0',
        generated_at: new Date().toISOString()
      })
      .eq('repository_id', repositoryId);

    if (upsertError) {
      console.error('[GENERATION] Failed to save docs to database:', upsertError);
      await updateJob(repositoryId, {
        status: 'failed',
        progress: 0,
        current_step: 'Failed',
        error_message: `Failed to save documentation: ${upsertError.message}`
      });
      throw new Error(`Failed to save documentation: ${upsertError.message}`);
    }

    // Update repositories table
    await supabase
      .from('repositories')
      .update({
        last_synced_at: new Date().toISOString(),
        docs_generated: true
      })
      .eq('id', repositoryId);

    // ============================================================================
    // STEP 7: Mark as Completed (100%)
    // ============================================================================
    await updateJob(repositoryId, {
      status: 'completed',
      progress: 100,
      current_step: 'Completed',
      error_message: null
    });

    console.log(`[GENERATION] Documentation generation completed successfully for ${repositoryId}`);
    return result;
    
  } catch (error) {
    // ============================================================================
    // ERROR HANDLING: Fail loudly and visibly
    // ============================================================================
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[GENERATION] Error in documentation generation:', error);
    console.error('[GENERATION] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    // Update job state to failed - this MUST succeed
    try {
      await updateJob(repositoryId, {
        status: 'failed',
        progress: 0,
        current_step: 'Failed',
        error_message: errorMessage
      });
      console.log(`[GENERATION] Job state updated to 'failed' for ${repositoryId}`);
    } catch (updateError) {
      // If even the error update fails, log it but don't throw
      // This prevents infinite loops
      console.error('[GENERATION] CRITICAL: Failed to update error status:', updateError);
    }
    
    // Re-throw to ensure caller knows generation failed
    throw error;
  }
}

async function generateSectionContent(
  schemaSection: any,
  repo: any,
  repoStructure: RepoStructure,
  analysis: SectionAnalysis
): Promise<string | null> {
  if (!openai) {
    console.error('[GENERATION] OpenAI client not available - cannot generate content');
    console.error('[GENERATION] Check that OPENAI_API_KEY is set in backend/.env');
    return `*AI documentation generation not configured. Please add OPENAI_API_KEY to backend/.env file and restart the server.*`;
  }

  // Build evidence context
  const evidenceFiles = analysis.evidence
    .map(e => {
      const file = repoStructure.files.find(f => f.path === e.file);
      if (!file) return null;
      return `File: ${file.path}\n\`\`\`${file.type}\n${file.content.substring(0, 2000)}\n\`\`\``;
    })
    .filter(Boolean)
    .join('\n\n');

  const systemPrompt = `You are DocDocs, an expert technical documentation system.

Your job is NOT to "write documentation freely".
Your job is to AUDIT a code repository against a documentation checklist,
then generate documentation ONLY where sufficient evidence exists.

You must follow ALL rules below.

────────────────────────────────────
CORE RULES (VIOLATIONS ARE FAILURES)
────────────────────────────────────

1. You MUST follow the provided Documentation Checklist Schema exactly.
2. You MUST NOT invent features, APIs, files, flows, or configuration.
3. You MUST link every documented claim to concrete evidence:
   - filenames
   - folders
   - code symbols
4. If evidence is missing, you MUST:
   - Mark the section as "Missing"
   - Explain what evidence is required
5. If you are unsure, you MUST say so explicitly.
6. NEVER guess silently.

────────────────────────────────────
SECTION RULES
────────────────────────────────────

- Required sections marked missing MUST reduce overall_score
- Optional sections do NOT affect score
- If any required section is missing → overall_score ≤ 90
- If hallucination is detected → FAIL ENTIRE OUTPUT

────────────────────────────────────
HALLUCINATION TEST (SELF-CHECK)
────────────────────────────────────

Before responding, ask yourself:

- Did I invent anything not explicitly supported?
- Did I describe behavior without code evidence?
- Did I forget to cite files?

If YES → REWRITE RESPONSE.

────────────────────────────────────
FINAL WARNING
────────────────────────────────────

Accuracy > Completeness.
Missing documentation is acceptable.
Incorrect documentation is NOT.`;

  const userPrompt = `Generate documentation for section: ${schemaSection.title}

Repository: ${repo.repo_name}
Owner: ${repo.repo_owner}
Description: ${repo.description || 'No description'}

Evidence found:
${evidenceFiles}

Requirements: ${schemaSection.evidence_requirements.join(', ')}

Instructions:
1. ONLY document what you can see in the evidence above
2. Use exact function/class names from the code
3. Cite files at the end of each paragraph: "Generated from: <file1>, <file2>"
4. If something is unclear, say "See code for details" rather than guessing
5. Do NOT invent features, APIs, or configuration

Generate markdown content for this section.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 2000,
      temperature: 0.2 // Very low for factual accuracy
    });

    const content = completion.choices[0]?.message?.content || null;
    
    // Ensure source attribution
    if (content && !content.includes('Generated from:')) {
      const evidenceList = analysis.evidence.map(e => e.file).join(', ');
      return `${content}\n\nGenerated from: ${evidenceList}`;
    }

    return content;
  } catch (error) {
    console.error(`[AUDIT] Error generating content for ${schemaSection.id}:`, error);
    
    // Check if this is a critical error that should fail the entire job
    const isRateLimit = error && typeof error === 'object' && 'status' in error && error.status === 429;
    const isQuotaError = error && typeof error === 'object' && 'code' in error && error.code === 'insufficient_quota';
    
    if (isRateLimit || isQuotaError) {
      // Re-throw critical errors to fail the entire job
      throw error;
    }
    
    // For other errors, return null to use fallback content
    return null;
  }
}

function convertToMarkdown(result: DocumentationResult): {
  readme: string;
  api: string;
  setup: string;
  architecture: string;
} {
  const readmeSection = result.sections.find(s => s.id === 'project_overview');
  const apiSection = result.sections.find(s => s.id === 'api_reference');
  const setupSection = result.sections.find(s => s.id === 'installation');
  const archSection = result.sections.find(s => s.id === 'architecture');

  return {
    readme: readmeSection?.content || '# Project Overview\n\n*Documentation generation in progress...*',
    api: apiSection?.content || '# API Reference\n\n*No API documentation available*',
    setup: setupSection?.content || '# Installation & Setup\n\n*Setup instructions not available*',
    architecture: archSection?.content || '# Architecture\n\n*Architecture documentation not available*'
  };
}
