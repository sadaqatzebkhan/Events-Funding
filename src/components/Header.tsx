import React from 'react';
import { LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  title: string;
}

export const Header: React.FC<HeaderProps> = ({ title }) => {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3 shadow-2xs">
      <div className="max-w-lg mx-auto flex items-center justify-between gap-3">
        {/* Logo, Title & User Meta */}
        <div className="min-w-0 flex-1 flex items-center gap-3">
          <img
            src="/logo.jpeg"
            alt="Mazeed Abad Fund logo"
            referrerPolicy="no-referrer"
            className="w-11 h-11 rounded-xl object-contain bg-white p-1 shadow-xs border border-slate-200 shrink-0"
          />
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-slate-900 truncate tracking-tight">
              {title}
            </h1>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 min-w-0">
            <span className="font-medium text-slate-700 truncate min-w-0">{user?.name}</span>
            <span className="shrink-0">•</span>
            <span
              className={`shrink-0 text-[11px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider ${
                user?.role === 'admin'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : user?.role === 'viewer'
                  ? 'bg-purple-50 text-purple-800 border border-purple-200'
                  : 'bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              {user?.role === 'admin' ? 'Admin' : user?.role === 'viewer' ? 'View Only' : 'Member'}
            </span>
            </div>
          </div>
        </div>

        {/* Right Action: Logout */}
        <div className="flex items-center gap-2">
          <button
            id="header-logout-btn"
            onClick={logout}
            className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-medium"
            title="Logout"
            aria-label="Logout"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};
