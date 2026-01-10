/** Settings page - Account and integration settings. */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase.js';
import { Github, Trash2, LogOut, Check, AlertCircle, Loader2, LayoutDashboard, FolderOpen } from 'lucide-react';

const Settings = () => {
  const { user, signOut } = useAuth();
  const [autoRegenerate, setAutoRegenerate] = useState(false);
  const [githubConnected, setGithubConnected] = useState(false);
  const [githubUsername, setGithubUsername] = useState('');
  const [connectingGitHub, setConnectingGitHub] = useState(false);

  // Check if GitHub is connected on mount
  useEffect(() => {
    checkGitHubConnection();
  }, [user]);

  // Handle OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('github') === 'connected') {
      handleGitHubCallback();
      // Clean URL
      window.history.replaceState({}, '', '/settings');
    }
  }, []);

  async function checkGitHubConnection() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user?.app_metadata?.provider === 'github') {
        setGithubConnected(true);
        setGithubUsername(session.user.user_metadata?.user_name || 'Connected');
      } else if (session?.user?.identities?.some((id: any) => id.provider === 'github')) {
        setGithubConnected(true);
        setGithubUsername(session.user.user_metadata?.user_name || 'Connected');
      }
    } catch (error) {
      console.error('Error checking GitHub connection:', error);
    }
  }

  async function handleGitHubCallback() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.provider_token || session?.user?.identities?.some((id: any) => id.provider === 'github')) {
        setGithubConnected(true);
        setGithubUsername(session.user.user_metadata?.user_name || 'Connected');
        alert('GitHub connected successfully!');
      }
    } catch (error) {
      console.error('Error handling GitHub callback:', error);
    }
  }

  async function connectGitHub() {
    setConnectingGitHub(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          scopes: 'repo read:user',
          redirectTo: `${window.location.origin}/settings?github=connected`
        }
      });
      
      if (error) {
        console.error('GitHub OAuth error:', error);
        alert('Failed to connect GitHub: ' + error.message);
        setConnectingGitHub(false);
      }
      // If successful, user will be redirected to GitHub, then back to /settings
    } catch (err) {
      console.error('GitHub OAuth error:', err);
      alert('Failed to connect GitHub');
      setConnectingGitHub(false);
    }
  }

  const handleDisconnectGitHub = async () => {
    if (confirm('Disconnect GitHub? This will remove access to your repositories.')) {
      // Note: Supabase doesn't have a direct "unlink" method
      // You'd need to handle this in your database
      // For now, we'll just update the UI state
      // TODO: Implement proper disconnection via backend API
      setGithubConnected(false);
      setGithubUsername('');
      alert('GitHub disconnected');
    }
  };

  const handleConnectGitHub = () => {
    // TODO: Trigger GitHub OAuth flow
    console.log('Connect GitHub');
  };

  const handleDeleteAccount = () => {
    // TODO: Show confirmation modal and call backend API
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      console.log('Delete account');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      {/* Header */}
      <div className="bg-white border-b border-[#E7E5E4]">
        <div className="max-w-4xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#1C1917]">Settings</h1>
              <p className="text-[#57534E] mt-2">Manage your account and integrations</p>
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
                to="/projects"
                className="flex items-center gap-2 text-[#57534E] hover:text-[#1C1917] transition-colors duration-200"
              >
                <FolderOpen className="w-5 h-5" />
                <span className="hidden sm:inline">Projects</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-8 py-8 space-y-6">
        {/* Profile Section */}
        <div className="bg-white rounded-2xl p-6 border border-[#E7E5E4]">
          <h2 className="text-xl font-bold text-[#1C1917] mb-4">Profile</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#57534E] mb-2">Email</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-4 py-3 border-2 border-[#E7E5E4] rounded-lg bg-[#FAFAF9] text-[#57534E]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#57534E] mb-2">Auth Provider</label>
              <input
                type="text"
                value="Email/Password"
                disabled
                className="w-full px-4 py-3 border-2 border-[#E7E5E4] rounded-lg bg-[#FAFAF9] text-[#57534E]"
              />
            </div>
          </div>
        </div>

        {/* GitHub Integration */}
        <div className="bg-white rounded-2xl border-2 border-[#E7E5E4] p-8">
          <h2 className="text-2xl font-bold text-[#1C1917] mb-2">GitHub Integration</h2>
          <p className="text-[#57534E] mb-6">
            Connect your GitHub account to analyze and generate documentation for your repositories
          </p>

          {githubConnected ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-[#F0FDF4] border border-[#10B981] rounded-lg">
                <Check className="w-5 h-5 text-[#10B981]" />
                <div>
                  <p className="font-semibold text-[#1C1917]">Connected to GitHub</p>
                  <p className="text-sm text-[#57534E]">@{githubUsername}</p>
                </div>
              </div>
              
              <button
                onClick={handleDisconnectGitHub}
                className="w-full bg-white border-2 border-[#E7E5E4] text-[#1C1917] px-6 py-3 rounded-lg hover:border-[#EF4444] hover:text-[#EF4444] transition-all"
              >
                Disconnect GitHub
              </button>
            </div>
          ) : (
            <button
              onClick={connectGitHub}
              disabled={connectingGitHub}
              className="w-full bg-[#1C1917] text-white px-6 py-3 rounded-lg hover:bg-[#57534E] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {connectingGitHub ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <Github className="w-5 h-5" />
                  <span>Connect GitHub Account</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Preferences */}
        <div className="bg-white rounded-2xl p-6 border border-[#E7E5E4]">
          <h2 className="text-xl font-bold text-[#1C1917] mb-4">Preferences</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-[#1C1917]">Auto-regenerate docs on push</p>
                <p className="text-sm text-[#57534E]">
                  Automatically regenerate documentation when code is pushed to connected repositories
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoRegenerate}
                  onChange={(e) => setAutoRegenerate(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-[#E7E5E4] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#F97316] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#F97316]"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-2xl p-6 border-2 border-red-200">
          <h2 className="text-xl font-bold text-red-600 mb-4">Danger Zone</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-[#1C1917]">Sign Out</p>
                <p className="text-sm text-[#57534E]">Sign out of your account</p>
              </div>
              <button
                onClick={signOut}
                className="px-4 py-2 border border-[#E7E5E4] text-[#57534E] rounded-lg hover:border-[#F97316] hover:text-[#F97316] transition-all duration-200 inline-flex items-center space-x-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-red-200">
              <div>
                <p className="font-semibold text-red-600">Delete Account</p>
                <p className="text-sm text-[#57534E]">
                  Permanently delete your account and all associated data
                </p>
              </div>
              <button
                onClick={handleDeleteAccount}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 inline-flex items-center space-x-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Account</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
