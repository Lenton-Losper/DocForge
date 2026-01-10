import { Upload, Github } from 'lucide-react';

interface TwoPathSectionProps {
  onUploadClick: () => void;
  onGitHubClick: () => void;
}

const TwoPathSection = ({ onUploadClick, onGitHubClick }: TwoPathSectionProps) => {
  return (
    <section className="bg-white py-16 md:py-32 px-8">
      <div className="max-w-6xl mx-auto w-full">
        {/* Heading */}
        <h2 className="text-4xl md:text-5xl font-bold text-[#1C1917] text-center mb-16">
          Choose Your Starting Point
        </h2>

        {/* Two Cards Side-by-Side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Card 1: Already Have Docs */}
          <div className="bg-white p-12 rounded-2xl border-2 border-[#E7E5E4] hover:border-[#F97316] transition-all duration-300 hover:shadow-xl min-h-[400px] flex flex-col items-center justify-center text-center hover:scale-[1.02]">
            <div className="w-20 h-20 rounded-full bg-[#FFF5F0] flex items-center justify-center mb-6">
              <Upload className="w-8 h-8 text-[#F97316]" strokeWidth={1.5} aria-hidden="true" />
            </div>
            <h3 className="text-3xl font-bold text-[#1C1917] mb-4">Upload & Validate</h3>
            <p className="text-lg text-[#57534E] mb-8 leading-relaxed">
              Upload your existing manual. Get instant quality report. Fix issues with AI.
            </p>
            <button
              onClick={onUploadClick}
              className="w-full bg-[#F97316] text-white py-4 rounded-lg font-semibold hover:bg-[#EA580C] transition-all duration-200 hover:scale-105 cursor-pointer shadow-lg shadow-[#F97316]/20 focus:ring-2 focus:ring-[#F97316] focus:ring-offset-2"
              aria-label="Upload document"
            >
              Upload Document
            </button>
          </div>

          {/* Card 2: Starting from Code */}
          <div className="bg-white p-12 rounded-2xl border-2 border-[#E7E5E4] hover:border-[#F97316] transition-all duration-300 hover:shadow-xl min-h-[400px] flex flex-col items-center justify-center text-center hover:scale-[1.02]">
            <div className="w-20 h-20 rounded-full bg-[#FFF5F0] flex items-center justify-center mb-6">
              <Github className="w-8 h-8 text-[#F97316]" strokeWidth={1.5} aria-hidden="true" />
            </div>
            <h3 className="text-3xl font-bold text-[#1C1917] mb-4">Connect & Generate</h3>
            <p className="text-lg text-[#57534E] mb-8 leading-relaxed">
              Link your repository. Auto-generate comprehensive docs. Keep them in sync.
            </p>
            <button
              onClick={onGitHubClick}
              className="w-full bg-[#F97316] text-white py-4 rounded-lg font-semibold hover:bg-[#EA580C] transition-all duration-200 hover:scale-105 cursor-pointer shadow-lg shadow-[#F97316]/20 focus:ring-2 focus:ring-[#F97316] focus:ring-offset-2"
              aria-label="Connect GitHub"
            >
              Connect GitHub
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TwoPathSection;
