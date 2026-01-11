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

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [repository, setRepository] = useState<any>(null);
  const [docs, setDocs] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('readme');
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    if (id) {
      fetchRepositoryAndDocs();
    }
  }, [id]);

  async function fetchRepositoryAndDocs() {
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
        alert('Repository not found');
        navigate('/projects');
        return;
      }

      setRepository(repo);

      // Fetch generated docs
      const { data: generatedDocs, error: docsError } = await supabase
        .from('generated_docs')
        .select('*')
        .eq('repository_id', id)
        .single();

      if (docsError) {
        console.error('Docs not found:', docsError);
        // Docs might not be generated yet
        setDocs(null);
      } else {
        setDocs(generatedDocs);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  }

  async function handleRegenerate() {
    if (!confirm('Regenerate documentation? This will overwrite existing docs.')) {
      return;
    }

    try {
      setRegenerating(true);

      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/generate-docs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ repository_id: id })
      });

      if (!response.ok) {
        throw new Error('Failed to regenerate documentation');
      }

      alert('Documentation is being regenerated! Refresh in a moment.');
      
      // Wait a bit then refresh
      setTimeout(() => {
        fetchRepositoryAndDocs();
        setRegenerating(false);
      }, 3000);
    } catch (err) {
      console.error('Regenerate error:', err);
      alert('Failed to regenerate documentation');
      setRegenerating(false);
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
              disabled={regenerating}
              className="px-4 py-2 text-white bg-[#F97316] hover:bg-[#EA580C] rounded-lg transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${regenerating ? 'animate-spin' : ''}`} />
              Regenerate Docs
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
            {!docs ? (
              <div className="text-center py-12">
                <Loader2 className="w-12 h-12 text-[#F97316] animate-spin mx-auto mb-4" />
                <h3 className="text-xl font-bold text-[#1C1917] mb-2">Generating Documentation...</h3>
                <p className="text-[#57534E]">This may take a minute. Please wait.</p>
                <button
                  onClick={() => fetchRepositoryAndDocs()}
                  className="mt-6 text-[#F97316] hover:text-[#EA580C] underline"
                >
                  Refresh
                </button>
              </div>
            ) : (
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
