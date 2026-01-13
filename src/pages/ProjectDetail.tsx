/** Project detail page - Documentation viewer. */
import { useState, useEffect } from 'react';
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
  AlertCircle
} from 'lucide-react';
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

  useEffect(() => {
    if (id) {
      // Wrap in catch to prevent unhandled promise rejections
      fetchRepositoryAndDocs().catch(err => {
        console.error('[PROJECT-DETAIL] Error fetching repository and docs:', err);
        setLoading(false);
      });
    }
    
    // Cleanup: Clear polling interval on unmount
    return () => {
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
    if (isRegenerating || docsStatus === 'generating') {
      console.warn('[REGENERATE] Generation already in progress or button locked');
      return;
    }

    if (docsStatus === 'complete' && !confirm('Regenerate documentation? This will overwrite existing docs.')) {
      return;
    }

    try {
      // Lock button immediately to prevent spam
      setIsRegenerating(true);
      setDocsStatus('generating');
      setProgress(0);
      setCurrentStep('Starting generation...');

      // Get session and validate
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('[REGENERATE] Session error:', sessionError);
        throw new Error('Failed to get session: ' + sessionError.message);
      }

      if (!session?.access_token) {
        console.error('[REGENERATE] No access token in session');
        throw new Error('Not authenticated. Please log in again.');
      }

      if (!id) {
        console.error('[REGENERATE] No repository ID');
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
        
        let errorMessage = 'Failed to regenerate documentation';
        if (response.status === 400) {
          errorMessage = responseData.error || 'Invalid request. Check repository ID.';
        } else if (response.status === 401) {
          errorMessage = 'Authentication failed. Please log in again.';
        } else if (response.status === 404) {
          errorMessage = 'Repository not found or access denied.';
        } else if (response.status >= 500) {
          errorMessage = 'Server error. Please try again later.';
        }
        
        throw new Error(errorMessage);
      }

      console.log('[REGENERATE] Generation started:', responseData);

      // Start polling for progress updates (every 5 seconds)
      const startPolling = () => {
        const interval = setInterval(async () => {
          try {
            // fetchRepositoryAndDocs returns the status if docs exist
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
        }, 5000); // Poll every 5 seconds
        
        setPollingInterval(interval);
      };

      startPolling();
    } catch (err) {
      console.error('[REGENERATE] Error:', err);
      setDocsStatus('failed');
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
    </div>
  );
}
