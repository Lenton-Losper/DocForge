/** Projects page - Repository management. */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Github, FileText, RefreshCw, Trash2, ExternalLink, Settings, LayoutDashboard } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  owner: string;
  url: string;
  lastUpdate: string;
  status: 'up-to-date' | 'needs-refresh';
  docCount: number;
}

const Projects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch from backend API
    setTimeout(() => {
      setProjects([
        {
          id: '1',
          name: 'api-server',
          owner: 'acme',
          url: 'https://github.com/acme/api-server',
          lastUpdate: '2 hours ago',
          status: 'up-to-date',
          docCount: 5,
        },
        {
          id: '2',
          name: 'frontend-app',
          owner: 'acme',
          url: 'https://github.com/acme/frontend-app',
          lastUpdate: '1 day ago',
          status: 'needs-refresh',
          docCount: 4,
        },
        {
          id: '3',
          name: 'mobile-app',
          owner: 'acme',
          url: 'https://github.com/acme/mobile-app',
          lastUpdate: '3 days ago',
          status: 'needs-refresh',
          docCount: 3,
        },
      ]);
      setLoading(false);
    }, 500);
  }, []);

  const handleRegenerate = (id: string) => {
    // TODO: Call backend API to regenerate docs
    console.log('Regenerate docs for:', id);
  };

  const handleDisconnect = (id: string) => {
    // TODO: Call backend API to disconnect repo
    console.log('Disconnect repo:', id);
  };

  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      {/* Header */}
      <div className="bg-white border-b border-[#E7E5E4]">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#1C1917]">Repositories</h1>
              <p className="text-[#57534E] mt-2">Manage your connected GitHub repositories</p>
            </div>
            <div className="flex items-center gap-4">
              <Link
                to="/dashboard"
                className="flex items-center gap-2 text-[#57534E] hover:text-[#1C1917] transition-colors duration-200"
              >
                <LayoutDashboard className="w-5 h-5" />
                <span className="hidden sm:inline">Dashboard</span>
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
        {loading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-[#F97316] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-[#57534E]">Loading repositories...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 border border-[#E7E5E4] text-center">
            <Github className="w-16 h-16 text-[#A8A29E] mx-auto mb-4" />
            <p className="text-[#57534E] text-lg mb-2">No repositories connected</p>
            <p className="text-[#A8A29E] text-sm mb-6">Connect your first repository to get started</p>
            <Link
              to="/projects/connect"
              className="bg-[#F97316] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#EA580C] transition-all duration-200 inline-flex items-center space-x-2"
            >
              <Github className="w-5 h-5" />
              <span>Connect Repository</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-white rounded-2xl p-6 border border-[#E7E5E4] hover:border-[#F97316] transition-all duration-200"
              >
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Github className="w-6 h-6 text-[#57534E]" />
                      <div>
                        <h3 className="text-lg font-bold text-[#1C1917]">{project.name}</h3>
                        <p className="text-sm text-[#57534E]">{project.owner}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-[#57534E] mt-3">
                      <span>Last update: {project.lastUpdate}</span>
                      <span className="flex items-center gap-1">
                        <FileText className="w-4 h-4" />
                        {project.docCount} docs
                      </span>
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
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      to={`/projects/${project.id}`}
                      className="px-4 py-2 border border-[#E7E5E4] rounded-lg text-[#57534E] hover:border-[#F97316] hover:text-[#F97316] transition-all duration-200 inline-flex items-center space-x-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>View Docs</span>
                    </Link>
                    <button
                      onClick={() => handleRegenerate(project.id)}
                      className="px-4 py-2 bg-[#F97316] text-white rounded-lg hover:bg-[#EA580C] transition-all duration-200 inline-flex items-center space-x-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Regenerate</span>
                    </button>
                    <button
                      onClick={() => handleDisconnect(project.id)}
                      className="px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-all duration-200"
                      aria-label="Disconnect repository"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Projects;
