import { useRef } from 'react';
import { Upload, Check, Loader2 } from 'lucide-react';

interface HeroProps {
  onFileUpload: (file: File) => void;
  isAnalyzing: boolean;
}

const Hero = ({ onFileUpload, isAnalyzing }: HeroProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToPreview = () => {
    const previewSection = document.getElementById('preview');
    if (previewSection) {
      previewSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileUpload(file);
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-4xl mx-auto text-center">
        {/* Main Heading */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-6">
          Your boss sent it back. Again.
        </h1>

        {/* Subheading */}
        <p className="text-lg sm:text-xl text-gray-600 mb-10 max-w-3xl mx-auto">
          AI-powered documentation linting catches gaps, inconsistencies, and role mismatches before your manager does. Upload your manual, get instant fixes.
        </p>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.doc,.md"
          onChange={handleFileChange}
          className="hidden"
          aria-label="File upload input"
        />

        {/* CTA Button */}
        <div className="mb-8">
          <button
            onClick={handleUploadClick}
            disabled={isAnalyzing}
            className={`${
              isAnalyzing
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-primary-blue hover:bg-blue-600 hover:scale-105 hover:shadow-xl cursor-pointer'
            } text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 inline-flex items-center space-x-2`}
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
                <span>Upload Your Documentation</span>
              </>
            )}
          </button>
        </div>

        {/* See example report link */}
        <button
          onClick={scrollToPreview}
          className="text-primary-blue hover:text-blue-600 font-medium mb-12 transition-colors duration-200 cursor-pointer inline-flex items-center space-x-1"
          aria-label="See example report"
        >
          <span>See example report</span>
          <span>→</span>
        </button>

        {/* Trust Badges */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-8 text-sm sm:text-base text-gray-600">
          <div className="flex items-center space-x-2">
            <Check className="w-5 h-5 text-green-500 flex-shrink-0" aria-hidden="true" />
            <span>Trusted by 500+ technical writers</span>
          </div>
          <div className="flex items-center space-x-2">
            <Check className="w-5 h-5 text-green-500 flex-shrink-0" aria-hidden="true" />
            <span>SOC 2 Compliant</span>
          </div>
          <div className="flex items-center space-x-2">
            <Check className="w-5 h-5 text-green-500 flex-shrink-0" aria-hidden="true" />
            <span>No credit card required</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;

