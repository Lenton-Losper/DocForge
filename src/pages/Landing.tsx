/** Landing page - Public marketing page. */
import { useState } from 'react';
import Navigation from '../components/Navigation';
import Hero from '../components/Hero';
import TwoPathSection from '../components/TwoPathSection';
import Preview from '../components/Preview';
import Footer from '../components/Footer';
import SignUpModal from '../components/SignUpModal';
const Landing = () => {
  const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'signup' | 'login'>('signup');
  const [actionType, setActionType] = useState<'upload' | 'github' | undefined>();
  const [isAnalyzing] = useState(false);

  const handleLoginClick = () => {
    setModalMode('login');
    setIsSignUpModalOpen(true);
  };

  const handleSignUpClick = () => {
    setModalMode('signup');
    setIsSignUpModalOpen(true);
  };

  const handleUploadClick = () => {
    setActionType('upload');
    setModalMode('signup');
    setIsSignUpModalOpen(true);
  };

  const handleGitHubClick = () => {
    setActionType('github');
    setModalMode('signup');
    setIsSignUpModalOpen(true);
  };

  const handleAuthSuccess = () => {
    // Redirect handled by PublicRoute component
    window.location.href = '/dashboard';
  };

  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      <Navigation 
        onLoginClick={handleLoginClick}
        onSignUpClick={handleSignUpClick}
      />
      <main className="flex flex-col">
        <Hero 
          onUploadClick={handleUploadClick}
          onGitHubClick={handleGitHubClick}
          isAnalyzing={isAnalyzing}
        />
        <TwoPathSection 
          onUploadClick={handleUploadClick}
          onGitHubClick={handleGitHubClick}
        />
        <Preview />
        <Footer />
      </main>
      
      {/* Authentication Modal */}
      <SignUpModal
        isOpen={isSignUpModalOpen}
        onClose={() => setIsSignUpModalOpen(false)}
        initialMode={modalMode}
        onSuccess={handleAuthSuccess}
        actionType={actionType}
      />
    </div>
  );
};

export default Landing;
