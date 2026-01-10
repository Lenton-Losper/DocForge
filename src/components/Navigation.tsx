import { useState, useEffect } from 'react';
import { FileText } from 'lucide-react';

interface NavigationProps {
  onLoginClick: () => void;
  onSignUpClick: () => void;
}

const Navigation = ({ onLoginClick, onSignUpClick }: NavigationProps) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 bg-white border-b border-[#E7E5E4] transition-shadow duration-300 ${
        scrolled ? 'shadow-sm' : ''
      }`}
    >
      <div className="max-w-7xl mx-auto px-8">
        <div className="flex items-center justify-between h-16 md:h-20 py-4">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <FileText className="w-8 h-8 text-[#1C1917]" aria-hidden="true" />
            <span className="text-[#1C1917] text-xl font-bold">DocDocs</span>
          </div>

          {/* Nav Links - Hidden on mobile, visible on desktop */}
          <div className="hidden md:flex items-center space-x-8">
            <a
              href="#product"
              className="text-[#57534E] hover:text-[#1C1917] transition-colors duration-200"
            >
              Product
            </a>
            <a
              href="#solutions"
              className="text-[#57534E] hover:text-[#1C1917] transition-colors duration-200"
            >
              Solutions
            </a>
            <a
              href="#security"
              className="text-[#57534E] hover:text-[#1C1917] transition-colors duration-200"
            >
              Security
            </a>
          </div>

          {/* Right side buttons */}
          <div className="flex items-center space-x-4">
            <button
              onClick={onLoginClick}
              className="text-[#57534E] hover:text-[#1C1917] transition-colors duration-200 hidden sm:block font-medium"
              aria-label="Log in"
            >
              Log In
            </button>
            <button
              onClick={onSignUpClick}
              className="bg-[#F97316] text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-[#EA580C] transition-all duration-200 hover:scale-105 cursor-pointer shadow-lg shadow-[#F97316]/20"
              aria-label="Get started"
            >
              Get Started
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
