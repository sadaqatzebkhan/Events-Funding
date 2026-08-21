import React, { useState, useEffect } from 'react';
import { MemberDetailsResponse, EventMemberPayment } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft,
  User,
  Phone,
  MessageSquare,
  MessageCircle,
  MapPin,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Coins,
  ChevronRight,
  Shield,
  FileText,
  Eye,
} from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import { MemberDetailsSkeleton } from '../components/Skeleton';
import { WhatsAppReminderModal } from '../components/WhatsAppReminderModal';

interface MemberDetailsPageProps {
  memberId: string;
  onBack: () => void;
  onSelectEvent: (eventId: string) => void;
}

export const MemberDetailsPage: React.FC<MemberDetailsPageProps> = ({
  memberId,
  onBack,
  onSelectEvent,
}) => {
  const { user } = useAuth();
  const [data, setData] = useState<MemberDetailsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // WhatsApp Reminder Modal State
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [targetReminderEvent, setTargetReminderEvent] = useState<{ name: string; date?: string; paymentRecord: EventMemberPayment } | null>(null);

  const fetchMemberDetails = async () => {
    try {
      const token = localStorage.getItem('mf_token');
      const res = await fetch(`/api/members/${memberId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error('Failed to load member details');
      }

      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMemberDetails();
  }, [memberId]);

  if (isLoading) {
    return <MemberDetailsSkeleton />;
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center max-w-lg mx-auto">
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-sm mb-4">
          {error || 'Member could not be found.'}
        </div>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-semibold"
        >
          Return to Members
        </button>
      </div>
    );
  }

  const { member, summary, history } = data;

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8">
      {/* Back button */}
      <div>
        <button
          onClick={onBack}
          className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 shadow-2xs transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>Back to Members</span>
        </button>
      </div>

      {/* 18.1 PERSONAL INFORMATION CARD */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-start gap-4 min-w-0 flex-1">
            <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-2xl shrink-0">
              {member.name ? member.name[0].toUpperCase() : <User size={28} />}
            </div>

            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight break-words min-w-0">
                  {member.name}
                </h1>
                <span
                  className={`shrink-0 text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    member.role === 'admin'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : member.role === 'viewer'
                      ? 'bg-purple-50 text-purple-800 border border-purple-200'
                      : 'bg-blue-50 text-blue-800 border border-blue-200'
                  }`}
                >
                  {member.role === 'admin'
                    ? 'Family Admin'
                    : member.role === 'viewer'
                    ? 'View-Only (Observer)'
                    : 'Contributing Member'}
                </span>
                {!member.active && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium border border-slate-200">
                    Inactive
                  </span>
                )}
              </div>

              <p className="text-sm text-slate-600 font-medium">
                Son/Daughter of: <strong className="text-slate-900">{member.fatherName || '-'}</strong>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center gap-2.5">
              <Phone size={15} className="text-slate-400 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Phone</span>
                <span className="font-semibold text-slate-800">{member.phone}</span>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center gap-2.5">
              <MessageSquare size={15} className="text-emerald-500 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">WhatsApp</span>
                <span className="font-semibold text-slate-800">{member.whatsapp || member.phone}</span>
              </div>
            </div>

            {member.address && (
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center gap-2.5 sm:col-span-2">
                <MapPin size={15} className="text-slate-400 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Address</span>
                  <span className="font-semibold text-slate-800">{member.address}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* View-Only / Observer Explanatory Banner */}
      {member.role === 'viewer' && (
        <div className="bg-purple-50/90 border border-purple-200 rounded-2xl p-4 sm:p-5 text-purple-900 flex items-start gap-3.5 shadow-2xs">
          <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 mt-0.5">
            <Eye size={18} />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-sm text-purple-950">View-Only (Observer) Account</h4>
            <p className="text-xs text-purple-800 leading-relaxed">
              This family member has full transparent read-only access to mutual fund balance reports, event archives, and family expenses. As an observer, this member is exempt from event contribution requirements and has zero pending dues.
            </p>
          </div>
        </div>
      )}

      {/* 18.2 PAYMENT SUMMARY CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              {member.role === 'viewer' ? 'Role Type' : 'Total Events'}
            </span>
            <Calendar size={16} className="text-slate-400" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-2">
            {member.role === 'viewer' ? 'Observer' : summary.totalEvents}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {member.role === 'viewer' ? 'Read-only access' : 'Associated Events'}
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700">Paid Events</span>
            <CheckCircle2 size={16} className="text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-700 mt-2">{summary.paidEvents}</p>
          <span className="text-[11px] text-emerald-600/80 mt-1 block">
            {member.role === 'viewer' ? 'Exempt from dues' : 'Full contribution'}
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700">Partial / Unpaid</span>
            <Clock size={16} className="text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-amber-700 mt-2">
            {summary.partialEvents + summary.unpaidEvents}
          </p>
          <span className="text-[11px] text-amber-600/80 mt-1 block">
            {member.role === 'viewer' ? 'No pending events' : `${summary.partialEvents} Partial, ${summary.unpaidEvents} Unpaid`}
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-700">Total Pending Dues</span>
            <AlertCircle size={16} className="text-rose-600" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-rose-700 mt-2">
            {member.role === 'viewer' ? 'Rs 0' : formatCurrency(summary.totalPending)}
          </p>
          <span className="text-[11px] text-rose-600/80 mt-1 block">
            {member.role === 'viewer' ? 'Exempt from dues' : 'Across all events'}
          </span>
        </div>
      </div>

      {/* 18.3 EVENT-WISE PAYMENT HISTORY (TWO-WAY TRANSPARENCY) */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Event-Wise Payment History</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Transparent breakdown of every event contribution required and paid by {member.name}
          </p>
        </div>

        {history.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <FileText size={28} className="mx-auto text-slate-400" />
            <p className="text-xs font-bold text-slate-800">
              {member.role === 'viewer'
                ? 'Observer Account — Exempt from Event Contributions'
                : 'No events associated with this member yet.'}
            </p>
            <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
              {member.role === 'viewer'
                ? 'View-Only members have full read-only access but are excluded from event contribution lists and payment rosters.'
                : 'When new events are created, payment records will automatically appear here.'}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table (Section 18.3) */}
            <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-200/90">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-6">Event</th>
                    <th className="py-3 px-6">Date</th>
                    <th className="py-3 px-6 text-right">Required</th>
                    <th className="py-3 px-6 text-right">Paid</th>
                    <th className="py-3 px-6 text-right">Pending</th>
                    <th className="py-3 px-6 text-center">Status</th>
                    <th className="py-3 px-6 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {history.map((h) => (
                    <tr key={h.paymentRecord.id} className="hover:bg-slate-50/70">
                      <td className="py-4 px-6">
                        <button
                          onClick={() => onSelectEvent(h.event.id)}
                          className="font-bold text-slate-900 hover:text-emerald-700 transition-colors text-left block cursor-pointer"
                        >
                          {h.event.name}
                        </button>
                        {h.transactions.length > 0 && (
                          <span className="text-[11px] text-slate-400">
                            {h.transactions.length} payment transaction(s) recorded
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-slate-500 text-xs font-medium whitespace-nowrap">
                        {formatDate(h.event.date)}
                      </td>
                      <td className="py-4 px-6 text-right font-medium text-slate-800">
                        {formatCurrency(h.paymentRecord.requiredAmount)}
                      </td>
                      <td className="py-4 px-6 text-right font-bold text-emerald-700">
                        {formatCurrency(h.paymentRecord.paidAmount)}
                      </td>
                      <td className="py-4 px-6 text-right font-bold text-rose-700">
                        {formatCurrency(h.paymentRecord.pendingAmount)}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <StatusBadge status={h.paymentRecord.status} size="md" />
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {user?.role === 'admin' && h.paymentRecord.pendingAmount > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                setTargetReminderEvent({
                                  name: h.event.name,
                                  date: h.event.date,
                                  paymentRecord: {
                                    ...h.paymentRecord,
                                    memberName: member.name,
                                    memberFatherName: member.fatherName,
                                    memberPhone: member.phone,
                                    memberWhatsapp: member.whatsapp || member.phone,
                                  },
                                });
                                setIsWhatsAppModalOpen(true);
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                              title="Send WhatsApp Reminder"
                            >
                              <MessageCircle size={13} className="text-emerald-600" />
                              <span>Remind</span>
                            </button>
                          )}
                          <button
                            onClick={() => onSelectEvent(h.event.id)}
                            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors"
                          >
                            <span>Open</span>
                            <ChevronRight size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Stacked Cards (Section 28) */}
            <div className="md:hidden space-y-3">
              {history.map((h) => (
                <div
                  key={h.paymentRecord.id}
                  className="bg-white p-4.5 rounded-2xl border border-slate-200/90 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4
                        onClick={() => onSelectEvent(h.event.id)}
                        className="font-bold text-sm text-slate-900 active:text-emerald-700"
                      >
                        {h.event.name}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">{formatDate(h.event.date)}</p>
                    </div>
                    <StatusBadge status={h.paymentRecord.status} size="sm" />
                  </div>

                  <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl text-center border border-slate-100 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Required</span>
                      <span className="font-bold text-slate-800">
                        {formatCurrency(h.paymentRecord.requiredAmount)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Paid</span>
                      <span className="font-bold text-emerald-700">
                        {formatCurrency(h.paymentRecord.paidAmount)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Pending</span>
                      <span className="font-bold text-rose-700">
                        {formatCurrency(h.paymentRecord.pendingAmount)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    {user?.role === 'admin' && h.paymentRecord.pendingAmount > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setTargetReminderEvent({
                            name: h.event.name,
                            date: h.event.date,
                            paymentRecord: {
                              ...h.paymentRecord,
                              memberName: member.name,
                              memberFatherName: member.fatherName,
                              memberPhone: member.phone,
                              memberWhatsapp: member.whatsapp || member.phone,
                            },
                          });
                          setIsWhatsAppModalOpen(true);
                        }}
                        className="flex-1 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <MessageCircle size={14} className="text-emerald-600" />
                        <span>WhatsApp Reminder</span>
                      </button>
                    )}

                    <button
                      onClick={() => onSelectEvent(h.event.id)}
                      className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <span>View Event</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* WhatsApp Reminder Modal */}
      {targetReminderEvent && (
        <WhatsAppReminderModal
          isOpen={isWhatsAppModalOpen}
          onClose={() => {
            setIsWhatsAppModalOpen(false);
            setTargetReminderEvent(null);
          }}
          eventName={targetReminderEvent.name}
          eventDate={targetReminderEvent.date}
          paymentRecord={targetReminderEvent.paymentRecord}
        />
      )}
    </div>
  );
};
