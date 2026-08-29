import React from 'react';

interface PageLoaderProps {
  label?: string;
}

/**
 * Full-screen branded loader shown while the initial session check
 * (GET /api/auth/me) is in flight. Two staggered rings pulse outward from
 * the logo so it reads as "actively working," not a static badge.
 */
export const PageLoader: React.FC<PageLoaderProps> = ({ label = 'Loading Mazeed Abad Fund...' }) => (
  <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-900 gap-4">
    <div className="relative w-24 h-24 flex items-center justify-center">
      <span className="loader-ring absolute inset-0 rounded-3xl bg-emerald-500/40" />
      <span className="loader-ring loader-ring-delay absolute inset-0 rounded-3xl bg-emerald-500/40" />
      <img
        src="/logo.jpeg"
        alt="Mazeed Abad Fund logo"
        referrerPolicy="no-referrer"
        className="loader-logo relative w-20 h-20 rounded-3xl object-contain bg-white p-1.5 shadow-md border border-white"
      />
    </div>
    <p className="text-xs font-semibold text-slate-500 tracking-wide">{label}</p>
  </div>
);
