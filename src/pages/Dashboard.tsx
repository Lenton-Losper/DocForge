/** Dashboard page - Overview of repositories and documentation. */
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Github, FileText, Clock, Plus, Loader2, Settings, Folder, FolderOpen, LogOut, GitBranch, ArrowRight, Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase.js';
import { RepositoryPicker } from '../components/RepositoryPicker';

interface Project {
  id: string;
  name: string;
  owner: string;
  lastSync: string;
  status: 'up-to-date' | 'needs-refresh';
  docCount: number;
}

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalRepos: 0,
    totalDocs: 0,
    lastSync: null as string | null,
  });
  const [repositories, setRepositories] = useState<any[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(true);
  const [showRepoPicker, setShowRepoPicker] = useState(false);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    fetchRepositories().catch(err => {
      console.error('[DASHBOARD] Error fetching repositories:', err);
    });
    // Handle GitHub OAuth callback after login redirect
    // Wrap in catch to prevent unhandled promise rejections
    handleGitHubTokenPersistence().catch(err => {
      console.error('[DASHBOARD] Unhandled error in token persistence:', err);
    });
  }, []);

  // Persist GitHub token after OAuth redirect
  async function handleGitHubTokenPersistence() {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.warn('[DASHBOARD] Session error (non-fatal):', sessionError);
        return;
      }
      
      if (!session?.user || !session.provider_token) {
        return; // No token to persist
      }

      // Persist GitHub access token to profiles table
      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert({
          id: session.user.id,
          github_access_token: session.provider_token,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        });

      if (upsertError) {
        console.error('[DASHBOARD] Failed to persist GitHub token:', upsertError);
        // Don't show error to user - token might already be persisted
      } else if (import.meta.env.DEV) {
        console.log('[DASHBOARD] GitHub token persisted successfully');
      }
    } catch (error) {
      // Catch all errors to prevent unhandled promise rejections
      console.error('[DASHBOARD] Error persisting GitHub token:', error);
      // Silent fail - don't interrupt user flow
    }
  }

  async function fetchRepositories() {
    try {
      setLoadingRepos(true);
      
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser) {
        setLoadingRepos(false);
        return;
      }

      // Fetch user's repositories
      const { data: repos, error } = await supabase
        .from('repositories')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('last_synced_at', { ascending: false, nullsFirst: false })
        .limit(3);

      if (error) {
        console.error('Error fetching repositories:', error);
        setLoadingRepos(false);
        return;
      }

      setRepositories(repos || []);

      // Calculate stats
      const { data: allRepos } = await supabase
        .from('repositories')
        .select('id, last_synced_at')
        .eq('user_id', currentUser.id);

      const { data: allDocs } = await supabase
        .from('generated_docs')
        .select('id')
        .in('repository_id', (allRepos || []).map(r => r.id));

      const mostRecentSync = allRepos && allRepos.length > 0
        ? allRepos
            .filter(r => r.last_synced_at)
            .sort((a, b) => new Date(b.last_synced_at).getTime() - new Date(a.last_synced_at).getTime())[0]?.last_synced_at
        : null;

      setStats({
        totalRepos: allRepos?.length || 0,
        totalDocs: allDocs?.length || 0,
        lastSync: mostRecentSync
      });

      setLoadingRepos(false);
    } catch (error) {
      console.error('Error fetching repositories:', error);
      setLoadingRepos(false);
    }
  }

  async function handleLogout() {
    if (confirm('Are you sure you want to log out?')) {
      try {
        await signOut();
        navigate('/');
      } catch (error) {
        console.error('Logout error:', error);
        alert('Failed to log out');
      }
    }
  }

  async function handleRepoSelect(repo: any) {
    try {
      setConnecting(true);
      setShowRepoPicker(false);

      // Get current user
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser) {
        alert('Please log in to continue');
        setConnecting(false);
        return;
      }

      // Save repository to database
      const { data, error } = await supabase
        .from('repositories')
        .insert({
          user_id: currentUser.id,
          repo_url: repo.html_url,
          repo_name: repo.name,
          repo_owner: repo.owner.login,
          github_id: repo.id.toString(),
          is_private: repo.private,
          language: repo.language,
          description: repo.description
        })
        .select()
        .single();

      if (error) {
        console.error('Failed to save repository:', error);
        alert('Failed to connect repository: ' + error.message);
        setConnecting(false);
        return;
      }

      // Trigger doc generation (call backend API)
      await generateDocs(data.id);
      
      // Refresh repositories list
      fetchRepositories().catch(err => {
        console.error('[DASHBOARD] Error refreshing repositories:', err);
      });
      
      // Navigate to project detail
      navigate(`/projects/${data.id}`);
    } catch (err) {
      console.error('Error connecting repository:', err);
      alert('Failed to connect repository');
      setConnecting(false);
    }
  }

  async function generateDocs(repoId: string) {
    try {
      // Call your backend API to generate docs
      const { data: { session } } = await supabase.auth.getSession();
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      
      const response = await fetch(`${API_BASE_URL}/api/generate-docs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ repository_id: repoId })
      });

      if (!response.ok) {
        throw new Error('Failed to generate documentation');
      }

      const result = await response.json();
      console.log('Docs generated:', result);
    } catch (err) {
      console.error('Failed to generate docs:', err);
      // Don't block the flow - user can regenerate later
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-[#F97316] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      {/* Navigation */}
      <nav className="bg-white border-b border-[#E7E5E4] px-8 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link to="/dashboard" className="text-2xl font-bold text-[#1C1917]">
            DocDocs
          </Link>
          <div className="flex items-center gap-4">
            <Link
              to="/projects"
              className="flex items-center gap-2 text-[#57534E] hover:text-[#1C1917] transition-colors"
            >
              <Folder className="w-5 h-5" />
              Projects
            </Link>
            <Link
              to="/settings"
              className="flex items-center gap-2 text-[#57534E] hover:text-[#1C1917] transition-colors"
            >
              <Settings className="w-5 h-5" />
              Settings
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-[#57534E] hover:text-[#EF4444] transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Log Out
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-8 py-12">
        {/* Welcome Section */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-[#1C1917] mb-2">
            Welcome back, {user?.email?.split('@')[0]}!
          </h1>
          <p className="text-[#57534E]">Manage your repositories and documentation</p>
        </div>
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-2xl border-2 border-[#E7E5E4] p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-[#FFF5F0] rounded-full flex items-center justify-center">
                <GitBranch className="w-6 h-6 text-[#F97316]" />
              </div>
              <div>
                <p className="text-3xl font-bold text-[#1C1917]">{stats.totalRepos}</p>
                <p className="text-sm text-[#57534E]">Repositories Connected</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border-2 border-[#E7E5E4] p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-[#FFF5F0] rounded-full flex items-center justify-center">
                <FileText className="w-6 h-6 text-[#F97316]" />
              </div>
              <div>
                <p className="text-3xl font-bold text-[#1C1917]">{stats.totalDocs}</p>
                <p className="text-sm text-[#57534E]">Docs Generated</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border-2 border-[#E7E5E4] p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-[#FFF5F0] rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-[#F97316]" />
              </div>
              <div>
                <p className="text-xl font-bold text-[#1C1917]">
                  {stats.lastSync 
                    ? new Date(stats.lastSync).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit'
                      })
                    : 'Never'
                  }
                </p>
                <p className="text-sm text-[#57534E]">Last Sync</p>
              </div>
            </div>
          </div>
        </div>

        {/* Connect Repository CTA - Only show when no repos */}
        {stats.totalRepos === 0 && (
          <div className="bg-white rounded-2xl border-2 border-[#E7E5E4] p-12 mb-12 text-center">
            <div className="w-20 h-20 bg-[#FFF5F0] rounded-full flex items-center justify-center mx-auto mb-6">
              <GitBranch className="w-10 h-10 text-[#F97316]" />
            </div>
            <h2 className="text-3xl font-bold text-[#1C1917] mb-3">Connect Your First Repository</h2>
            <p className="text-[#57534E] mb-8 max-w-2xl mx-auto">
              Link your GitHub repository to automatically generate comprehensive documentation. 
              Our AI analyzes your code and creates professional docs in seconds.
            </p>
            <button
              onClick={() => setShowRepoPicker(true)}
              className="bg-[#F97316] text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-[#EA580C] transition-all hover:scale-105 inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Connect Repository
            </button>
          </div>
        )}

        {/* Recent Repositories - Only show when repos exist */}
        {stats.totalRepos > 0 && (
          <div className="bg-white rounded-2xl border-2 border-[#E7E5E4] p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-[#1C1917]">Recent Repositories</h2>
              <button
                onClick={() => setShowRepoPicker(true)}
                className="bg-[#F97316] text-white px-4 py-2 rounded-lg hover:bg-[#EA580C] transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Repository
              </button>
            </div>

            {loadingRepos ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-[#F97316] animate-spin" />
                <span className="ml-3 text-[#57534E]">Loading repositories...</span>
              </div>
            ) : repositories.length === 0 ? (
              <div className="text-center py-12">
                <GitBranch className="w-16 h-16 text-[#A8A29E] mx-auto mb-4" />
                <p className="text-xl font-semibold text-[#1C1917] mb-2">No repositories yet</p>
                <p className="text-[#57534E] mb-6">Connect your first repository to get started</p>
                <button
                  onClick={() => setShowRepoPicker(true)}
                  className="bg-[#F97316] text-white px-6 py-3 rounded-lg hover:bg-[#EA580C] transition-all"
                >
                  Connect Repository
                </button>
              </div>
            ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {repositories.map((repo) => {
                  const lastSyncDate = repo.last_synced_at 
                    ? new Date(repo.last_synced_at)
                    : null
                  
                  const daysSinceSync = lastSyncDate
                    ? Math.floor((Date.now() - lastSyncDate.getTime()) / (1000 * 60 * 60 * 24))
                    : null

                  const needsRefresh = daysSinceSync !== null && daysSinceSync > 7

                  return (
                    <div
                      key={repo.id}
                      className="border-2 border-[#E7E5E4] rounded-xl p-6 hover:border-[#F97316] transition-all cursor-pointer"
                      onClick={() => navigate(`/projects/${repo.id}`)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <GitBranch className="w-5 h-5 text-[#F97316]" />
                          <h3 className="font-bold text-[#1C1917]">{repo.repo_name}</h3>
                        </div>
                        {repo.is_private && (
                          <span className="text-xs bg-[#FFF5F0] text-[#F97316] px-2 py-1 rounded flex items-center gap-1">
                            <Lock className="w-3 h-3" />
                            Private
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-[#A8A29E] mb-4">{repo.repo_owner}</p>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[#57534E]">
                          {lastSyncDate 
                            ? `${daysSinceSync} day${daysSinceSync === 1 ? '' : 's'} ago`
                            : 'Not synced'
                          }
                        </span>
                        {needsRefresh ? (
                          <span className="text-[#F97316] font-semibold">Needs refresh</span>
                        ) : repo.docs_generated ? (
                          <span className="text-[#10B981] font-semibold">Up-to-date</span>
                        ) : (
                          <span className="text-[#A8A29E]">Pending</span>
                        )}
                      </div>

                      {repo.language && (
                        <div className="mt-3 pt-3 border-t border-[#E7E5E4]">
                          <span className="text-xs px-2 py-1 bg-[#F5F5F4] text-[#57534E] rounded">
                            {repo.language}
                          </span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {repositories.length > 0 && (
                <div className="mt-6 text-center">
                  <Link
                    to="/projects"
                    className="text-[#F97316] hover:text-[#EA580C] font-semibold inline-flex items-center gap-2"
                  >
                    View all repositories
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              )}
            </>
            )}
          </div>
        )}
      </main>

      {/* Repository Picker Modal */}
      {showRepoPicker && (
        <RepositoryPicker
          onSelect={handleRepoSelect}
          onCancel={() => setShowRepoPicker(false)}
        />
      )}

      {/* Loading Overlay */}
      {connecting && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 text-center">
            <Loader2 className="w-12 h-12 text-[#F97316] animate-spin mx-auto mb-4" />
            <p className="text-xl font-semibold text-[#1C1917]">Connecting repository...</p>
            <p className="text-[#57534E] mt-2">Generating documentation</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
