import React from 'react';
import { formatCurrency } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import {
  Wallet,
  CalendarDays,
  Users,
  ArrowUpRight,
  Clock,
  ChevronRight,
  PlusCircle,
  RefreshCw,
} from 'lucide-react';
import { DashboardSkeleton } from '../components/Skeleton';

interface DashboardPageProps {
  onNavigateToEvents: () => void;
  onNavigateToMembers: () => void;
  onSelectEvent: (eventId: string) => void;
  onOpenCreateEvent?: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigateToEvents,
  onNavigateToMembers,
  onSelectEvent,
  onOpenCreateEvent,
}) => {
  const { user } = useAuth();
  const { dashboardData: data, isDashboardLoading: isLoading, dashboardError: error, fetchDashboard, isRefreshing } = useData();

  if (isLoading && !data) {
    return <DashboardSkeleton />;
  }

  if (error && !data) {
    return (
      <div className="p-6 text-center max-w-md mx-auto">
        <div className="p-4 bg-slate-100 border border-slate-200 text-slate-800 rounded-xl text-sm mb-3">
          {error || 'Unable to load dashboard data.'}
        </div>
        <button
          onClick={() => fetchDashboard(true)}
          className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold cursor-pointer"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!data) return null;

  const { stats } = data;

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4 pb-20">
      {/* 1. CLASSIC SIMPLIFIED MINIMAL MUTUAL FUND WHITE CARD */}
      <div className="rounded-3xl bg-white text-slate-900 p-5 sm:p-6 shadow-xs border border-slate-200 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 font-bold">
              <Wallet size={16} />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Mazeed Abad Fund
              </span>
            </div>
          </div>

          {user?.role === 'admin' && onOpenCreateEvent && (
            <button
              id="dashboard-new-event-btn"
              onClick={onOpenCreateEvent}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <PlusCircle size={14} />
              <span>+ Event</span>
            </button>
          )}
        </div>

        {/* Main Balance Display */}
        <div>
          <span className="text-xs text-slate-500 font-medium block mb-0.5">Available Balance</span>
          <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            {formatCurrency(stats.availableFund)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Collections from all events roll over into this fund for future events & needs.
          </p>
        </div>

        {/* Minimal 3-Metric Inflow/Outflow Breakdown */}
        <div className="pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-xs">
          <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
            <span className="text-[10px] text-slate-500 block font-medium">Total Inflow</span>
            <span className="font-bold text-emerald-700 text-xs sm:text-sm mt-0.5 block">
              +{formatCurrency(stats.totalCollectedAmount)}
            </span>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
            <span className="text-[10px] text-slate-500 block font-medium">Total Outflow</span>
            <span className="font-bold text-rose-700 text-xs sm:text-sm mt-0.5 block">
              -{formatCurrency(stats.totalExpenses)}
            </span>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
            <span className="text-[10px] text-slate-500 block font-medium">Uncollected</span>
            <span className="font-bold text-amber-800 text-xs sm:text-sm mt-0.5 block">
              {formatCurrency(stats.totalPendingAmount)}
            </span>
          </div>
        </div>
      </div>

      {/* 2. THE 4 RELEVANT SUMMARY CARDS */}
      <div className="grid grid-cols-2 gap-3">
        {/* Card 1: Total Events */}
        <div
          onClick={onNavigateToEvents}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 transition-colors cursor-pointer active:scale-[0.98]"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Events</span>
            <CalendarDays size={16} className="text-slate-500" />
          </div>
          <p className="text-xl font-bold text-slate-900 mt-1.5">{stats.totalEvents}</p>
          <div className="text-[11px] text-slate-600 font-medium flex items-center gap-0.5 mt-1">
            <span>View events</span>
            <ChevronRight size={12} />
          </div>
        </div>

        {/* Card 2: Family Members */}
        <div
          onClick={onNavigateToMembers}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 transition-colors cursor-pointer active:scale-[0.98]"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Family Members</span>
            <Users size={16} className="text-slate-500" />
          </div>
          <p className="text-xl font-bold text-slate-900 mt-1.5">{stats.totalMembers}</p>
          <div className="text-[11px] text-slate-600 font-medium flex items-center gap-0.5 mt-1">
            <span>View members</span>
            <ChevronRight size={12} />
          </div>
        </div>

        {/* Card 3: Total Collected */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Collected</span>
            <ArrowUpRight size={16} className="text-emerald-600" />
          </div>
          <p className="text-base font-bold text-emerald-700 mt-1.5">
            {formatCurrency(stats.totalCollectedAmount)}
          </p>
          <span className="text-[11px] text-slate-400 block mt-1">Received in fund</span>
        </div>

        {/* Card 4: Total Pending */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Pending</span>
            <Clock size={16} className="text-amber-600" />
          </div>
          <p className="text-base font-bold text-amber-700 mt-1.5">
            {formatCurrency(stats.totalPendingAmount)}
          </p>
          <span className="text-[11px] text-slate-400 block mt-1">Remaining dues</span>
        </div>
      </div>
    </div>
  );
};
