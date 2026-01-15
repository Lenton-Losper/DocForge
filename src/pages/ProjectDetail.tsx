/** Project detail page - Documentation viewer. */
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase.js';
import { 
  ArrowLeft, 
  RefreshCw, 
  Download, 
  FileText, 
  Code, 
  Settings as SettingsIcon,
  Box,
  Loader2,
  AlertCircle,
  Wand2,
  Sparkles,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { aiApi } from '../lib/aiApi.js';
import ReactMarkdown from 'react-markdown';
import { 
  GeneratedDocsRow, 
  parseGenerationState, 
  FrontendGenerationStatus 
} from '../types/generation.js';

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [repository, setRepository] = useState<any>(null);
  const [docs, setDocs] = useState<GeneratedDocsRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('readme');
  const [isRegenerating, setIsRegenerating] = useState(false); // Local state to prevent spam
  const [docsStatus, setDocsStatus] = useState<FrontendGenerationStatus>('not_started');
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<string>('');
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  
  // AI features state
  const [improvingReadme, setImprovingReadme] = useState(false);
  const [generatingDiagram, setGeneratingDiagram] = useState(false);
  const [ollamaHealthy, setOllamaHealthy] = useState(false);
  const [ollamaChecking, setOllamaChecking] = useState(true);
  const [showImprovedReadme, setShowImprovedReadme] = useState(false);
  const [improvedContent, setImprovedContent] = useState('');
  const [aiError, setAiError] = useState<string | null>(null);
  const [realReadmeContent, setRealReadmeContent] = useState<string>('');
  
  // Test mode for known repositories
  const [testMode, setTestMode] = useState(false);
  const [testRepo, setTestRepo] = useState('facebook/react');
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorDialogData, setErrorDialogData] = useState<{
    title: string;
    message: string;
    suggestions: string[];
    actions: { label: string; onClick: () => void; primary?: boolean }[];
  } | null>(null);
  
  // List of known working test repositories
  const TEST_REPOSITORIES = [
    { name: 'React', value: 'facebook/react', description: 'Popular UI library' },
    { name: 'Vue.js', value: 'vuejs/core', description: 'Progressive framework' },
    { name: 'TypeScript', value: 'microsoft/TypeScript', description: 'Typed JavaScript' },
    { name: 'Node.js', value: 'nodejs/node', description: 'JavaScript runtime' },
    { name: 'Express', value: 'expressjs/express', description: 'Web framework' },
    { name: 'Fastify', value: 'fastify/fastify', description: 'Fast web framework' },
    { name: 'Next.js', value: 'vercel/next.js', description: 'React framework' },
  ];
  
  // Track if an AI request is in progress to pause health checks
  const aiRequestInProgress = useRef(false);

  // Check Ollama health on mount
  useEffect(() => {
    const checkHealth = async () => {
      // Skip health check if an AI request is in progress
      if (aiRequestInProgress.current) {
        console.log('[AI] Skipping health check - AI request in progress');
        return;
      }
      
      try {
        console.log('[AI] Starting health check...');
        const health = await aiApi.checkHealth();
        console.log('[AI] Health check result:', health);
        
        // FIX: Check the actual healthy property, not just response existence
        const isHealthy = health && health.healthy === true && health.models && health.models.length > 0;
        
        console.log('[AI] Is Healthy:', isHealthy);
        console.log('[AI] Models:', health?.models);
        
        setOllamaHealthy(isHealthy);
        if (health.error) {
          setAiError(health.error);
        } else {
          setAiError(null);
        }
      } catch (error) {
        console.error('[AI] Health check failed:', error);
        // Don't mark as unhealthy if it's just a timeout during an AI request
        if (!aiRequestInProgress.current) {
          setOllamaHealthy(false);
          setAiError(error instanceof Error ? error.message : 'Failed to check AI status');
        }
      } finally {
        setOllamaChecking(false);
      }
    };
    
    checkHealth();
    
    // Re-check every 30 seconds (but will skip if AI request is in progress)
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!id) return;

    let interval: NodeJS.Timeout | null = null;

    // Initial fetch
    fetchRepositoryAndDocs().then(status => {
      // If generation is in progress, start polling automatically
      if (status === 'generating') {
        interval = setInterval(async () => {
          try {
            const currentStatus = await fetchRepositoryAndDocs();
            if (currentStatus === 'complete' || currentStatus === 'failed') {
              if (interval) {
                clearInterval(interval);
                setPollingInterval(null);
              }
            }
          } catch (error) {
            console.error('[PROJECT-DETAIL] Polling error:', error);
          }
        }, 2500); // Poll every 2.5 seconds (2-3 second range)
        setPollingInterval(interval);
      }
    }).catch(err => {
      console.error('[PROJECT-DETAIL] Error fetching repository and docs:', err);
      setLoading(false);
    });
    
    // Cleanup: Clear polling interval on unmount
    return () => {
      if (interval) {
        clearInterval(interval);
      }
      if (pollingInterval) {
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }
    };
  }, [id]);

  async function fetchRepositoryAndDocs(): Promise<FrontendGenerationStatus | undefined> {
    try {
      setLoading(true);

      // Fetch repository
      const { data: repo, error: repoError } = await supabase
        .from('repositories')
        .select('*')
        .eq('id', id)
        .single();

      if (repoError || !repo) {
        console.error('Repository not found:', repoError);
        setLoading(false);
        alert('Repository not found');
        navigate('/projects');
        return;
      }

      setRepository(repo);

      // ============================================================================
      // Stable Query: Select all confirmed columns from generated_docs
      // ============================================================================
      // This query assumes the migration has been run.
      // If columns don't exist, Supabase will return them as null/undefined,
      // which our parser handles gracefully.
      // 
      // We use .limit(1) instead of .single() to avoid 406 errors when no row exists.
      // This is array-safe and treats "no docs" as a normal state, not an error.
      // ============================================================================
      const { data: docsArray, error: docsError } = await supabase
        .from('generated_docs')
        .select(`
          id,
          repository_id,
          readme,
          api_docs,
          setup_guide,
          architecture,
          version,
          generated_at,
          updated_at,
          status,
          progress,
          current_step,
          error_message,
          generation_started_at
        `)
        .eq('repository_id', id)
        .limit(1);

      // ============================================================================
      // Safe Parsing: Handle query results with graceful defaults
      // ============================================================================
      // The parser handles:
      // - No row exists (docsArray is null or empty) → 'not_started' state
      // - Row exists but status is null → infers from content
      // - Progress is null → defaults to 0
      // - All text fields null → defaults to empty strings
      // ============================================================================
      if (docsError) {
        // Check if it's a "not found" error (expected when docs don't exist)
        // Supabase error codes: PGRST116 = no rows, 406 = not acceptable
        const isNotFoundError = 
          docsError.code === 'PGRST116' || 
          docsError.code === '406' ||
          docsError.message?.includes('No rows') ||
          docsError.message?.includes('not found');
        
        if (isNotFoundError) {
          // Docs not generated yet - this is normal, not an error
          // Use parser with null to get safe defaults
          const parsed = parseGenerationState(null);
          setDocs(null);
          setDocsStatus(parsed.status);
          setProgress(parsed.progress);
          setCurrentStep(parsed.currentStep);
          setLoading(false);
          return parsed.status;
        } else {
          // Unexpected error - log but don't crash
          console.warn('[FETCH] Unexpected error fetching docs:', docsError);
          const parsed = parseGenerationState(null);
          setDocs(null);
          setDocsStatus(parsed.status);
          setProgress(parsed.progress);
          setCurrentStep(parsed.currentStep);
          setLoading(false);
          return parsed.status;
        }
      } else if (docsArray && docsArray.length > 0) {
        // Row exists - parse it safely
        const rawRow: GeneratedDocsRow = docsArray[0];
        const parsed = parseGenerationState(rawRow);
        
        setDocs(rawRow);
        setDocsStatus(parsed.status);
        setProgress(parsed.progress);
        setCurrentStep(parsed.currentStep);

        // Re-enable regenerate button when status is completed or failed
        if (parsed.status === 'complete' || parsed.status === 'failed') {
          setIsRegenerating(false);
          
          // Stop polling if we have a final state
          if (pollingInterval) {
            clearInterval(pollingInterval);
            setPollingInterval(null);
          }
        }
        
        setLoading(false);
        // Return status for polling to check
        return parsed.status;
      } else {
        // No row found - use parser defaults
        const parsed = parseGenerationState(null);
        setDocs(null);
        setDocsStatus(parsed.status);
        setProgress(parsed.progress);
        setCurrentStep(parsed.currentStep);
        
        setLoading(false);
        return parsed.status;
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setDocsStatus('failed');
      setLoading(false);
      return 'failed';
    }
  }

  async function handleRegenerate() {
    // Prevent spam clicks - check local state AND backend status
    // Frontend is read-only - only disable button, don't update state optimistically
    if (isRegenerating || docsStatus === 'generating') {
      console.warn('[REGENERATE] Generation already in progress or button locked');
      return;
    }

    if (docsStatus === 'complete' && !confirm('Regenerate documentation? This will overwrite existing docs.')) {
      return;
    }

    try {
      // Lock button to prevent spam (read-only - no optimistic state updates)
      setIsRegenerating(true);

      // Get session and validate
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('[REGENERATE] Session error:', sessionError);
        setIsRegenerating(false);
        throw new Error('Failed to get session: ' + sessionError.message);
      }

      if (!session?.access_token) {
        console.error('[REGENERATE] No access token in session');
        setIsRegenerating(false);
        throw new Error('Not authenticated. Please log in again.');
      }

      if (!id) {
        console.error('[REGENERATE] No repository ID');
        setIsRegenerating(false);
        throw new Error('Repository ID is missing');
      }

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const requestBody = { repository_id: id };

      console.log('[REGENERATE] Sending request:', {
        url: `${apiUrl}/api/generate-docs`,
        method: 'POST',
        hasToken: !!session.access_token,
        repository_id: id
      });

      const response = await fetch(`${apiUrl}/api/generate-docs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(requestBody)
      });

      // Parse response
      const responseData = await response.json().catch(() => ({}));

      if (!response.ok) {
        console.error('[REGENERATE] Request failed:', {
          status: response.status,
          statusText: response.statusText,
          data: responseData
        });
        
        setIsRegenerating(false);
        
        let errorMessage = 'Failed to regenerate documentation';
        if (response.status === 400) {
          errorMessage = responseData.error || responseData.message || 'Invalid request. Check repository ID.';
        } else if (response.status === 401) {
          errorMessage = 'Authentication failed. Please log in again.';
        } else if (response.status === 404) {
          errorMessage = 'Repository not found or access denied.';
        } else if (response.status === 409) {
          errorMessage = responseData.error || 'Documentation generation is already in progress';
        } else if (response.status >= 500) {
          errorMessage = 'Server error. Please try again later.';
        }
        
        throw new Error(errorMessage);
      }

      console.log('[REGENERATE] Generation started:', responseData);

      // Start polling for progress updates (every 2-3 seconds as required)
      // Frontend is read-only - fetch state from database
      const startPolling = () => {
        const interval = setInterval(async () => {
          try {
            // fetchRepositoryAndDocs returns the status - read-only, no optimistic updates
            const status = await fetchRepositoryAndDocs();
            
            // Check if we should stop polling based on returned status
            if (status === 'complete' || status === 'failed') {
              clearInterval(interval);
              setPollingInterval(null);
              setIsRegenerating(false); // Re-enable button
            }
          } catch (error) {
            // Handle errors in polling to prevent unhandled promise rejections
            console.error('[REGENERATE] Polling error:', error);
            // Don't stop polling on error - might be temporary network issue
          }
        }, 2500); // Poll every 2.5 seconds (2-3 second range)
        
        setPollingInterval(interval);
      };

      startPolling();
    } catch (err) {
      console.error('[REGENERATE] Error:', err);
      setIsRegenerating(false); // Re-enable button on error
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to regenerate documentation';
      alert(errorMessage);
    }
  }

  async function handleExport(format: 'markdown' | 'pdf') {
    if (!docs) {
      alert('No documentation to export');
      return;
    }

    if (format === 'markdown') {
      // Export as markdown file
      const content = `# ${repository.repo_name}\n\n${docs.readme}\n\n## API Documentation\n\n${docs.api_docs}\n\n## Setup Guide\n\n${docs.setup_guide}\n\n## Architecture\n\n${docs.architecture}`;
      
      const blob = new Blob([content], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${repository.repo_name}-docs.md`;
      a.click();
    } else {
      alert('PDF export coming soon!');
    }
  }

  /**
   * Verify and correct GitHub repository URL
   * @param url - Raw repository URL from project data
   * @returns Corrected URL or null if invalid
   */
  const verifyRepositoryUrl = (url: string): string | null => {
    try {
      console.log('[VERIFY] Checking repository URL:', url);
      
      // Remove trailing slashes
      let cleanUrl = url.trim().replace(/\/+$/, '');
      
      // Handle common issues - case sensitivity corrections
      const corrections: { [key: string]: string } = {
        'Tap-n-Munch': 'tap-n-munch',
        'tap-N-munch': 'tap-n-munch',
        'Tap-N-Munch': 'tap-n-munch',
      };
      
      // Apply corrections
      Object.entries(corrections).forEach(([wrong, correct]) => {
        if (cleanUrl.includes(wrong)) {
          console.log(`[VERIFY] Correcting: ${wrong} → ${correct}`);
          cleanUrl = cleanUrl.replace(wrong, correct);
        }
      });
      
      console.log('[VERIFY] Corrected URL:', cleanUrl);
      return cleanUrl;
      
    } catch (error) {
      console.error('[VERIFY] Error verifying URL:', error);
      return null;
    }
  };

  /**
   * Extract repository URL from project data
   * Checks multiple possible locations
   */
  const getRepositoryUrl = (): string | null => {
    console.log('[REPO] Detecting repository URL from project data...');
    console.log('[REPO] Repository data:', repository);
    
    // Check common locations for repository URL
    const possibleUrls = [
      repository?.repo_url,
      repository?.repository_url,
      repository?.url,
      repository?.github_url,
      repository?.git_url,
      repository?.source_url,
    ];
    
    // Find first non-null URL
    for (const url of possibleUrls) {
      if (url && typeof url === 'string' && url.trim().length > 0) {
        console.log('[REPO] Found URL in repository data:', url);
        return url;
      }
    }
    
    // Fallback: construct from owner/repo if available
    if (repository?.repo_owner && repository?.repo_name) {
      const constructed = `${repository.repo_owner}/${repository.repo_name}`;
      console.log('[REPO] Constructed URL from owner/repo:', constructed);
      return constructed;
    }
    
    console.warn('[REPO] ⚠️ No repository URL found in repository data');
    return null;
  };

  /**
   * Check if a GitHub repository exists
   * @param owner - Repository owner
   * @param repo - Repository name
   * @returns Repository status information
   */
  const checkRepositoryExists = async (owner: string, repo: string): Promise<{
    exists: boolean;
    hasReadme: boolean;
    isPrivate: boolean;
  }> => {
    try {
      console.log('[CHECK] Verifying repository exists:', `${owner}/${repo}`);
      
      // Get GitHub token from environment
      const githubToken = import.meta.env.VITE_GITHUB_TOKEN;
      const headers: HeadersInit = {
        'Accept': 'application/vnd.github.v3+json',
      };
      
      if (githubToken) {
        headers['Authorization'] = `token ${githubToken}`;
      }
      
      // Check repository endpoint (lighter than fetching README)
      const repoResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repo}`,
        { headers }
      );
      
      if (repoResponse.status === 404) {
        console.log('[CHECK] ❌ Repository does not exist');
        return { exists: false, hasReadme: false, isPrivate: false };
      }
      
      if (repoResponse.status === 403) {
        console.log('[CHECK] ⚠️ Repository might be private or rate limited');
        return { exists: true, hasReadme: false, isPrivate: true };
      }
      
      if (!repoResponse.ok) {
        console.log('[CHECK] ⚠️ Unexpected response:', repoResponse.status);
        return { exists: false, hasReadme: false, isPrivate: false };
      }
      
      const repoData = await repoResponse.json();
      console.log('[CHECK] ✅ Repository exists');
      console.log('[CHECK] Private:', repoData.private);
      
      // Now check for README
      const readmeResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/readme`,
        {
          method: 'HEAD', // Only check if it exists, don't fetch content
          headers,
        }
      );
      
      const hasReadme = readmeResponse.status === 200;
      console.log('[CHECK] README exists:', hasReadme);
      
      return {
        exists: true,
        hasReadme: hasReadme,
        isPrivate: repoData.private || false
      };
      
    } catch (error) {
      console.error('[CHECK] Error checking repository:', error);
      return { exists: false, hasReadme: false, isPrivate: false };
    }
  };

  /**
   * Generate template README
   */
  const generateTemplateReadme = (projectInfo: any): string => {
    return `# ${projectInfo.name}

## Overview
A ${projectInfo.languages?.join(' and ') || 'software'} project.

## Installation
\`\`\`bash
npm install
\`\`\`

## Usage
\`\`\`bash
npm start
\`\`\`

## Features
- Feature 1
- Feature 2
- Feature 3

## Contributing
Contributions are welcome!

## License
MIT`;
  };

  /**
   * Parse GitHub repository owner and name from URL or shorthand
   * @param repoUrl - GitHub repository URL or owner/repo shorthand
   * @returns Object with owner and repo, or null if invalid
   */
  const parseGitHubRepo = (repoUrl: string): { owner: string; repo: string } | null => {
    try {
      console.log(`[README] Parsing repository URL: ${repoUrl}`);
      
      // Remove .git suffix if present
      const cleanUrl = repoUrl.replace(/\.git$/, '');
      
      // Handle different URL formats
      let owner: string;
      let repo: string;
      
      // Format: https://github.com/owner/repo
      if (cleanUrl.includes('github.com/')) {
        const match = cleanUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
        if (match) {
          owner = match[1];
          repo = match[2];
        } else {
          return null;
        }
      }
      // Format: git@github.com:owner/repo
      else if (cleanUrl.includes('git@github.com:')) {
        const match = cleanUrl.match(/git@github\.com:([^\/]+)\/(.+)/);
        if (match) {
          owner = match[1];
          repo = match[2];
        } else {
          return null;
        }
      }
      // Format: owner/repo (shorthand)
      else if (cleanUrl.includes('/') && !cleanUrl.includes('://')) {
        const parts = cleanUrl.split('/');
        if (parts.length === 2) {
          owner = parts[0];
          repo = parts[1];
        } else {
          return null;
        }
      }
      // Invalid format
      else {
        return null;
      }
      
      console.log(`[README] Parsed: owner="${owner}", repo="${repo}"`);
      return { owner, repo };
      
    } catch (error) {
      console.error('[README] Error parsing repository URL:', error);
      return null;
    }
  };

  /**
   * Fetch README.md content from a GitHub repository
   * @param owner - GitHub username or organization
   * @param repo - Repository name
   * @returns Raw markdown content of README.md
   */
  const fetchReadmeFromGitHub = async (owner: string, repo: string): Promise<string> => {
    try {
      console.log(`[README] Fetching from GitHub: ${owner}/${repo}`);
      
      // Get GitHub token from environment
      const githubToken = import.meta.env.VITE_GITHUB_TOKEN;
      
      // Construct GitHub API URL
      const apiUrl = `https://api.github.com/repos/${owner}/${repo}/readme`;
      console.log(`[README] API URL: ${apiUrl}`);
      
      // Prepare headers
      const headers: HeadersInit = {
        'Accept': 'application/vnd.github.v3.raw', // Get raw markdown
      };
      
      // Add auth header if token is available
      if (githubToken) {
        headers['Authorization'] = `token ${githubToken}`;
        console.log('[README] Using GitHub token for authentication');
      } else {
        console.log('[README] No GitHub token - using unauthenticated requests (60/hour limit)');
      }
      
      // Make the request
      const response = await fetch(apiUrl, { headers });
      
      console.log(`[README] Response status: ${response.status}`);
      
      // Handle different response codes
      if (response.status === 404) {
        throw new Error(`Repository "${owner}/${repo}" or README.md not found on GitHub`);
      }
      
      if (response.status === 403) {
        // Check if it's rate limit
        const rateLimitRemaining = response.headers.get('X-RateLimit-Remaining');
        if (rateLimitRemaining === '0') {
          throw new Error('GitHub API rate limit exceeded. Try again in an hour or add a GitHub token for higher limits.');
        }
        throw new Error('Access forbidden. Repository may be private.');
      }
      
      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
      }
      
      // Get the content
      const content = await response.text();
      console.log(`[README] Successfully fetched README. Length: ${content.length} characters`);
      console.log(`[README] First 100 chars: ${content.substring(0, 100)}...`);
      
      // Validate content
      if (!content || content.trim().length === 0) {
        throw new Error('README.md is empty');
      }
      
      return content;
      
    } catch (error) {
      console.error('[README] Error fetching from GitHub:', error);
      
      // Re-throw with more context
      if (error instanceof Error) {
        throw new Error(`Failed to fetch README from GitHub: ${error.message}`);
      }
      throw new Error('Failed to fetch README from GitHub: Unknown error');
    }
  };

  async function handleImproveReadme() {
    console.log('[AI] ========================================');
    console.log('[AI] Improve README button clicked');
    console.log('[AI] ========================================');
    
    if (improvingReadme || !ollamaHealthy) {
      return;
    }
    
    setImprovingReadme(true);
    setAiError(null);
    aiRequestInProgress.current = true; // Mark AI request as in progress
    
    try {
      // Step 1: Get repository information
      console.log('[AI] Step 1: Getting repository information...');
      
      // Use test mode repository if enabled, otherwise get from project data
      let repositoryUrl: string | null;
      
      if (testMode) {
        repositoryUrl = testRepo;
        console.log('[AI] 🧪 TEST MODE: Using test repository:', repositoryUrl);
      } else {
        repositoryUrl = getRepositoryUrl();
        
        if (!repositoryUrl) {
          // Show helpful dialog
          setErrorDialogData({
            title: '❌ Repository URL Not Found',
            message: 'No repository URL found for this project. Please ensure the project has a valid GitHub repository URL.',
            suggestions: [
              'Check if the repository is properly connected in project settings',
              'Verify the repository URL is stored in the database',
              'Enable Test Mode to try with a known public repository instead',
            ],
            actions: [
              {
                label: 'Enable Test Mode',
                primary: true,
                onClick: () => {
                  setShowErrorDialog(false);
                  setTestMode(true);
                }
              },
              {
                label: 'Cancel',
                onClick: () => {
                  setShowErrorDialog(false);
                }
              }
            ]
          });
          setShowErrorDialog(true);
          return;
        }
      }
      
      // Verify and correct URL
      repositoryUrl = verifyRepositoryUrl(repositoryUrl) || repositoryUrl;
      console.log('[AI] Using repository URL:', repositoryUrl);
      
      // Step 2: Parse GitHub owner and repo
      console.log('[AI] Step 2: Parsing repository...');
      const repoInfo = parseGitHubRepo(repositoryUrl);
      
      if (!repoInfo) {
        throw new Error('Invalid GitHub repository URL. Expected format: owner/repo or https://github.com/owner/repo');
      }
      
      console.log('[AI] Repository info:', repoInfo);
      
      // Step 2.5: Check if repository exists
      console.log('[AI] Step 2.5: Checking if repository exists...');
      const repoCheck = await checkRepositoryExists(repoInfo.owner, repoInfo.repo);
      
      if (!repoCheck.exists) {
        const errorMsg = `Repository "${repoInfo.owner}/${repoInfo.repo}" does not exist on GitHub. Please verify the repository name.`;
        setErrorDialogData({
          title: '❌ Repository Not Found',
          message: errorMsg,
          suggestions: [
            'Verify the repository name is spelled correctly (case-sensitive)',
            'Check if the repository exists on GitHub',
            'Try enabling Test Mode to use a known public repository',
            'Ensure you have the correct owner/username',
          ],
          actions: [
            {
              label: 'Use Template README',
              primary: true,
              onClick: async () => {
                setShowErrorDialog(false);
                const projectInfo = {
                  name: repository.repo_name || repoInfo.repo,
                  languages: repository.language ? [repository.language] : [],
                  dependencies: 0,
                  directories: [],
                  version: '1.0.0',
                  description: repository.description || ''
                };
                const templateReadme = generateTemplateReadme(projectInfo);
                const result = await aiApi.improveReadme(templateReadme, projectInfo);
                setRealReadmeContent(templateReadme);
                setImprovedContent(result.content);
                setShowImprovedReadme(true);
              }
            },
            {
              label: 'Enable Test Mode',
              onClick: () => {
                setShowErrorDialog(false);
                setTestMode(true);
              }
            },
            {
              label: 'Cancel',
              onClick: () => {
                setShowErrorDialog(false);
              }
            }
          ]
        });
        setShowErrorDialog(true);
        return;
      }
      
      if (repoCheck.isPrivate && !import.meta.env.VITE_GITHUB_TOKEN) {
        throw new Error(`Repository "${repoInfo.owner}/${repoInfo.repo}" is private. Only public repositories are supported without authentication. Add a GitHub token to access private repos.`);
      }
      
      if (!repoCheck.hasReadme) {
        const errorMsg = `Repository "${repoInfo.owner}/${repoInfo.repo}" exists but does not have a README.md file.`;
        setErrorDialogData({
          title: '📄 README Not Found',
          message: errorMsg,
          suggestions: [
            'Add a README.md file to the repository root',
            'Use a template README to generate documentation',
            'Try enabling Test Mode to use a repository with a README',
          ],
          actions: [
            {
              label: 'Use Template README',
              primary: true,
              onClick: async () => {
                setShowErrorDialog(false);
                const projectInfo = {
                  name: repository.repo_name || repoInfo.repo,
                  languages: repository.language ? [repository.language] : [],
                  dependencies: 0,
                  directories: [],
                  version: '1.0.0',
                  description: repository.description || ''
                };
                const templateReadme = generateTemplateReadme(projectInfo);
                const result = await aiApi.improveReadme(templateReadme, projectInfo);
                setRealReadmeContent(templateReadme);
                setImprovedContent(result.content);
                setShowImprovedReadme(true);
              }
            },
            {
              label: 'Enable Test Mode',
              onClick: () => {
                setShowErrorDialog(false);
                setTestMode(true);
              }
            },
            {
              label: 'Cancel',
              onClick: () => {
                setShowErrorDialog(false);
              }
            }
          ]
        });
        setShowErrorDialog(true);
        return;
      }
      
      console.log('[AI] ✅ Repository verification passed');
      
      // Step 3: Fetch actual README from GitHub
      console.log('[AI] Step 3: Fetching README from GitHub...');
      console.log('[AI] This may take a few seconds...');
      
      let actualReadme: string;
      
      try {
        actualReadme = await fetchReadmeFromGitHub(repoInfo.owner, repoInfo.repo);
        console.log('[AI] ✅ README fetched successfully');
        console.log('[AI] README length:', actualReadme.length, 'characters');
        console.log('[AI] README preview:', actualReadme.substring(0, 200) + '...');
      } catch (error) {
        console.warn('[README] GitHub fetch failed, showing error dialog');
        
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        setErrorDialogData({
          title: '❌ Failed to Fetch README',
          message: `Could not fetch README from GitHub: ${errorMessage}`,
          suggestions: [
            'Check your internet connection',
            'Verify the repository is accessible',
            'Try again in a few moments',
            'Use a template README instead',
          ],
          actions: [
            {
              label: 'Use Template README',
              primary: true,
              onClick: async () => {
                setShowErrorDialog(false);
                const projectInfo = {
                  name: repository.repo_name || repoInfo.repo,
                  languages: repository.language ? [repository.language] : [],
                  dependencies: 0,
                  directories: [],
                  version: '1.0.0',
                  description: repository.description || ''
                };
                const templateReadme = generateTemplateReadme(projectInfo);
                const result = await aiApi.improveReadme(templateReadme, projectInfo);
                setRealReadmeContent(templateReadme);
                setImprovedContent(result.content);
                setShowImprovedReadme(true);
              }
            },
            {
              label: 'Enable Test Mode',
              onClick: () => {
                setShowErrorDialog(false);
                setTestMode(true);
              }
            },
            {
              label: 'Cancel',
              onClick: () => {
                setShowErrorDialog(false);
              }
            }
          ]
        });
        setShowErrorDialog(true);
        return;
      }
      
      // Validate README content
      if (actualReadme.length < 10) {
        throw new Error('README is too short (less than 10 characters)');
      }
      
      // Step 4: Prepare project info for AI
      console.log('[AI] Step 4: Preparing project info for AI...');
      const projectInfo = {
        name: repository.repo_name || repoInfo.repo,
        languages: repository.language ? [repository.language] : [],
        dependencies: 0,
        directories: [],
        version: '1.0.0',
        description: repository.description || ''
      };
      
      console.log('[AI] Project info:', projectInfo);
      
      // Step 5: Send to AI for improvement
      console.log('[AI] Step 5: Sending to AI for improvement...');
      console.log('[AI] This will take 10-30 seconds...');
      
      const result = await aiApi.improveReadme(actualReadme, projectInfo);
      
      console.log('[AI] ✅ AI improvement complete!');
      console.log('[AI] Original length:', actualReadme.length);
      console.log('[AI] Improved length:', result.content?.length || 0);
      if (result.content) {
        console.log('[AI] Size change:', Math.round((result.content.length / actualReadme.length) * 100), '%');
      }
      
      // Step 6: Store both versions
      setRealReadmeContent(actualReadme);
      
      // Step 7: Show comparison modal
      if (result.success && result.content) {
        setImprovedContent(result.content);
        setShowImprovedReadme(true);
      } else if (result.error === 'AI_GENERATION_FAILED' && result.content) {
        // Backend fallback: show original README with a friendly message
        setImprovedContent(result.content);
        setShowImprovedReadme(true);
        setAiError(result.message || 'AI failed to improve README, showing original content.');
      } else {
        throw new Error(result.message || 'Failed to improve README');
      }
      
      console.log('[AI] ========================================');
      console.log('[AI] SUCCESS - Modal displayed');
      console.log('[AI] ========================================');
      
    } catch (error) {
      console.error('[AI] ========================================');
      console.error('[AI] ERROR occurred:');
      console.error('[AI]', error);
      console.error('[AI] ========================================');
      
      // Only show alert if error dialog wasn't already shown
      // (Error dialog is shown in the try block for specific cases)
      if (!showErrorDialog) {
        // User-friendly error messages
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        
        let userMessage = errorMessage;
        
        // Customize error messages
        if (errorMessage.includes('rate limit')) {
          userMessage = '⏱️ GitHub API rate limit reached. Please try again in an hour, or add a GitHub personal access token for higher limits.';
        } else if (errorMessage.includes('not found')) {
          userMessage = '❌ Repository or README.md not found on GitHub. Please check the repository URL.';
        } else if (errorMessage.includes('Invalid GitHub')) {
          userMessage = '❌ Invalid repository URL. Please use format: owner/repo or https://github.com/owner/repo';
        } else if (errorMessage.includes('private')) {
          userMessage = '🔒 This repository is private. README fetching only works with public repositories.';
        } else if (errorMessage.includes('Ollama')) {
          userMessage = '🤖 AI service error. Please ensure Ollama is running: ollama serve';
        }
        
        setAiError(userMessage);
        
        // Show alert with error
        alert(userMessage);
      }
      
    } finally {
      setImprovingReadme(false);
      aiRequestInProgress.current = false; // Mark AI request as complete
      console.log('[AI] Improve README process completed');
    }
  }

  async function handleGenerateDiagram() {
    if (generatingDiagram || !ollamaHealthy) {
      return;
    }

    try {
      setGeneratingDiagram(true);
      setAiError(null);
      aiRequestInProgress.current = true; // Mark AI request as in progress

      // Extract project structure data
      const projectData = {
        components: ['Frontend', 'Backend', 'Database'],
        connections: [
          { from: 'Frontend', to: 'Backend' },
          { from: 'Backend', to: 'Database' }
        ],
        type: 'flowchart'
      };

      const result = await aiApi.generateDiagram('architecture', projectData);

      if (result.success && result.content) {
        // For now, log Mermaid code so it can be wired into a dedicated diagram view.
        console.log('Generated Mermaid diagram:', result.content);
        alert('Architecture diagram generated. It will be rendered by the documentation viewer.');
      } else if (result.error === 'AI_GENERATION_FAILED' && result.content) {
        // Fallback text explanation from backend
        console.log('Diagram fallback text:', result.content);
        alert('Diagram generation failed, showing a textual architecture summary instead.');
      } else {
        throw new Error(result.message || 'Failed to generate diagram');
      }
    } catch (error) {
      console.error('[AI] Error generating diagram:', error);
      const message =
        typeof error === 'object' && error && 'error' in error && 'message' in error
          ? String((error as any).message)
          : 'Failed to generate diagram';
      setAiError(message);
    } finally {
      setGeneratingDiagram(false);
      aiRequestInProgress.current = false; // Mark AI request as complete
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-[#F97316] animate-spin" />
      </div>
    );
  }

  if (!repository) {
    return (
      <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-[#EF4444] mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-[#1C1917] mb-2">Repository Not Found</h2>
          <Link to="/projects" className="text-[#F97316] hover:text-[#EA580C]">
            ← Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  const sections = [
    { id: 'readme', label: 'README', icon: FileText, content: docs?.readme },
    { id: 'api', label: 'API Documentation', icon: Code, content: docs?.api_docs },
    { id: 'setup', label: 'Setup Guide', icon: SettingsIcon, content: docs?.setup_guide },
    { id: 'architecture', label: 'Architecture', icon: Box, content: docs?.architecture }
  ];

  const currentSection = sections.find(s => s.id === activeSection);

  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      {/* Header */}
      <nav className="bg-white border-b border-[#E7E5E4] px-8 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link
              to="/projects"
              className="text-[#57534E] hover:text-[#1C1917] transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-[#1C1917]">{repository.repo_name}</h1>
              <p className="text-sm text-[#57534E]">{repository.repo_owner}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Ollama Status Indicator */}
            {ollamaChecking ? (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg">
                <Loader2 className="w-4 h-4 text-amber-600 animate-spin" />
                <span className="text-xs text-amber-700">Checking AI...</span>
              </div>
            ) : ollamaHealthy ? (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg" title="Ollama is running and ready">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="text-xs text-green-700">AI Ready</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg" title="Ollama is not running. Start it with: ollama serve">
                <XCircle className="w-4 h-4 text-red-600" />
                <span className="text-xs text-red-700">AI Offline</span>
              </div>
            )}
            
            {/* Test Mode Toggle - Only show in development */}
            {import.meta.env.DEV && (
              <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={testMode}
                    onChange={(e) => setTestMode(e.target.checked)}
                    className="w-4 h-4 text-amber-600 rounded"
                  />
                  <span className="text-sm font-medium text-amber-900">Test Mode</span>
                </label>
                
                {testMode && (
                  <select
                    value={testRepo}
                    onChange={(e) => setTestRepo(e.target.value)}
                    className="text-sm px-2 py-1 bg-white border border-amber-300 rounded"
                  >
                    {TEST_REPOSITORIES.map(repo => (
                      <option key={repo.value} value={repo.value}>
                        {repo.name} - {repo.description}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}
            
            {/* AI Improve README Button */}
            <button
              onClick={handleImproveReadme}
              disabled={improvingReadme || !ollamaHealthy || ollamaChecking}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all text-white ${
                improvingReadme 
                  ? 'bg-purple-400 cursor-wait' 
                  : ollamaHealthy 
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 hover:shadow-lg transform hover:-translate-y-0.5' 
                    : 'bg-gray-400 cursor-not-allowed'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              title={ollamaHealthy ? 'Improve README with AI' : 'AI service unavailable'}
            >
              {improvingReadme ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Fetching & Improving README...</span>
                  <span className="text-xs opacity-75">(15-45s)</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  <span>AI Improve README</span>
                </>
              )}
            </button>

            {/* Generate Diagram Button */}
            <button
              onClick={handleGenerateDiagram}
              disabled={generatingDiagram || !ollamaHealthy || ollamaChecking}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg font-medium hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              title={!ollamaHealthy ? 'AI is offline' : 'Generate architecture diagram'}
            >
              {generatingDiagram ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Diagram
                </>
              )}
            </button>

            <button
              onClick={handleRegenerate}
              disabled={isRegenerating || docsStatus === 'generating'}
              className="px-4 py-2 text-white bg-[#F97316] hover:bg-[#EA580C] rounded-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              title={docsStatus === 'generating' || isRegenerating ? 'Generation in progress...' : 'Regenerate documentation'}
            >
              <RefreshCw className={`w-4 h-4 ${isRegenerating || docsStatus === 'generating' ? 'animate-spin' : ''}`} />
              {docsStatus === 'generating' || isRegenerating ? 'Generating...' : 'Regenerate Docs'}
            </button>
            <div className="relative group">
              <button className="px-4 py-2 text-[#57534E] hover:text-[#1C1917] hover:bg-[#F5F5F4] rounded-lg transition-all flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export
              </button>
              <div className="absolute right-0 mt-2 w-48 bg-white border-2 border-[#E7E5E4] rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                <button
                  onClick={() => handleExport('markdown')}
                  className="w-full px-4 py-2 text-left hover:bg-[#F5F5F4] transition-colors"
                >
                  Markdown
                </button>
                <button
                  onClick={() => handleExport('pdf')}
                  className="w-full px-4 py-2 text-left hover:bg-[#F5F5F4] transition-colors"
                >
                  PDF (Coming Soon)
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Offline Warning Banner */}
      {!ollamaHealthy && !ollamaChecking && (
        <div className="max-w-7xl mx-auto px-8 pt-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-900">AI Features Unavailable</p>
                <p className="text-xs text-amber-700 mt-1">
                  Ollama is not running. Start it with: <code className="bg-amber-100 px-1 rounded">ollama serve</code>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Improved README Modal - Side by Side Comparison */}
      {showImprovedReadme && improvedContent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-7xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Header */}
            <div className="border-b border-[#E7E5E4] p-6 flex items-center justify-between bg-gradient-to-r from-purple-50 to-pink-50">
              <div>
                <h2 className="text-2xl font-bold text-[#1C1917]">Improved README</h2>
                <p className="text-sm text-[#57534E] mt-1">
                  AI-enhanced version • {improvedContent.length} characters
                </p>
              </div>
              <button
                onClick={() => {
                  setShowImprovedReadme(false);
                  setImprovedContent('');
                  setRealReadmeContent('');
                }}
                className="text-[#57534E] hover:text-[#1C1917] transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            {/* Content - Side by Side */}
            <div className="grid grid-cols-2 gap-4 p-6 overflow-auto flex-1" style={{ maxHeight: 'calc(90vh - 200px)' }}>
              {/* Original */}
              <div className="flex flex-col">
                <h3 className="font-semibold text-[#57534E] mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Original ({realReadmeContent.length} chars)
                </h3>
                <div className="bg-[#FAFAF9] rounded-lg p-4 border border-[#E7E5E4] flex-1 overflow-auto">
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown>{realReadmeContent || 'No original README available'}</ReactMarkdown>
                  </div>
                </div>
              </div>
              
              {/* Improved */}
              <div className="flex flex-col">
                <h3 className="font-semibold text-[#57534E] mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  AI-Improved ({improvedContent.length} chars)
                </h3>
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200 flex-1 overflow-auto">
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown>{improvedContent}</ReactMarkdown>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Stats */}
            {realReadmeContent && (
              <div className="border-t border-[#E7E5E4] p-4 bg-[#FAFAF9] grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#1C1917]">
                    {realReadmeContent.length}
                  </div>
                  <div className="text-xs text-[#57534E]">Original chars</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {improvedContent.length}
                  </div>
                  <div className="text-xs text-[#57534E]">Improved chars</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {Math.round((improvedContent.length / realReadmeContent.length) * 100)}%
                  </div>
                  <div className="text-xs text-[#57534E]">Size change</div>
                </div>
              </div>
            )}
            
            {/* Actions */}
            <div className="border-t border-[#E7E5E4] p-6 flex gap-3 justify-end bg-white">
              <button
                onClick={() => {
                  setShowImprovedReadme(false);
                  setImprovedContent('');
                  setRealReadmeContent('');
                }}
                className="px-4 py-2 bg-[#F5F5F4] text-[#57534E] rounded-lg hover:bg-[#E7E5E4] font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(improvedContent);
                  alert('Copied to clipboard!');
                }}
                className="px-4 py-2 bg-white border border-[#E7E5E4] text-[#57534E] rounded-lg hover:bg-[#FAFAF9] font-medium flex items-center gap-2 transition-colors"
              >
                <Download className="w-4 h-4" />
                Copy
              </button>
              <button
                onClick={() => {
                  const blob = new Blob([improvedContent], { type: 'text/markdown' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${repository.repo_name}-improved-readme.md`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 font-medium flex items-center gap-2 transition-all"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-8 flex gap-8">
        {/* Sidebar */}
        <div className="w-64 flex-shrink-0">
          <div className="bg-white rounded-xl border-2 border-[#E7E5E4] p-4 sticky top-8">
            <h3 className="text-sm font-semibold text-[#A8A29E] uppercase tracking-wider mb-4">
              Table of Contents
            </h3>
            <div className="space-y-1">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-left ${
                      activeSection === section.id
                        ? 'bg-[#FFF5F0] text-[#F97316] font-semibold'
                        : 'text-[#57534E] hover:bg-[#F5F5F4]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {section.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Documentation Content */}
        <div className="flex-1">
          <div className="bg-white rounded-xl border-2 border-[#E7E5E4] p-8">
            {docsStatus === 'not_started' && (
              <div className="text-center py-12">
                <Loader2 className="w-12 h-12 text-[#F97316] animate-spin mx-auto mb-4" />
                <h3 className="text-xl font-bold text-[#1C1917] mb-2">Documentation Not Started</h3>
                <p className="text-[#57534E] mb-6">Documentation generation hasn't started yet.</p>
                <button
                  onClick={handleRegenerate}
                  disabled={isRegenerating || docsStatus === 'generating'}
                  className="bg-[#F97316] text-white px-6 py-3 rounded-lg hover:bg-[#EA580C] transition-all disabled:opacity-50 inline-flex items-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${isRegenerating || docsStatus === 'generating' ? 'animate-spin' : ''}`} />
                  {isRegenerating || docsStatus === 'generating' ? 'Generating...' : 'Generate Documentation'}
                </button>
              </div>
            )}

            {docsStatus === 'generating' && (
              <div className="text-center py-12">
                <Loader2 className="w-12 h-12 text-[#F97316] animate-spin mx-auto mb-4" />
                <h3 className="text-xl font-bold text-[#1C1917] mb-2">Generating Documentation...</h3>
                
                {/* Progress Bar */}
                <div className="max-w-md mx-auto mb-4">
                  <div className="w-full bg-[#E7E5E4] rounded-full h-3 mb-2">
                    <div
                      className="bg-[#F97316] h-3 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-sm text-[#57534E]">
                    <span>{progress}%</span>
                    <span className="text-right">{currentStep || 'Processing...'}</span>
                  </div>
                </div>

                <p className="text-[#57534E] mb-6">
                  {currentStep || 'This may take 30-60 seconds. Please wait.'}
                </p>
                
                <button
                  onClick={() => {
                    fetchRepositoryAndDocs().catch(err => {
                      console.error('[PROJECT-DETAIL] Error refreshing status:', err);
                    });
                  }}
                  className="text-[#F97316] hover:text-[#EA580C] underline"
                >
                  Refresh Status
                </button>
              </div>
            )}

            {docsStatus === 'failed' && (
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-[#EF4444] mx-auto mb-4" />
                <h3 className="text-xl font-bold text-[#1C1917] mb-2">Documentation Generation Failed</h3>
                {(() => {
                  const parsed = parseGenerationState(docs);
                  const isTokenError = parsed.errorMessage?.toLowerCase().includes('github token') || 
                                      parsed.errorMessage?.toLowerCase().includes('reconnect');
                  
                  return parsed.errorMessage ? (
                    <div className="max-w-md mx-auto mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-800">{parsed.errorMessage}</p>
                      {isTokenError && (
                        <Link
                          to="/settings"
                          className="mt-3 inline-block text-sm text-[#F97316] hover:text-[#EA580C] underline font-semibold"
                        >
                          Reconnect GitHub Account →
                        </Link>
                      )}
                    </div>
                  ) : null;
                })()}
                <p className="text-[#57534E] mb-6">
                  {(() => {
                    const parsed = parseGenerationState(docs);
                    const isTokenError = parsed.errorMessage?.toLowerCase().includes('github token') || 
                                        parsed.errorMessage?.toLowerCase().includes('reconnect');
                    if (isTokenError) {
                      return 'Please reconnect your GitHub account in Settings and try again.';
                    }
                    return parsed.errorMessage 
                      ? 'Please fix the issue and try again.' 
                      : 'There was an error generating the documentation.';
                  })()}
                </p>
                {(() => {
                  const parsed = parseGenerationState(docs);
                  const isTokenError = parsed.errorMessage?.toLowerCase().includes('github token') || 
                                      parsed.errorMessage?.toLowerCase().includes('reconnect');
                  
                  if (isTokenError) {
                    return (
                      <Link
                        to="/settings"
                        className="bg-[#F97316] text-white px-6 py-3 rounded-lg hover:bg-[#EA580C] transition-all inline-flex items-center gap-2"
                      >
                        Go to Settings
                      </Link>
                    );
                  }
                  
                  return (
                    <button
                      onClick={handleRegenerate}
                      disabled={isRegenerating || docsStatus === 'generating'}
                      className="bg-[#F97316] text-white px-6 py-3 rounded-lg hover:bg-[#EA580C] transition-all disabled:opacity-50 inline-flex items-center gap-2"
                    >
                      <RefreshCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
                      {isRegenerating ? 'Retrying...' : 'Retry Generation'}
                    </button>
                  );
                })()}
              </div>
            )}

            {docsStatus === 'complete' && docs && (
              <div className="prose prose-slate max-w-none">
                <ReactMarkdown>
                  {sections.find(s => s.id === activeSection)?.content || '# No content available'}
                </ReactMarkdown>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Custom Error Dialog */}
      {showErrorDialog && errorDialogData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full shadow-2xl">
            {/* Header */}
            <div className="border-b border-[#E7E5E4] p-6">
              <h2 className="text-2xl font-bold text-[#1C1917]">{errorDialogData.title}</h2>
              <p className="text-[#57534E] mt-2">{errorDialogData.message}</p>
            </div>
            
            {/* Suggestions */}
            <div className="p-6">
              <h3 className="font-semibold text-[#1C1917] mb-3">Suggestions:</h3>
              <ul className="space-y-2">
                {errorDialogData.suggestions.map((suggestion, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-[#57534E]">
                    <span className="text-[#F97316] font-bold">•</span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Actions */}
            <div className="border-t border-[#E7E5E4] p-6 flex gap-3 justify-end">
              {errorDialogData.actions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={action.onClick}
                  className={`
                    px-4 py-2 rounded-lg font-medium transition-colors
                    ${action.primary
                      ? 'bg-gradient-to-r from-[#F97316] to-pink-500 text-white hover:from-[#EA580C] hover:to-pink-600'
                      : 'bg-[#F5F5F4] text-[#57534E] hover:bg-[#E7E5E4]'
                    }
                  `}
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
