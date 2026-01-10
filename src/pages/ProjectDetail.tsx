/** Project detail page - Documentation viewer. */
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Github, RefreshCw, Download, FileText, BookOpen, Code, Settings } from 'lucide-react';

interface DocSection {
  id: string;
  title: string;
  type: 'readme' | 'api' | 'setup' | 'architecture';
}

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<{
    name: string;
    owner: string;
    url: string;
  } | null>(null);
  const [selectedSection, setSelectedSection] = useState<string>('readme');
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const sections: DocSection[] = [
    { id: 'readme', title: 'README', type: 'readme' },
    { id: 'api', title: 'API Documentation', type: 'api' },
    { id: 'setup', title: 'Setup Guide', type: 'setup' },
    { id: 'architecture', title: 'Architecture', type: 'architecture' },
  ];

  useEffect(() => {
    fetchProjectAndDocs();
  }, [id, selectedSection]);

  async function fetchProjectAndDocs() {
    try {
      setLoading(true);
      
      // TODO: Fetch from backend API
      // For now, use mock data
      setTimeout(() => {
        setProject({
          name: 'api-server',
          owner: 'acme',
          url: 'https://github.com/acme/api-server',
        });
        
        // Mock content based on selected section
        const mockContent: Record<string, string> = {
          readme: `# README Documentation

This is the README documentation for the project.

## Overview

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.

## Getting Started

1. Install dependencies
2. Configure environment
3. Run the application

## Features

- Feature 1
- Feature 2
- Feature 3`,
          api: `# API Documentation

## Endpoints

\`\`\`typescript
GET /api/users
POST /api/users
GET /api/users/:id
\`\`\`

*API documentation will be generated from code analysis*`,
          setup: `# Setup Guide

## Prerequisites

- Node.js 18+
- npm or yarn

## Installation

\`\`\`bash
npm install
\`\`\`

## Running

\`\`\`bash
npm start
\`\`\``,
          architecture: `# Architecture

## System Overview

High-level system architecture documentation.

## Components

- Component 1
- Component 2
- Component 3`
        };
        
        setContent(mockContent[selectedSection] || mockContent.readme);
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error('Failed to fetch project:', error);
      setLoading(false);
    }
  }

  const handleRegenerate = () => {
    // TODO: Call backend API to regenerate docs
    console.log('Regenerate docs for project:', id);
  };

  const handleExport = (format: 'markdown' | 'pdf') => {
    // TODO: Call backend API to export docs
    console.log('Export docs as:', format);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAF9]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#F97316] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#57534E]">Loading documentation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      {/* Header */}
      <div className="bg-white border-b border-[#E7E5E4]">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <Link to="/projects" className="text-[#57534E] hover:text-[#1C1917] text-sm mb-4 inline-block">
            ← Back to Projects
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <Github className="w-6 h-6 text-[#57534E]" />
            <h1 className="text-2xl font-bold text-[#1C1917]">{project?.name}</h1>
          </div>
          <p className="text-sm text-[#57534E]">{project?.owner}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar - Table of Contents */}
          <div className="w-64 flex-shrink-0">
            <div className="bg-white rounded-2xl p-6 border border-[#E7E5E4] sticky top-8">
              <p className="text-xs uppercase tracking-wider text-[#A8A29E] mb-4">Table of Contents</p>
              <div className="space-y-1">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setSelectedSection(section.id)}
                    className={`w-full text-left px-4 py-2 rounded-lg transition-all duration-200 ${
                      selectedSection === section.id
                        ? 'bg-[#FFF5F0] text-[#F97316] font-semibold'
                        : 'text-[#57534E] hover:bg-[#FAFAF9]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {section.type === 'readme' && <FileText className="w-4 h-4" />}
                      {section.type === 'api' && <Code className="w-4 h-4" />}
                      {section.type === 'setup' && <Settings className="w-4 h-4" />}
                      {section.type === 'architecture' && <BookOpen className="w-4 h-4" />}
                      <span>{section.title}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-white rounded-2xl p-8 border border-[#E7E5E4] mb-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-[#1C1917]">
                  {sections.find((s) => s.id === selectedSection)?.title}
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRegenerate}
                    className="px-4 py-2 bg-[#F97316] text-white rounded-lg hover:bg-[#EA580C] transition-all duration-200 inline-flex items-center space-x-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Regenerate Docs</span>
                  </button>
                  <div className="relative group">
                    <button className="px-4 py-2 border border-[#E7E5E4] rounded-lg text-[#57534E] hover:border-[#F97316] transition-all duration-200 inline-flex items-center space-x-2">
                      <Download className="w-4 h-4" />
                      <span>Export</span>
                    </button>
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-[#E7E5E4] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                      <button
                        onClick={() => handleExport('markdown')}
                        className="w-full text-left px-4 py-2 hover:bg-[#FAFAF9] rounded-t-lg text-sm text-[#57534E]"
                      >
                        Export as Markdown
                      </button>
                      <button
                        onClick={() => handleExport('pdf')}
                        className="w-full text-left px-4 py-2 hover:bg-[#FAFAF9] rounded-b-lg text-sm text-[#57534E]"
                      >
                        Export as PDF
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Documentation Content */}
              <div className="prose prose-slate max-w-none">
                <div className="whitespace-pre-wrap text-[#1C1917] leading-relaxed">
                  {content}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;
