import React from 'react';

interface SkeletonProps {
  className?: string;
}

/**
 * Base shimmer block. Compose these into per-page skeletons that mirror the
 * real layout (see DashboardSkeleton, EventsSkeleton, etc. below) instead of
 * generic gray rectangles, so the loading state doesn't visually jump when
 * real content swaps in.
 */
export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => (
  <div className={`skeleton-shimmer rounded-lg ${className}`} aria-hidden="true" />
);

export const DashboardSkeleton: React.FC = () => (
  <div className="p-4 max-w-lg mx-auto space-y-4" role="status" aria-label="Loading dashboard">
    <div className="rounded-3xl bg-white p-5 sm:p-6 shadow-xs border border-slate-200 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Skeleton className="w-8 h-8 rounded-xl" />
          <Skeleton className="w-32 h-3" />
        </div>
        <Skeleton className="w-20 h-8 rounded-xl" />
      </div>
      <div className="space-y-2">
        <Skeleton className="w-28 h-3" />
        <Skeleton className="w-40 h-9" />
        <Skeleton className="w-full h-3" />
      </div>
      <div className="pt-3 border-t border-slate-100 grid grid-cols-3 gap-2">
        <Skeleton className="h-16 rounded-2xl" />
        <Skeleton className="h-16 rounded-2xl" />
        <Skeleton className="h-16 rounded-2xl" />
      </div>
    </div>
    <div className="grid grid-cols-2 gap-3">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between">
            <Skeleton className="w-16 h-3" />
            <Skeleton className="w-4 h-4 rounded" />
          </div>
          <Skeleton className="w-14 h-5" />
          <Skeleton className="w-20 h-2.5" />
        </div>
      ))}
    </div>
  </div>
);

export const EventsSkeleton: React.FC = () => (
  <div className="space-y-3" role="status" aria-label="Loading events">
    {[0, 1, 2].map((i) => (
      <div key={i} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1.5 flex-1">
            <Skeleton className="w-3/4 h-4" />
            <Skeleton className="w-24 h-2.5" />
          </div>
          <Skeleton className="w-16 h-5 rounded-lg" />
        </div>
        <Skeleton className="w-full h-8 rounded-xl" />
        <Skeleton className="w-full h-9 rounded-xl" />
      </div>
    ))}
  </div>
);

export const EventDetailsSkeleton: React.FC = () => (
  <div className="p-4 space-y-4 max-w-lg mx-auto" role="status" aria-label="Loading event details">
    <div className="flex items-center justify-between gap-2">
      <Skeleton className="w-20 h-8 rounded-xl" />
      <Skeleton className="w-24 h-7 rounded-xl" />
    </div>
    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
      <div className="space-y-1.5">
        <Skeleton className="w-2/3 h-4" />
        <Skeleton className="w-28 h-2.5" />
      </div>
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-14 rounded-xl" />
        ))}
      </div>
    </div>
    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
      <Skeleton className="w-40 h-3" />
      <div className="flex gap-1.5">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="w-16 h-6 rounded-lg" />
        ))}
      </div>
      {[0, 1, 2].map((i) => (
        <div key={i} className="p-3 rounded-xl border border-slate-200 space-y-2">
          <div className="flex items-center justify-between">
            <Skeleton className="w-32 h-3.5" />
            <Skeleton className="w-14 h-5 rounded-full" />
          </div>
          <Skeleton className="w-full h-8 rounded-lg" />
        </div>
      ))}
    </div>
  </div>
);

export const MembersSkeleton: React.FC = () => (
  <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6" role="status" aria-label="Loading members">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="space-y-2">
        <Skeleton className="w-56 h-6" />
        <Skeleton className="w-72 h-3" />
      </div>
      <Skeleton className="w-40 h-10 rounded-xl" />
    </div>
    <Skeleton className="w-full sm:max-w-md h-10 rounded-xl" />
    <div className="space-y-3">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1.5">
              <Skeleton className="w-32 h-4" />
              <Skeleton className="w-24 h-2.5" />
            </div>
            <Skeleton className="w-16 h-5 rounded-full" />
          </div>
          <Skeleton className="w-full h-14 rounded-xl" />
          <Skeleton className="w-full h-9 rounded-xl" />
        </div>
      ))}
    </div>
  </div>
);

export const MemberDetailsSkeleton: React.FC = () => (
  <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto" role="status" aria-label="Loading member profile">
    <Skeleton className="w-36 h-8 rounded-xl" />
    <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs">
      <div className="flex items-start gap-4">
        <Skeleton className="w-16 h-16 rounded-2xl shrink-0" />
        <div className="space-y-2 flex-1">
          <Skeleton className="w-48 h-6" />
          <Skeleton className="w-36 h-3" />
          <Skeleton className="w-40 h-3" />
        </div>
      </div>
    </div>
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {[0, 1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-24 rounded-2xl" />
      ))}
    </div>
    <Skeleton className="h-64 rounded-3xl" />
  </div>
);

export const ProfileSkeleton: React.FC = () => (
  <div className="space-y-3" role="status" aria-label="Loading contribution history">
    <Skeleton className="h-20 rounded-2xl" />
    <Skeleton className="h-20 rounded-2xl" />
  </div>
);
