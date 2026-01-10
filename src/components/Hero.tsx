import { useRef } from 'react';
import { Upload, Github, Check, Loader2 } from 'lucide-react';

interface HeroProps {
  onUploadClick: () => void;
  onGitHubClick: () => void;
  isAnalyzing?: boolean;
}

const Hero = ({ onUploadClick, onGitHubClick, isAnalyzing = false }: HeroProps) => {
  const scrollToPreview = () => {
    const previewSection = document.getElementById('preview');
    if (previewSection) {
      previewSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="min-h-screen flex items-center bg-[#FAFAF9]">
      <div className="max-w-6xl mx-auto px-8 py-24 w-full">
        {/* Massive Headline */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-[#1C1917] mb-6 leading-tight">
          Your boss sent it back. Again.
        </h1>

        {/* Large Subheading */}
        <p className="text-xl text-[#57534E] mb-12 max-w-3xl leading-relaxed">
          AI-powered documentation linting catches gaps, inconsistencies, and role mismatches before your manager does. Upload your manual, get instant fixes.
        </p>

        {/* Two CTAs Side-by-Side */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <button
            onClick={onUploadClick}
            disabled={isAnalyzing}
            className={`${
              isAnalyzing
                ? 'bg-[#A8A29E] cursor-not-allowed'
                : 'bg-[#F97316] hover:bg-[#EA580C] cursor-pointer shadow-lg shadow-[#F97316]/20'
            } text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-200 hover:scale-105 disabled:hover:scale-100 disabled:opacity-50 inline-flex items-center space-x-2 w-full sm:w-auto`}
            aria-label={isAnalyzing ? 'Analyzing document' : 'Upload your documentation'}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" aria-hidden="true" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <Upload className="w-6 h-6" aria-hidden="true" />
                <span>Upload Documentation</span>
              </>
            )}
          </button>
          
          <button
            onClick={onGitHubClick}
            className="bg-white text-[#1C1917] border-2 border-[#E7E5E4] px-8 py-4 rounded-lg text-lg font-semibold hover:border-[#F97316] transition-all duration-200 hover:scale-105 cursor-pointer inline-flex items-center space-x-2 w-full sm:w-auto"
            aria-label="Connect GitHub"
          >
            <Github className="w-6 h-6" aria-hidden="true" />
            <span>Connect GitHub</span>
          </button>
        </div>

        {/* See example report link */}
        <button
          onClick={scrollToPreview}
          className="text-[#F97316] hover:text-[#EA580C] font-medium mt-8 transition-colors duration-200 cursor-pointer inline-flex items-center space-x-1 underline"
          aria-label="See example report"
        >
          <span>See example report</span>
          <span>→</span>
        </button>

        {/* Trust Badges with generous spacing */}
        <div className="flex flex-col sm:flex-row items-center gap-8 mt-16">
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5 text-[#10B981] flex-shrink-0" aria-hidden="true" />
            <span className="text-[#57534E] text-sm">Trusted by 500+ technical writers</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5 text-[#10B981] flex-shrink-0" aria-hidden="true" />
            <span className="text-[#57534E] text-sm">SOC 2 Compliant</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5 text-[#10B981] flex-shrink-0" aria-hidden="true" />
            <span className="text-[#57534E] text-sm">No credit card required</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
