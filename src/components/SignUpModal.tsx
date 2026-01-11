import { X, Github } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase.js';

interface SignUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signup' | 'login';
  actionType?: 'upload' | 'github';
  onSuccess?: () => void;
}

const SignUpModal = ({ 
  isOpen, 
  onClose, 
  initialMode = 'signup',
  actionType, 
  onSuccess 
}: SignUpModalProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoginMode, setIsLoginMode] = useState(initialMode === 'login');
  const { signUp, signIn } = useAuth();

  async function signInWithGitHub() {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          scopes: 'repo read:user',
          redirectTo: `${window.location.origin}/dashboard`
        }
      });
      
      if (error) {
        console.error('GitHub OAuth error:', error);
        setError(error.message);
      }
    } catch (err) {
      console.error('GitHub sign-in error:', err);
      setError('Failed to sign in with GitHub');
    }
  }

  // Update mode when initialMode prop changes
  useEffect(() => {
    setIsLoginMode(initialMode === 'login');
  }, [initialMode]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setEmail('');
      setPassword('');
      setError(null);
      setIsLoading(false);
    }
  }, [isOpen]);

  // Handle ESC key to close modal
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    
    try {
      const { error: authError } = isLoginMode
        ? await signIn(email, password)
        : await signUp(email, password);

      if (authError) {
        setError(authError.message);
        setIsLoading(false);
        return;
      }

      // Success - close modal and trigger callback
      setEmail('');
      setPassword('');
      setIsLoading(false);
      onClose();
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError('An unexpected error occurred');
      setIsLoading(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#1C1917]/50 backdrop-blur-sm p-4"
      onClick={handleOverlayClick}
      aria-label="Close modal"
    >
      <div
        className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl relative focus:outline-none focus:ring-2 focus:ring-[#F97316] focus:ring-offset-2"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#A8A29E] hover:text-[#1C1917] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#F97316] focus:ring-offset-2 rounded-lg"
          aria-label="Close modal"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Title */}
        <h2 className="text-2xl font-bold text-[#1C1917] mb-6">
          {isLoginMode ? 'Log in to DocDocs' : 'Get Started with DocDocs'}
        </h2>
        <p className="text-[#57534E] mb-8 leading-relaxed">
          {isLoginMode
            ? 'Welcome back! Sign in to continue.'
            : actionType === 'upload'
            ? 'Create an account to upload and validate your documentation.'
            : actionType === 'github'
            ? 'Create an account to connect your repository and generate docs.'
            : 'Create an account to get started.'}
        </p>

        {/* Error Message */}
        {error && (
          <div className="mb-4 bg-red-50 text-[#EF4444] px-4 py-2 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* GitHub OAuth Button */}
        <div className="mb-6">
          <button
            onClick={signInWithGitHub}
            type="button"
            className="w-full bg-[#1C1917] text-white py-3 rounded-lg hover:bg-[#57534E] transition-all flex items-center justify-center gap-2 font-semibold"
          >
            <Github className="w-5 h-5" />
            Continue with GitHub
          </button>
          
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#E7E5E4]"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-[#A8A29E]">Or continue with email</span>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Input */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[#57534E] mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border-2 border-[#E7E5E4] rounded-lg focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/20 transition-all duration-200 outline-none"
              placeholder="you@example.com"
            />
          </div>

          {/* Password Input */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[#57534E] mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-4 py-3 border-2 border-[#E7E5E4] rounded-lg focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/20 transition-all duration-200 outline-none"
              placeholder="••••••••"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#F97316] text-white py-3 rounded-lg font-semibold hover:bg-[#EA580C] transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg shadow-[#F97316]/20 focus:ring-2 focus:ring-[#F97316] focus:ring-offset-2"
          >
            {isLoading
              ? (isLoginMode ? 'Signing in...' : 'Creating Account...')
              : (isLoginMode ? 'Log In' : 'Create Account')}
          </button>
        </form>

        {/* Footer - Mode Switch */}
        <p className="mt-6 text-center text-sm text-[#57534E]">
          {isLoginMode ? (
            <>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => setIsLoginMode(false)}
                className="text-[#F97316] hover:text-[#EA580C] underline transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#F97316] focus:ring-offset-2 rounded font-semibold"
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setIsLoginMode(true)}
                className="text-[#F97316] hover:text-[#EA580C] underline transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#F97316] focus:ring-offset-2 rounded font-semibold"
              >
                Log in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
};

export default SignUpModal;
