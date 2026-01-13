/**
 * Deterministic Documentation Generator
 * 
 * Generates documentation from verifiable evidence only.
 * NO AI, NO GUESSING - always succeeds, never fails.
 */

import { createClient } from '@supabase/supabase-js';
import { Octokit } from '@octokit/rest';
import { analyzeRepository, RepoStructure } from './repositoryAnalyzer.js';
import { extractEvidence, RepoEvidence } from './evidenceExtractor.js';
import { buildReadme, buildSetupGuide, buildApiDocs, buildArchitecture } from './docBuilders/index.js';
import { updateJob } from './jobStateManager.js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface GenerationResult {
  readme: string;
  api_docs: string;
  setup_guide: string;
  architecture: string;
}

/**
 * Generate documentation deterministically from repository evidence.
 * This function NEVER throws - it always produces output.
 */
export async function generateDeterministicDocs(
  repositoryId: string
): Promise<GenerationResult> {
  let repo: any = null;
  let githubToken: string = '';
  let repoStructure: RepoStructure | null = null;
  let evidence: RepoEvidence | null = null;

  try {
    // ============================================================================
    // STEP 1: Fetch Repository Metadata (10%)
    // ============================================================================
    await updateJob(repositoryId, {
      progress: 10,
      current_step: 'Fetching repository metadata',
      status: 'generating'
    });

    const { data: repoData, error: repoError } = await supabase
      .from('repositories')
      .select('id, user_id, repo_owner, repo_name, description')
      .eq('id', repositoryId)
      .single();

    if (repoError || !repoData) {
      throw new Error(`Repository not found: ${repoError?.message || 'No repository data'}`);
    }

    repo = repoData;
    console.log(`[DETERMINISTIC] Repository: ${repo.repo_owner}/${repo.repo_name}`);

    // ============================================================================
    // STEP 2: Fetch GitHub Token (25%)
    // ============================================================================
    await updateJob(repositoryId, {
      progress: 25,
      current_step: 'Fetching GitHub authentication'
    });

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('github_access_token')
      .eq('id', repo.user_id)
      .single();

    if (profileError || !profile || !profile.github_access_token) {
      // Generate minimal docs without GitHub access
      return generateMinimalDocs(repo, 'GitHub token not available');
    }

    githubToken = profile.github_access_token;

    // Validate token
    const octokit = new Octokit({ auth: githubToken });
    try {
      await octokit.users.getAuthenticated();
    } catch (error: any) {
      if (error.status === 401) {
        return generateMinimalDocs(repo, 'GitHub token is invalid or expired');
      }
      // Continue anyway - might be temporary issue
    }

    // ============================================================================
    // STEP 3: Fetch Repository Contents (40%)
    // ============================================================================
    await updateJob(repositoryId, {
      progress: 40,
      current_step: 'Fetching repository contents'
    });

    try {
      repoStructure = await analyzeRepository(repo.repo_owner, repo.repo_name, githubToken);
    } catch (error) {
      console.error(`[DETERMINISTIC] Failed to fetch repository:`, error);
      return generateMinimalDocs(repo, 'Failed to fetch repository from GitHub');
    }

    if (!repoStructure || !repoStructure.files || repoStructure.files.length === 0) {
      return generateMinimalDocs(repo, 'Repository appears to be empty');
    }

    console.log(`[DETERMINISTIC] Found ${repoStructure.files.length} files`);

    // ============================================================================
    // STEP 4: Extract Evidence (60%)
    // ============================================================================
    await updateJob(repositoryId, {
      progress: 60,
      current_step: 'Extracting evidence from repository'
    });

    try {
      evidence = extractEvidence(repoStructure, repo.repo_owner, repo.repo_name);
    } catch (error) {
      console.error(`[DETERMINISTIC] Error extracting evidence:`, error);
      // Continue with minimal evidence
      evidence = {
        meta: { name: repo.repo_name, languages: [] },
        files: {
          hasReadme: false,
          hasPackageJson: false,
          hasEnvExample: false,
          hasDocker: false,
          hasTests: false,
          hasGitignore: false,
          hasLicense: false,
        },
        stack: {},
        scripts: [],
        dependencies: [],
        devDependencies: [],
        apiEvidence: { routes: [], controllersFound: false, hasApiFolder: false },
        structure: { folders: [], entryFiles: [], configFiles: [] },
      };
    }

    // ============================================================================
    // STEP 5: Generate Documentation Sections (75% → 95%)
    // ============================================================================
    await updateJob(repositoryId, {
      progress: 75,
      current_step: 'Generating README'
    });

    let readme: string;
    try {
      readme = buildReadme(evidence);
    } catch (error) {
      console.error(`[DETERMINISTIC] Error building README:`, error);
      readme = `# ${repo.repo_name}\n\n*Documentation generation encountered an error.*\n`;
    }

    await updateJob(repositoryId, {
      progress: 80,
      current_step: 'Generating setup guide'
    });

    let setupGuide: string;
    try {
      setupGuide = buildSetupGuide(evidence);
    } catch (error) {
      console.error(`[DETERMINISTIC] Error building setup guide:`, error);
      setupGuide = `# Installation & Setup Guide\n\n*Setup guide generation encountered an error.*\n`;
    }

    await updateJob(repositoryId, {
      progress: 85,
      current_step: 'Generating API documentation'
    });

    let apiDocs: string;
    try {
      apiDocs = buildApiDocs(evidence);
    } catch (error) {
      console.error(`[DETERMINISTIC] Error building API docs:`, error);
      apiDocs = `# API Reference\n\n*API documentation generation encountered an error.*\n`;
    }

    await updateJob(repositoryId, {
      progress: 90,
      current_step: 'Generating architecture documentation'
    });

    let architecture: string;
    try {
      architecture = buildArchitecture(evidence);
    } catch (error) {
      console.error(`[DETERMINISTIC] Error building architecture:`, error);
      architecture = `# Architecture & Design\n\n*Architecture documentation generation encountered an error.*\n`;
    }

    // ============================================================================
    // STEP 6: Save Results (100%)
    // ============================================================================
    await updateJob(repositoryId, {
      progress: 100,
      current_step: 'Completed',
      status: 'completed',
      error_message: null
    });

    return {
      readme,
      api_docs: apiDocs,
      setup_guide: setupGuide,
      architecture
    };

  } catch (error) {
    // CRITICAL: This function must NEVER throw
    // If we reach here, generate minimal docs and mark as completed
    console.error(`[DETERMINISTIC] Unexpected error:`, error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Generate minimal docs
    const minimalDocs = generateMinimalDocs(
      repo || { repo_name: 'Unknown', repo_owner: 'Unknown' },
      errorMessage
    );

    // Update status - but mark as completed (not failed) since we have docs
    try {
      await updateJob(repositoryId, {
        status: 'completed',
        progress: 100,
        current_step: 'Completed (with errors)',
        error_message: `Documentation generated with limitations: ${errorMessage}`
      });
    } catch (updateError) {
      // Even if update fails, return the docs
      console.error(`[DETERMINISTIC] Failed to update status:`, updateError);
    }

    return minimalDocs;
  }
}

/**
 * Generate minimal documentation when full generation is not possible.
 * This ensures we always return something useful.
 */
function generateMinimalDocs(repo: any, reason: string): GenerationResult {
  const name = repo.repo_name || 'Project';
  const owner = repo.repo_owner || 'Unknown';

  return {
    readme: `# ${name}\n\n**Repository:** ${owner}/${name}\n\n*Documentation generation was limited: ${reason}*\n\n## Next Steps\n\nTo generate complete documentation:\n- Ensure GitHub token is valid and has repository access\n- Verify repository is not empty\n- Check repository permissions\n`,
    api_docs: `# API Reference\n\n*API documentation could not be generated: ${reason}*\n\n## To Enable API Documentation\n\n1. Ensure repository is accessible\n2. Add API routes to the codebase\n3. Use standard routing patterns\n`,
    setup_guide: `# Installation & Setup Guide\n\n*Setup guide could not be generated: ${reason}*\n\n## Basic Setup\n\n1. Clone the repository\n2. Install dependencies (if applicable)\n3. Configure environment variables\n4. Run the application\n`,
    architecture: `# Architecture & Design\n\n*Architecture documentation could not be generated: ${reason}*\n\n## Project Information\n\n- **Repository:** ${owner}/${name}\n- **Status:** Limited documentation available\n\nTo generate complete architecture documentation, ensure the repository is accessible and contains source code.\n`
  };
}
