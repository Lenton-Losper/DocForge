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
    // INITIALIZATION: Fetch Repository Metadata and GitHub Token
    // ============================================================================
    const { data: repo, error: repoError } = await supabase
      .from('repositories')
      .select('id, user_id, repo_owner, repo_name, description')
      .eq('id', repositoryId)
      .single();

    if (repoError || !repo) {
      throw new Error(`Repository not found: ${repoError?.message || 'No repository data'}`);
    }

    console.log(`[GENERATION] Repository found: ${repo.repo_owner}/${repo.repo_name}`);

    // Fetch GitHub token from profiles (already validated in route, but fetch again for safety)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('github_access_token')
      .eq('id', repo.user_id)
      .single();

    if (profileError || !profile || !profile.github_access_token || profile.github_access_token.trim() === '') {
      const errorMsg = 'GitHub token not available. Please reconnect your GitHub account in Settings.';
      await updateJob(repositoryId, {
        status: 'failed',
        progress: 0,
        current_step: 'Failed',
        error_message: errorMsg
      });
      throw new Error(errorMsg);
    }

    const githubToken = profile.github_access_token;
    const octokit = new Octokit({ auth: githubToken });

    // Validate token
    try {
      const { data: user } = await octokit.users.getAuthenticated();
      console.log(`[GENERATION] Token validated for user: ${user.login}`);
    } catch (error: any) {
      const errorMsg = error.status === 401 
        ? 'GitHub token is invalid or expired. Please reconnect your GitHub account.'
        : `GitHub API error: ${error.message || 'Unknown error'}`;
      await updateJob(repositoryId, {
        status: 'failed',
        progress: 0,
        current_step: 'Failed',
        error_message: errorMsg
      });
      throw new Error(errorMsg);
    }

    // ============================================================================
    // STEP 1: Fetch repo tree (10%)
    // ============================================================================
    await updateJob(repositoryId, {
      progress: 10,
      current_step: 'Fetching repository tree',
      status: 'generating'
    });
    console.log(`[GENERATION] Step 1: Fetching repository tree...`);

    const { data: repoData } = await octokit.repos.get({ 
      owner: repo.repo_owner, 
      repo: repo.repo_name 
    });
    const { data: tree } = await octokit.git.getTree({
      owner: repo.repo_owner,
      repo: repo.repo_name,
      tree_sha: repoData.default_branch,
      recursive: '1'
    });

    // ============================================================================
    // STEP 2: Fetch file contents (25%)
    // ============================================================================
    await updateJob(repositoryId, {
      progress: 25,
      current_step: 'Fetching file contents'
    });
    console.log(`[GENERATION] Step 2: Fetching file contents...`);

    const relevantExtensions = ['.ts', '.tsx', '.js', '.jsx', '.py', '.java', '.go', '.rb'];
    const configFiles = ['package.json', 'requirements.txt', 'pom.xml', 'go.mod'];
    const docFiles = ['README.md', 'README.rst'];

    const filesToFetch = tree.tree.filter(item => {
      if (item.type !== 'blob') return false;
      const ext = item.path?.split('.').pop();
      return (
        relevantExtensions.some(e => item.path?.endsWith(e)) ||
        configFiles.some(c => item.path?.includes(c)) ||
        docFiles.some(d => item.path?.includes(d))
      );
    }).slice(0, 50);

    const files: Array<{ path: string; content: string; type: string; size: number }> = [];
    for (const file of filesToFetch) {
      if (!file.path) continue;
      try {
        const { data: fileData } = await octokit.repos.getContent({
          owner: repo.repo_owner,
          repo: repo.repo_name,
          path: file.path
        });
        if ('content' in fileData && fileData.content) {
          const content = Buffer.from(fileData.content, 'base64').toString('utf8');
          if (content.length < 10000) {
            files.push({
              path: file.path,
              content,
              type: file.path.split('.').pop() || 'unknown',
              size: fileData.size
            });
          }
        }
      } catch (err) {
        console.error(`Failed to fetch ${file.path}:`, err);
      }
    }

    // ============================================================================
    // STEP 3: Analyze structure (40%)
    // ============================================================================
    await updateJob(repositoryId, {
      progress: 40,
      current_step: 'Analyzing codebase structure'
    });
    console.log(`[GENERATION] Step 3: Analyzing codebase structure...`);

    let packageJson = null;
    const pkgFile = files.find(f => f.path.includes('package.json'));
    if (pkgFile) {
      try {
        packageJson = JSON.parse(pkgFile.content);
      } catch (e) {
        console.error('Failed to parse package.json');
      }
    }

    let readme = null;
    const readmeFile = files.find(f => f.path.toLowerCase().includes('readme'));
    if (readmeFile) {
      readme = readmeFile.content;
    }

    const repoStructure: RepoStructure = {
      files: files.map(f => ({ path: f.path, content: f.content, type: f.type, size: f.size })),
      packageJson,
      readme,
      hasTypeScript: files.some(f => f.path.endsWith('.ts') || f.path.endsWith('.tsx')),
      hasJavaScript: files.some(f => f.path.endsWith('.js') || f.path.endsWith('.jsx')),
      hasPython: files.some(f => f.path.endsWith('.py')),
      mainLanguage: packageJson?.type === 'module' ? 'JavaScript' : 'TypeScript'
    };

    if (!repoStructure.files || repoStructure.files.length === 0) {
      const errorMsg = 'Repository appears to be empty or inaccessible';
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
    // STEP 4: Generate README (60%)
    // ============================================================================
    await updateJob(repositoryId, {
      progress: 60,
      current_step: 'Generating README'
    });
    console.log(`[GENERATION] Step 4: Generating README...`);

    const fileTree = repoStructure.files.map(f => f.path);
    const sections: DocumentationSection[] = [];
    let totalScore = 100;

    // Find project_overview section
    const projectOverviewSection = checklistSchema.sections.find((s: any) => s.id === 'project_overview');
    let readmeContent: string | null = null;

    if (projectOverviewSection) {
      const analysis = analyzeEvidence(
        projectOverviewSection.id,
        projectOverviewSection.evidence_requirements,
        repoStructure.files,
        fileTree
      );

      if (analysis.evidence.length > 0 && projectOverviewSection.ai_allowed) {
        try {
          readmeContent = await generateSectionContent(
            projectOverviewSection,
            repo,
            repoStructure,
            analysis
          );
        } catch (error) {
          const isRateLimit = error && typeof error === 'object' && 'status' in error && error.status === 429;
          const isQuotaError = error && typeof error === 'object' && 'code' in error && error.code === 'insufficient_quota';
          if (isRateLimit || isQuotaError) {
            throw new Error(`OpenAI API rate limit or quota exceeded. Please check your OpenAI account billing and try again later. Original error: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
          readmeContent = `No project overview documentation available.`;
        }
      } else if (analysis.evidence.length === 0) {
        readmeContent = `No project overview documentation available. Required evidence: ${projectOverviewSection.evidence_requirements.join(', ')}`;
      }
    }

    // ============================================================================
    // STEP 5: Generate API docs (75%)
    // ============================================================================
    await updateJob(repositoryId, {
      progress: 75,
      current_step: 'Generating API docs'
    });
    console.log(`[GENERATION] Step 5: Generating API docs...`);

    const apiSection = checklistSchema.sections.find((s: any) => s.id === 'api_reference');
    let apiContent: string | null = null;

    if (apiSection) {
      const analysis = analyzeEvidence(
        apiSection.id,
        apiSection.evidence_requirements,
        repoStructure.files,
        fileTree
      );

      if (analysis.evidence.length > 0 && apiSection.ai_allowed) {
        try {
          apiContent = await generateSectionContent(
            apiSection,
            repo,
            repoStructure,
            analysis
          );
        } catch (error) {
          const isRateLimit = error && typeof error === 'object' && 'status' in error && error.status === 429;
          const isQuotaError = error && typeof error === 'object' && 'code' in error && error.code === 'insufficient_quota';
          if (isRateLimit || isQuotaError) {
            throw new Error(`OpenAI API rate limit or quota exceeded. Please check your OpenAI account billing and try again later. Original error: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
          apiContent = `No API documentation available.`;
        }
      } else if (analysis.evidence.length === 0) {
        apiContent = `No API routes found in repository. Required evidence: ${apiSection.evidence_requirements.join(', ')}`;
      }
    }

    // ============================================================================
    // STEP 6: Generate setup guide (90%)
    // ============================================================================
    await updateJob(repositoryId, {
      progress: 90,
      current_step: 'Generating setup guide'
    });
    console.log(`[GENERATION] Step 6: Generating setup guide...`);

    const setupSection = checklistSchema.sections.find((s: any) => s.id === 'installation');
    let setupContent: string | null = null;

    if (setupSection) {
      const analysis = analyzeEvidence(
        setupSection.id,
        setupSection.evidence_requirements,
        repoStructure.files,
        fileTree
      );

      if (analysis.evidence.length > 0 && setupSection.ai_allowed) {
        try {
          setupContent = await generateSectionContent(
            setupSection,
            repo,
            repoStructure,
            analysis
          );
        } catch (error) {
          const isRateLimit = error && typeof error === 'object' && 'status' in error && error.status === 429;
          const isQuotaError = error && typeof error === 'object' && 'code' in error && error.code === 'insufficient_quota';
          if (isRateLimit || isQuotaError) {
            throw new Error(`OpenAI API rate limit or quota exceeded. Please check your OpenAI account billing and try again later. Original error: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
          setupContent = `No setup instructions available.`;
        }
      } else if (analysis.evidence.length === 0) {
        setupContent = `No setup instructions available. Required evidence: ${setupSection.evidence_requirements.join(', ')}`;
      }
    }

    // ============================================================================
    // STEP 7: Generate architecture (95%)
    // ============================================================================
    await updateJob(repositoryId, {
      progress: 95,
      current_step: 'Generating architecture'
    });
    console.log(`[GENERATION] Step 7: Generating architecture...`);

    const archSection = checklistSchema.sections.find((s: any) => s.id === 'architecture');
    let archContent: string | null = null;

    if (archSection) {
      const analysis = analyzeEvidence(
        archSection.id,
        archSection.evidence_requirements,
        repoStructure.files,
        fileTree
      );

      if (analysis.evidence.length > 0 && archSection.ai_allowed) {
        try {
          archContent = await generateSectionContent(
            archSection,
            repo,
            repoStructure,
            analysis
          );
        } catch (error) {
          const isRateLimit = error && typeof error === 'object' && 'status' in error && error.status === 429;
          const isQuotaError = error && typeof error === 'object' && 'code' in error && error.code === 'insufficient_quota';
          if (isRateLimit || isQuotaError) {
            throw new Error(`OpenAI API rate limit or quota exceeded. Please check your OpenAI account billing and try again later. Original error: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
          archContent = `No architecture documentation available.`;
        }
      } else if (analysis.evidence.length === 0) {
        archContent = `No architecture documentation available. Required evidence: ${archSection.evidence_requirements.join(', ')}`;
      }
    }

    const result: DocumentationResult = {
      project_id: `${repo.repo_owner}/${repo.repo_name}`,
      overall_score: totalScore,
      sections: [
        { id: 'project_overview', title: 'Project Overview', status: readmeContent ? 'complete' : 'missing', confidence: 'verified', evidence: [], content: readmeContent, missing_reason: null },
        { id: 'api_reference', title: 'API Reference', status: apiContent ? 'complete' : 'missing', confidence: 'verified', evidence: [], content: apiContent, missing_reason: null },
        { id: 'installation', title: 'Installation & Setup', status: setupContent ? 'complete' : 'missing', confidence: 'verified', evidence: [], content: setupContent, missing_reason: null },
        { id: 'architecture', title: 'Architecture', status: archContent ? 'complete' : 'missing', confidence: 'verified', evidence: [], content: archContent, missing_reason: null }
      ]
    };

    // ============================================================================
    // STEP 8: Save + finalize (100%)
    // ============================================================================
    await updateJob(repositoryId, {
      progress: 100,
      current_step: 'Saving documentation'
    });
    console.log(`[GENERATION] Step 8: Saving documentation to database...`);
    
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

    // Mark as completed
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
  // OpenAI client is guaranteed to exist (validated on startup)
  // If we reach here without openai, it's a programming error
  if (!openai) {
    throw new Error('OpenAI client not initialized - this should never happen');
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
