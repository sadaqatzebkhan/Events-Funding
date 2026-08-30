import React, { useState } from 'react';
import { LayoutDashboard, CalendarDays, Users, UserCircle, LogOut, ShieldCheck, User as UserIcon, Eye } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DeveloperProfileModal } from './DeveloperProfileModal';

export type NavTab = 'dashboard' | 'events' | 'members' | 'profile';

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isOpen,
  onClose,
}) => {
  const { user, logout } = useAuth();
  const [isDevProfileOpen, setIsDevProfileOpen] = useState(false);

  const navItems = [
    { id: 'dashboard' as NavTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'events' as NavTab, label: 'Events', icon: CalendarDays },
    { id: 'members' as NavTab, label: 'Members', icon: Users },
    { id: 'profile' as NavTab, label: 'Profile', icon: UserCircle },
  ];

  const handleNavClick = (tab: NavTab) => {
    setActiveTab(tab);
    onClose();
  };

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-white text-slate-900 border-r border-slate-200 flex flex-col justify-between transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div>
          <div className="px-6 py-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src="/logo.jpeg"
                alt="Mazeed Abad Fund logo"
                referrerPolicy="no-referrer"
                className="w-12 h-12 rounded-2xl object-contain bg-white p-1 shadow-xs border border-emerald-100"
              />
              <div>
                <h1 className="font-bold text-base text-slate-900 leading-tight tracking-tight">
                  Mazeed Abad Fund
                </h1>
                <p className="text-[11px] text-emerald-700 font-semibold tracking-wide">
                  Transparent Fund System
                </p>
              </div>
            </div>
            {/* Mobile Close */}
            <button
              onClick={onClose}
              className="lg:hidden p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              aria-label="Close Navigation"
            >
              ✕
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5" aria-label="Main Navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-tab-${item.id}`}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-medium transition-all text-left cursor-pointer ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-900 border border-emerald-200/80 font-bold shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon size={19} className={isActive ? 'text-emerald-700' : 'text-slate-400'} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Card & Logout Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-slate-200/80 mb-2.5 shadow-2xs">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
              user?.role === 'admin'
                ? 'bg-emerald-100 text-emerald-800'
                : user?.role === 'viewer'
                ? 'bg-purple-100 text-purple-800'
                : 'bg-blue-100 text-blue-800'
            }`}>
              {user?.role === 'admin' ? (
                <ShieldCheck size={18} className="text-emerald-700" />
              ) : user?.role === 'viewer' ? (
                <Eye size={18} className="text-purple-700" />
              ) : (
                <UserIcon size={18} className="text-blue-700" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-900 truncate">{user?.name}</p>
              <div className="flex items-center gap-1.5">
                <span
                  className={`inline-block w-1.5 h-1.5 rounded-full ${
                    user?.role === 'admin'
                      ? 'bg-emerald-600'
                      : user?.role === 'viewer'
                      ? 'bg-purple-600'
                      : 'bg-blue-500'
                  }`}
                />
                <p className="text-xs text-slate-500 capitalize font-medium">
                  {user?.role === 'admin'
                    ? 'Family Admin'
                    : user?.role === 'viewer'
                    ? 'View Only (Observer)'
                    : 'Contributing Member'}
                </p>
              </div>
            </div>
          </div>

          <button
            id="sidebar-logout-btn"
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>

          {/* Developer Credit in Sidebar */}
          <div className="pt-2 text-center border-t border-slate-100 mt-2 text-[11px] text-slate-400 font-medium select-none">
            <span>App by </span>
            <button
              type="button"
              onClick={() => setIsDevProfileOpen(true)}
              className="text-emerald-700 font-bold hover:text-emerald-800 hover:underline cursor-pointer focus:outline-none"
            >
              Sadaqat Zeb Khan
            </button>
          </div>
        </div>
      </aside>

      {/* Developer Profile Modal */}
      <DeveloperProfileModal
        isOpen={isDevProfileOpen}
        onClose={() => setIsDevProfileOpen(false)}
      />
    </>
  );
};
