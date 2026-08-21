import React, { useState, useEffect } from 'react';
import { EventDetailsResponse, EventMemberPayment } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft,
  Coins,
  Search,
  Users,
  Edit,
  MessageCircle,
  AlertCircle,
} from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import { RecordPaymentModal } from '../components/RecordPaymentModal';
import { EventModal } from '../components/EventModal';
import { WhatsAppReminderModal } from '../components/WhatsAppReminderModal';
import { EventDetailsSkeleton } from '../components/Skeleton';

interface EventDetailsPageProps {
  eventId: string;
  onBack: () => void;
  onSelectMember: (memberId: string) => void;
}

export const EventDetailsPage: React.FC<EventDetailsPageProps> = ({
  eventId,
  onBack,
  onSelectMember,
}) => {
  const { user } = useAuth();
  const [data, setData] = useState<EventDetailsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [memberSearch, setMemberSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'partial' | 'unpaid'>('all');

  // Modals
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPaymentRecord, setSelectedPaymentRecord] = useState<EventMemberPayment | null>(null);
  const [isEditEventModalOpen, setIsEditEventModalOpen] = useState(false);

  // WhatsApp Reminder Modal
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [whatsAppPaymentRecord, setWhatsAppPaymentRecord] = useState<EventMemberPayment | null>(null);

  const fetchEventDetails = async () => {
    try {
      const token = localStorage.getItem('mf_token');
      const res = await fetch(`/api/events/${eventId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error('Failed to load event details');
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
    fetchEventDetails();
  }, [eventId]);

  const handleOpenPayment = (paymentRecord: EventMemberPayment) => {
    setSelectedPaymentRecord(paymentRecord);
    setIsPaymentModalOpen(true);
  };

  const handleOpenWhatsAppReminder = (paymentRecord: EventMemberPayment) => {
    setWhatsAppPaymentRecord(paymentRecord);
    setIsWhatsAppModalOpen(true);
  };

  if (isLoading) {
    return <EventDetailsSkeleton />;
  }

  if (error || !data) {
    return (
      <div className="p-6 text-center space-y-3">
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs">
          {error || 'Event could not be found.'}
        </div>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold"
        >
          Return to Events
        </button>
      </div>
    );
  }

  const { event, memberPayments } = data;

  const filteredMembers = memberPayments.filter((mp) => {
    const matchesSearch =
      mp.memberName.toLowerCase().includes(memberSearch.toLowerCase()) ||
      (mp.memberFatherName && mp.memberFatherName.toLowerCase().includes(memberSearch.toLowerCase())) ||
      (mp.memberPhone && mp.memberPhone.includes(memberSearch));

    const matchesStatus = statusFilter === 'all' || mp.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const paidMembersCount = memberPayments.filter((m) => m.status === 'paid').length;
  const partialMembersCount = memberPayments.filter((m) => m.status === 'partial').length;
  const unpaidMembersCount = memberPayments.filter((m) => m.status === 'unpaid').length;

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto pb-20">
      {/* Back button & Title */}
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={onBack}
          className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
        >
          <ArrowLeft size={15} />
          <span>Back</span>
        </button>

        {user?.role === 'admin' && (
          <button
            onClick={() => setIsEditEventModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Edit size={13} />
            <span>Edit Event</span>
          </button>
        )}
      </div>

      {/* EVENT OVERVIEW CARD - Clean and Direct */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">{event.name}</h2>
          <p className="text-xs text-slate-500 mt-0.5">{formatDate(event.date)}</p>
          {event.description && (
            <p className="text-xs text-slate-600 leading-relaxed mt-2">{event.description}</p>
          )}
        </div>

        {/* 4 Clean Metric Blocks */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <span className="text-[11px] text-slate-500 block font-medium">Total Collected</span>
            <span className="text-sm font-bold text-emerald-700">
              {formatCurrency(event.totalCollected)}
            </span>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <span className="text-[11px] text-slate-500 block font-medium">Event Expense</span>
            <span className="text-sm font-bold text-slate-900">
              {formatCurrency(event.totalExpense)}
            </span>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <span className="text-[11px] text-slate-500 block font-medium">Base / Person</span>
            <span className="text-sm font-bold text-slate-900">
              {formatCurrency(event.requiredAmountPerMember)}
            </span>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <span className="text-[11px] text-slate-500 block font-medium">Pending Requirement</span>
            <span className="text-sm font-bold text-rose-700">
              {formatCurrency(event.totalPending)}
            </span>
          </div>
        </div>

        {/* Net Mutual Fund Impact Note */}
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">Net Mutual Fund Rollover:</span>
          <span className={`font-bold ${event.totalCollected - event.totalExpense >= 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
            {event.totalCollected - event.totalExpense >= 0 ? '+' : ''}
            {formatCurrency(event.totalCollected - event.totalExpense)}
            <span className="text-[10px] text-slate-500 font-normal ml-1">
              {event.totalCollected - event.totalExpense >= 0 ? '(Added to Pool)' : '(Drawn from Pool)'}
            </span>
          </span>
        </div>
      </div>

      {/* MEMBER PAYMENTS STATUS SECTION */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Users size={16} className="text-slate-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Member Status ({memberPayments.length})
            </h3>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px]">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors shrink-0 ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All ({memberPayments.length})
          </button>
          <button
            onClick={() => setStatusFilter('paid')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors shrink-0 ${
              statusFilter === 'paid'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Paid ({paidMembersCount})
          </button>
          <button
            onClick={() => setStatusFilter('partial')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors shrink-0 ${
              statusFilter === 'partial'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Partial ({partialMembersCount})
          </button>
          <button
            onClick={() => setStatusFilter('unpaid')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors shrink-0 ${
              statusFilter === 'unpaid'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Unpaid ({unpaidMembersCount})
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search size={14} />
          </div>
          <input
            type="text"
            value={memberSearch}
            onChange={(e) => setMemberSearch(e.target.value)}
            placeholder="Search member..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-300 text-slate-900 text-xs outline-none placeholder-slate-400"
          />
        </div>

        {filteredMembers.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">No matching members found.</p>
        ) : (
          <div className="space-y-2.5">
            {filteredMembers.map((rec) => {
              const isFullyPaid = rec.status === 'paid';
              return (
                <div
                  key={rec.id}
                  className="p-3 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <button
                      onClick={() => onSelectMember(rec.memberId)}
                      className="text-left font-bold text-xs text-slate-900 hover:text-slate-700 block min-w-0 flex-1 break-words cursor-pointer"
                    >
                      {rec.memberName}
                      <span className="text-[10px] text-slate-400 font-normal block break-words">
                        S/O {rec.memberFatherName || '-'} • {rec.memberPhone}
                      </span>
                    </button>
                    <div className="shrink-0">
                      <StatusBadge status={rec.status} size="sm" />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-1 bg-slate-50 p-2 rounded-lg text-center text-[11px]">
                    <div>
                      <span className="text-slate-400 block text-[9px]">Req</span>
                      <span className="font-semibold text-slate-800">
                        {formatCurrency(rec.requiredAmount)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px]">Paid</span>
                      <span className="font-semibold text-emerald-700">
                        {formatCurrency(rec.paidAmount)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px]">Pending</span>
                      <span className="font-semibold text-rose-700">
                        {formatCurrency(rec.pendingAmount)}
                      </span>
                    </div>
                  </div>

                  {user?.role === 'admin' && !isFullyPaid && (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleOpenWhatsAppReminder(rec)}
                        className="w-full py-1.5 px-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        title="Send formal reminder via WhatsApp"
                      >
                        <MessageCircle size={13} className="text-emerald-600 shrink-0" />
                        <span>WhatsApp</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenPayment(rec)}
                        className="w-full py-1.5 px-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Coins size={13} className="shrink-0" />
                        <span>Record Pay</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* WhatsApp Reminder Modal */}
      <WhatsAppReminderModal
        isOpen={isWhatsAppModalOpen}
        onClose={() => setIsWhatsAppModalOpen(false)}
        eventName={event.name}
        eventDate={event.date}
        paymentRecord={whatsAppPaymentRecord}
      />

      {/* Record Payment Modal */}
      <RecordPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        eventName={event.name}
        paymentRecord={selectedPaymentRecord}
        onPaymentSuccess={fetchEventDetails}
      />

      {/* Edit Event Modal (Simple direct update of event details and total expense) */}
      <EventModal
        isOpen={isEditEventModalOpen}
        onClose={() => setIsEditEventModalOpen(false)}
        eventToEdit={event}
        onSuccess={fetchEventDetails}
      />
    </div>
  );
};
