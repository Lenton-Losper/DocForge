/** Dashboard layout with navigation sidebar. */
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FolderOpen, Settings, LogOut, FileText } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const location = useLocation();
  const { signOut, user } = useAuth();

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/projects', label: 'Projects', icon: FolderOpen },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAF9] flex">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-[#E7E5E4] min-h-screen flex flex-col">
        <div className="p-6 border-b border-[#E7E5E4]">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-8 h-8 text-[#F97316]" />
            <span className="text-xl font-bold text-[#1C1917]">DocDocs</span>
          </div>
          {user?.email && (
            <p className="text-sm text-[#57534E] truncate">{user.email}</p>
          )}
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-[#FFF5F0] text-[#F97316] font-semibold'
                        : 'text-[#57534E] hover:bg-[#FAFAF9]'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-[#E7E5E4]">
          <button
            onClick={signOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-[#57534E] hover:bg-[#FAFAF9] transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">{children}</div>
    </div>
  );
};

export default DashboardLayout;
