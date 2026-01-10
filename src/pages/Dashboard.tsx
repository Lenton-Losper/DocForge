/** Dashboard page - Overview of repositories and documentation. */
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Github, FileText, Clock, Plus, Loader2, Settings, FolderOpen } from 'lucide-react';
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
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalRepos: 0,
    docsGenerated: 0,
    lastSync: null as string | null,
  });
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRepoPicker, setShowRepoPicker] = useState(false);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  async function fetchProjects() {
    try {
      // TODO: Fetch from backend API
      // For now, use mock data
      setTimeout(() => {
        setStats({
          totalRepos: 3,
          docsGenerated: 12,
          lastSync: '2 hours ago',
        });
        setProjects([
          {
            id: '1',
            name: 'api-server',
            owner: 'acme',
            lastSync: '2 hours ago',
            status: 'up-to-date',
            docCount: 5,
          },
          {
            id: '2',
            name: 'frontend-app',
            owner: 'acme',
            lastSync: '1 day ago',
            status: 'needs-refresh',
            docCount: 4,
          },
          {
            id: '3',
            name: 'mobile-app',
            owner: 'acme',
            lastSync: '3 days ago',
            status: 'needs-refresh',
            docCount: 3,
          },
        ]);
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
      setLoading(false);
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

  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      {/* Header */}
      <div className="bg-white border-b border-[#E7E5E4]">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#1C1917]">
                Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''}!
              </h1>
              <p className="text-[#57534E] mt-2">Manage your repositories and documentation</p>
            </div>
            <div className="flex items-center gap-4">
              <Link
                to="/projects"
                className="flex items-center gap-2 text-[#57534E] hover:text-[#1C1917] transition-colors duration-200"
              >
                <FolderOpen className="w-5 h-5" />
                <span className="hidden sm:inline">Projects</span>
              </Link>
              <Link
                to="/settings"
                className="flex items-center gap-2 text-[#57534E] hover:text-[#1C1917] transition-colors duration-200"
              >
                <Settings className="w-5 h-5" />
                <span className="hidden sm:inline">Settings</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 border border-[#E7E5E4] shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <Github className="w-8 h-8 text-[#F97316]" />
              <span className="text-3xl font-bold text-[#1C1917]">{stats.totalRepos}</span>
            </div>
            <p className="text-[#57534E] text-sm">Repositories Connected</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-[#E7E5E4] shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <FileText className="w-8 h-8 text-[#F97316]" />
              <span className="text-3xl font-bold text-[#1C1917]">{stats.docsGenerated}</span>
            </div>
            <p className="text-[#57534E] text-sm">Docs Generated</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-[#E7E5E4] shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <Clock className="w-8 h-8 text-[#F97316]" />
              <span className="text-sm font-semibold text-[#1C1917]">
                {stats.lastSync || 'Never'}
              </span>
            </div>
            <p className="text-[#57534E] text-sm">Last Sync</p>
          </div>
        </div>

        {/* Primary CTA */}
        <div className="bg-white rounded-2xl p-8 border border-[#E7E5E4] shadow-sm mb-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-[#1C1917] mb-2">Connect Your First Repository</h2>
              <p className="text-[#57534E]">
                Link your GitHub repository to automatically generate documentation
              </p>
            </div>
            <button
              onClick={() => setShowRepoPicker(true)}
              className="bg-[#F97316] text-white px-8 py-4 rounded-lg font-semibold hover:bg-[#EA580C] transition-all duration-200 hover:scale-105 shadow-lg shadow-[#F97316]/20 inline-flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Connect Repository</span>
            </button>
          </div>
        </div>

        {/* Recent Repositories */}
        <div>
          <h2 className="text-2xl font-bold text-[#1C1917] mb-6">Recent Repositories</h2>
          
          {loading ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-[#F97316] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-[#57534E]">Loading repositories...</p>
            </div>
          ) : projects.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 border border-[#E7E5E4] text-center">
              <Github className="w-16 h-16 text-[#A8A29E] mx-auto mb-4" />
              <p className="text-[#57534E] text-lg mb-2">No repositories connected yet</p>
              <p className="text-[#A8A29E] text-sm">Connect your first repository to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  to={`/projects/${project.id}`}
                  className="bg-white rounded-2xl p-6 border border-[#E7E5E4] hover:border-[#F97316] transition-all duration-200 hover:shadow-lg"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-[#1C1917]">{project.name}</h3>
                      <p className="text-sm text-[#57534E]">{project.owner}</p>
                    </div>
                    <Github className="w-6 h-6 text-[#A8A29E]" />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#57534E]">Last sync: {project.lastSync}</span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        project.status === 'up-to-date'
                          ? 'bg-green-50 text-green-700'
                          : 'bg-orange-50 text-orange-700'
                      }`}
                    >
                      {project.status === 'up-to-date' ? 'Up-to-date' : 'Needs refresh'}
                    </span>
                  </div>
                  <div className="mt-4 pt-4 border-t border-[#E7E5E4]">
                    <p className="text-sm text-[#57534E]">
                      <FileText className="w-4 h-4 inline mr-1" />
                      {project.docCount} documentation files
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

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
