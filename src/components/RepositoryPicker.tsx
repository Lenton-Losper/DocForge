/** Repository picker component - Select GitHub repository. */
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';
import { GitBranch, Star, Eye, Lock, Search, X, Loader2 } from 'lucide-react';

interface Repository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  watchers_count: number;
  language: string | null;
  private: boolean;
  owner: {
    login: string;
    avatar_url: string;
  };
  updated_at: string;
}

interface RepositoryPickerProps {
  onSelect: (repo: Repository) => void;
  onCancel: () => void;
}

export function RepositoryPicker({ onSelect, onCancel }: RepositoryPickerProps) {
  const [repos, setRepos] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchRepositories();
  }, []);

  async function fetchRepositories() {
    try {
      setLoading(true);
      setError('');

      // Get GitHub token from session
      const { data: { session } } = await supabase.auth.getSession();
      
      // Check if user has GitHub identity
      const hasGitHub = session?.user?.identities?.some((id: any) => id.provider === 'github');
      
      if (!hasGitHub) {
        setError('GitHub not connected. Please connect your GitHub account in Settings.');
        setLoading(false);
        return;
      }

      // For now, we'll need to get the token from the user's metadata
      // Supabase stores provider_token in the session, but we need to access it
      // This is a limitation - we may need to store it in the database
      // For now, let's try to use the session's provider_token
      const githubToken = (session as any)?.provider_token;

      if (!githubToken) {
        // Try to get from user metadata (if stored)
        const storedToken = session?.user?.user_metadata?.github_token;
        if (!storedToken) {
          setError('GitHub token not available. Please reconnect your GitHub account.');
          setLoading(false);
          return;
        }
      }

      const token = githubToken || (session?.user?.user_metadata?.github_token as string);

      // Fetch repos from GitHub API
      const response = await fetch(
        'https://api.github.com/user/repos?per_page=100&sort=updated&affiliation=owner,collaborator',
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('GitHub token expired. Please reconnect your GitHub account.');
        }
        throw new Error('Failed to fetch repositories from GitHub');
      }

      const data = await response.json();
      setRepos(data);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch repos:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch repositories');
      setLoading(false);
    }
  }

  const filteredRepos = repos.filter(repo =>
    repo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    repo.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    repo.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-12 max-w-md text-center">
          <Loader2 className="w-12 h-12 text-[#F97316] animate-spin mx-auto mb-4" />
          <p className="text-xl font-semibold text-[#1C1917]">Loading your repositories...</p>
          <p className="text-[#57534E] mt-2">This may take a moment</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 max-w-md">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-2xl font-bold text-[#1C1917] mb-2">Connection Error</h3>
            <p className="text-[#57534E]">{error}</p>
          </div>
          <button
            onClick={() => {
              onCancel();
              window.location.href = '/settings';
            }}
            className="w-full bg-[#F97316] text-white px-6 py-3 rounded-lg hover:bg-[#EA580C] transition-all"
          >
            Go to Settings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#FAFAF9] rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-8 border-b border-[#E7E5E4] bg-white">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-3xl font-bold text-[#1C1917]">Select a Repository</h2>
              <p className="text-[#57534E] mt-2">Choose a repository to generate documentation for</p>
            </div>
            <button
              onClick={onCancel}
              className="text-[#A8A29E] hover:text-[#1C1917] transition-colors"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A8A29E]" />
            <input
              type="text"
              placeholder="Search repositories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border-2 border-[#E7E5E4] rounded-lg focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/20 transition-all"
            />
          </div>
        </div>

        {/* Repository List */}
        <div className="flex-1 overflow-y-auto p-8">
          {filteredRepos.length === 0 ? (
            <div className="text-center py-12">
              <GitBranch className="w-16 h-16 text-[#A8A29E] mx-auto mb-4" />
              <p className="text-xl font-semibold text-[#1C1917] mb-2">No repositories found</p>
              <p className="text-[#57534E]">
                {searchTerm ? 'Try a different search term' : 'No repositories available'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRepos.map((repo) => (
                <button
                  key={repo.id}
                  onClick={() => onSelect(repo)}
                  className="w-full bg-white border-2 border-[#E7E5E4] rounded-xl p-6 hover:border-[#F97316] hover:shadow-lg cursor-pointer transition-all text-left"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3 flex-1">
                      <img
                        src={repo.owner.avatar_url}
                        alt={repo.owner.login}
                        className="w-10 h-10 rounded-full"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <GitBranch className="w-4 h-4 text-[#F97316]" />
                          <h3 className="text-lg font-bold text-[#1C1917]">{repo.name}</h3>
                          {repo.private && (
                            <span className="flex items-center gap-1 text-xs bg-[#FFF5F0] text-[#F97316] px-2 py-1 rounded">
                              <Lock className="w-3 h-3" />
                              Private
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-[#A8A29E]">{repo.full_name}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-[#57534E]">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4" />
                        {repo.stargazers_count}
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {repo.watchers_count}
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-[#57534E] mb-3 line-clamp-2">
                    {repo.description || 'No description provided'}
                  </p>
                  
                  <div className="flex items-center gap-2 text-sm">
                    {repo.language && (
                      <span className="px-3 py-1 bg-[#F5F5F4] text-[#57534E] rounded-full">
                        {repo.language}
                      </span>
                    )}
                    <span className="text-[#A8A29E]">
                      Updated {new Date(repo.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
