/** Projects page - Repository management. */
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase.js';
import { 
  GitBranch, 
  FileText, 
  RefreshCw, 
  Trash2, 
  Settings, 
  LayoutDashboard,
  Loader2,
  Plus,
  Lock
} from 'lucide-react';
import { RepositoryPicker } from '../components/RepositoryPicker';

export default function Projects() {
  const navigate = useNavigate();
  const [repositories, setRepositories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRepoPicker, setShowRepoPicker] = useState(false);
  const [regenerating, setRegenerating] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchRepositories();
  }, []);

  async function fetchRepositories() {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/');
        return;
      }

      const { data: repos, error } = await supabase
        .from('repositories')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching repositories:', error);
        setLoading(false);
        return;
      }

      setRepositories(repos || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching repositories:', error);
      setLoading(false);
    }
  }

  async function handleRepoSelect(repo: any) {
    try {
      setShowRepoPicker(false);

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        alert('Please log in to continue');
        return;
      }

      // Check if repo already exists
      const { data: existing } = await supabase
        .from('repositories')
        .select('id')
        .eq('user_id', user.id)
        .eq('github_id', repo.id.toString())
        .single();

      if (existing) {
        alert('This repository is already connected');
        return;
      }

      // Save repository to database
      const { data, error } = await supabase
        .from('repositories')
        .insert({
          user_id: user.id,
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
        return;
      }

      // Trigger doc generation
      await generateDocs(data.id);
      
      // Refresh list
      await fetchRepositories();
      
      // Navigate to project detail
      navigate(`/projects/${data.id}`);
    } catch (err) {
      console.error('Error connecting repository:', err);
      alert('Failed to connect repository');
    }
  }

  async function generateDocs(repoId: string) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/generate-docs`, {
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

      console.log('Docs generation started');
    } catch (err) {
      console.error('Failed to generate docs:', err);
    }
  }

  async function handleRegenerate(repoId: string, event: React.MouseEvent) {
    event.stopPropagation();
    
    if (!confirm('Regenerate documentation for this repository?')) {
      return;
    }

    try {
      setRegenerating(repoId);
      await generateDocs(repoId);
      
      // Update last_synced_at
      await supabase
        .from('repositories')
        .update({ last_synced_at: new Date().toISOString() })
        .eq('id', repoId);
      
      alert('Documentation is being regenerated!');
      await fetchRepositories();
      setRegenerating(null);
    } catch (err) {
      console.error('Regenerate error:', err);
      alert('Failed to regenerate documentation');
      setRegenerating(null);
    }
  }

  async function handleDisconnect(repoId: string, repoName: string, event: React.MouseEvent) {
    event.stopPropagation();
    
    if (!confirm(`Disconnect "${repoName}"? This will delete all generated documentation.`)) {
      return;
    }

    try {
      setDeleting(repoId);
      
      // Delete will cascade to generated_docs due to foreign key
      const { error } = await supabase
        .from('repositories')
        .delete()
        .eq('id', repoId);

      if (error) {
        throw error;
      }

      alert('Repository disconnected successfully');
      await fetchRepositories();
      setDeleting(null);
    } catch (err) {
      console.error('Disconnect error:', err);
      alert('Failed to disconnect repository');
      setDeleting(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-[#F97316] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      {/* Header */}
      <nav className="bg-white border-b border-[#E7E5E4] px-8 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-[#1C1917]">Repositories</h1>
          <div className="flex items-center gap-4">
            <Link
              to="/dashboard"
              className="flex items-center gap-2 text-[#57534E] hover:text-[#1C1917] transition-colors"
            >
              <LayoutDashboard className="w-5 h-5" />
              Dashboard
            </Link>
            <Link
              to="/settings"
              className="flex items-center gap-2 text-[#57534E] hover:text-[#1C1917] transition-colors"
            >
              <Settings className="w-5 h-5" />
              Settings
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-[#1C1917] mb-2">
              Manage your connected GitHub repositories
            </h2>
            <p className="text-[#57534E]">
              {repositories.length} {repositories.length === 1 ? 'repository' : 'repositories'} connected
            </p>
          </div>
          <button
            onClick={() => setShowRepoPicker(true)}
            className="bg-[#F97316] text-white px-6 py-3 rounded-lg hover:bg-[#EA580C] transition-all flex items-center gap-2 font-semibold"
          >
            <Plus className="w-5 h-5" />
            Add Repository
          </button>
        </div>

        {/* Repository List */}
        {repositories.length === 0 ? (
          <div className="bg-white rounded-2xl border-2 border-[#E7E5E4] p-12 text-center">
            <div className="w-20 h-20 bg-[#FFF5F0] rounded-full flex items-center justify-center mx-auto mb-6">
              <GitBranch className="w-10 h-10 text-[#F97316]" />
            </div>
            <h3 className="text-2xl font-bold text-[#1C1917] mb-3">No repositories yet</h3>
            <p className="text-[#57534E] mb-8 max-w-md mx-auto">
              Connect your first GitHub repository to start generating documentation automatically.
            </p>
            <button
              onClick={() => setShowRepoPicker(true)}
              className="bg-[#F97316] text-white px-6 py-3 rounded-lg hover:bg-[#EA580C] transition-all inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Connect Repository
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {repositories.map((repo) => {
              const lastSyncDate = repo.last_synced_at 
                ? new Date(repo.last_synced_at)
                : null;
              
              const daysSinceSync = lastSyncDate
                ? Math.floor((Date.now() - lastSyncDate.getTime()) / (1000 * 60 * 60 * 24))
                : null;

              const needsRefresh = daysSinceSync !== null && daysSinceSync > 7;

              return (
                <div
                  key={repo.id}
                  className="bg-white border-2 border-[#E7E5E4] rounded-xl p-6 hover:border-[#F97316] transition-all"
                >
                  <div className="flex justify-between items-start">
                    <div 
                      className="flex-1 cursor-pointer"
                      onClick={() => navigate(`/projects/${repo.id}`)}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <GitBranch className="w-6 h-6 text-[#F97316]" />
                        <h3 className="text-xl font-bold text-[#1C1917]">{repo.repo_name}</h3>
                        {repo.is_private && (
                          <span className="flex items-center gap-1 text-xs bg-[#FFF5F0] text-[#F97316] px-2 py-1 rounded">
                            <Lock className="w-3 h-3" />
                            Private
                          </span>
                        )}
                      </div>
                      
                      <p className="text-sm text-[#A8A29E] mb-3">{repo.repo_owner}</p>
                      
                      {repo.description && (
                        <p className="text-[#57534E] mb-4">{repo.description}</p>
                      )}
                      
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-[#57534E]">
                          Last sync: {lastSyncDate 
                            ? `${daysSinceSync} day${daysSinceSync === 1 ? '' : 's'} ago`
                            : 'Not synced'
                          }
                        </span>
                        
                        {repo.language && (
                          <span className="px-3 py-1 bg-[#F5F5F4] text-[#57534E] rounded-full">
                            {repo.language}
                          </span>
                        )}
                        
                        {needsRefresh ? (
                          <span className="text-[#F97316] font-semibold">Needs refresh</span>
                        ) : repo.docs_generated ? (
                          <span className="text-[#10B981] font-semibold">Up-to-date</span>
                        ) : (
                          <span className="text-[#A8A29E]">Pending</span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/projects/${repo.id}`)}
                        className="px-4 py-2 text-[#57534E] hover:text-[#1C1917] hover:bg-[#F5F5F4] rounded-lg transition-all flex items-center gap-2"
                      >
                        <FileText className="w-4 h-4" />
                        View Docs
                      </button>
                      
                      <button
                        onClick={(e) => handleRegenerate(repo.id, e)}
                        disabled={regenerating === repo.id}
                        className="px-4 py-2 text-white bg-[#F97316] hover:bg-[#EA580C] rounded-lg transition-all flex items-center gap-2 disabled:opacity-50"
                      >
                        <RefreshCw className={`w-4 h-4 ${regenerating === repo.id ? 'animate-spin' : ''}`} />
                        Regenerate
                      </button>
                      
                      <button
                        onClick={(e) => handleDisconnect(repo.id, repo.repo_name, e)}
                        disabled={deleting === repo.id}
                        className="px-4 py-2 text-[#EF4444] hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
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
    </div>
  );
}
