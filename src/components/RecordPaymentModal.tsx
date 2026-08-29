import React, { useState, useEffect } from 'react';
import { EventMemberPayment } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { X, CheckCircle2, AlertCircle, Coins } from 'lucide-react';
import { StatusBadge } from './StatusBadge';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventName: string;
  paymentRecord: EventMemberPayment | null;
  onPaymentSuccess: () => void;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  isOpen,
  onClose,
  eventName,
  paymentRecord,
  onPaymentSuccess,
}) => {
  const [amount, setAmount] = useState<string>('0');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && paymentRecord) {
      setAmount(paymentRecord.pendingAmount.toString());
      setDate(new Date().toISOString().split('T')[0]);
      setNote('');
      setError(null);
    }
  }, [isOpen, paymentRecord]);

  if (!isOpen || !paymentRecord) return null;

  const numAmount = Number(amount) || 0;
  const isInvalid = numAmount <= 0;

  const totalAfterPayment = paymentRecord.paidAmount + (numAmount > 0 ? numAmount : 0);
  const projectedPending = Math.max(0, paymentRecord.requiredAmount - totalAfterPayment);
  const extraContribution = Math.max(0, totalAfterPayment - paymentRecord.requiredAmount);
  const projectedStatus =
    totalAfterPayment >= paymentRecord.requiredAmount && paymentRecord.requiredAmount > 0
      ? 'paid'
      : totalAfterPayment > 0
      ? 'partial'
      : 'unpaid';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isInvalid) {
      setError('Payment amount must be greater than zero.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('mf_token');
      const res = await fetch(`/api/events/${paymentRecord.eventId}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          memberId: paymentRecord.memberId,
          amount: numAmount,
          date,
          note,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to record payment');
      }

      onPaymentSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred while recording payment.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Coins size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Record Member Payment</h3>
              <p className="text-xs text-slate-500">{eventName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2.5">
              <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Member & Event Snapshot */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 space-y-3">
            <div className="flex justify-between items-start gap-2">
              <div className="min-w-0 flex-1">
                <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                  Family Member
                </span>
                <h4 className="text-sm font-bold text-slate-900 break-words">{paymentRecord.memberName}</h4>
                <p className="text-xs text-slate-500 break-words">S/O {paymentRecord.memberFatherName || '-'}</p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block mb-1">
                  Current Status
                </span>
                <StatusBadge status={paymentRecord.status} size="sm" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/60 text-center">
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <p className="text-[11px] text-slate-500 font-medium">Required</p>
                <p className="text-xs font-bold text-slate-900">
                  {formatCurrency(paymentRecord.requiredAmount)}
                </p>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <p className="text-[11px] text-slate-500 font-medium">Already Paid</p>
                <p className="text-xs font-bold text-emerald-700">
                  {formatCurrency(paymentRecord.paidAmount)}
                </p>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <p className="text-[11px] text-slate-500 font-medium">Remaining Due</p>
                <p className="text-xs font-bold text-rose-700">
                  {formatCurrency(paymentRecord.pendingAmount)}
                </p>
              </div>
            </div>
          </div>

          {/* Payment Form Fields */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-800">
                  New Payment Amount (Rs.) <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setAmount(paymentRecord.pendingAmount.toString())}
                  className="text-[11px] text-emerald-700 hover:text-emerald-800 font-semibold underline"
                >
                  Pay Full Pending ({formatCurrency(paymentRecord.pendingAmount)})
                </button>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                  Rs.
                </span>
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 2000"
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  required
                />
              </div>

              {/* Quick Amount Suggestion Chips */}
              <div className="flex items-center gap-1.5 flex-wrap mt-2">
                {paymentRecord.pendingAmount > 0 && (
                  <button
                    type="button"
                    onClick={() => setAmount(paymentRecord.pendingAmount.toString())}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-colors"
                  >
                    Due: {formatCurrency(paymentRecord.pendingAmount)}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setAmount((paymentRecord.pendingAmount + 1000).toString())}
                  className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-semibold transition-colors"
                >
                  + Rs. 1,000 Extra
                </button>
                <button
                  type="button"
                  onClick={() => setAmount((paymentRecord.pendingAmount + 2000).toString())}
                  className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-semibold transition-colors"
                >
                  + Rs. 2,000 Extra
                </button>
                <button
                  type="button"
                  onClick={() => setAmount((paymentRecord.pendingAmount + 5000).toString())}
                  className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-semibold transition-colors"
                >
                  + Rs. 5,000 Extra
                </button>
                <button
                  type="button"
                  onClick={() => setAmount((paymentRecord.pendingAmount + 10000).toString())}
                  className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-semibold transition-colors"
                >
                  + Rs. 10,000 Extra
                </button>
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1">
                <span>✨ <strong>No Upper Limit:</strong> Members can contribute any amount. Any extra amount above the requirement is directly added to the Mutual Fund.</span>
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                Payment Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                Optional Payment Note / Reference
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Received via JazzCash / Cash in hand"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
            </div>

            {/* Live Result Preview */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 font-medium">Total Paid for Event:</span>
                <span className="font-bold text-slate-900">{formatCurrency(totalAfterPayment)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 font-medium">Pending Requirement:</span>
                <span className={`font-bold ${projectedPending > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                  {projectedPending > 0 ? formatCurrency(projectedPending) : 'Cleared'}
                </span>
              </div>
              {extraContribution > 0 && (
                <div className="flex items-center justify-between text-emerald-800 pt-1 border-t border-slate-200 font-medium">
                  <span>Extra Fund Contribution:</span>
                  <span className="font-bold">+{formatCurrency(extraContribution)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || isInvalid}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
            >
              {isLoading ? (
                <span>Recording...</span>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>Confirm & Save Payment</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
