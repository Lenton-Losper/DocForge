import { useState, useEffect } from 'react';
import { FileText, LogIn } from 'lucide-react';

const Navigation = () => {
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
      className={`fixed top-0 left-0 right-0 z-50 bg-navy transition-shadow duration-300 ${
        scrolled ? 'shadow-lg' : ''
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <FileText className="w-8 h-8 text-primary-blue" aria-hidden="true" />
            <span className="text-white text-xl font-bold">DocForge</span>
          </div>

          {/* Nav Links - Hidden on mobile, visible on desktop */}
          <div className="hidden md:flex items-center space-x-8">
            <a
              href="#product"
              className="text-gray-300 hover:text-white transition-colors duration-200"
            >
              Product
            </a>
            <a
              href="#solutions"
              className="text-gray-300 hover:text-white transition-colors duration-200"
            >
              Solutions
            </a>
            <a
              href="#security"
              className="text-gray-300 hover:text-white transition-colors duration-200"
            >
              Security
            </a>
          </div>

          {/* Right side buttons */}
          <div className="flex items-center space-x-4">
            <button
              className="text-gray-300 hover:text-white transition-colors duration-200 hidden sm:block"
              aria-label="Log in"
            >
              Log In
            </button>
            <button
              className="bg-primary-blue text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-600 transition-all duration-200 hover:scale-105 hover:shadow-lg cursor-pointer"
              aria-label="Fix my manual"
            >
              Fix My Manual →
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;

