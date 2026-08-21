import React from 'react';
import { CalendarPlus, Calendar, Coins, X } from 'lucide-react';
import { EventItem } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';

interface NewEventNotificationModalProps {
  events: EventItem[];
  onDismiss: () => void;
  isDismissing?: boolean;
}

/**
 * Shown once per member (never to admins — they're the ones creating events)
 * when they open the app and there are events they haven't been notified
 * about yet. Purely informational; dismissing marks everything currently
 * shown as seen so it won't reappear.
 */
export const NewEventNotificationModal: React.FC<NewEventNotificationModalProps> = ({
  events,
  onDismiss,
  isDismissing = false,
}) => {
  if (events.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-event-notification-title"
      >
        <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-emerald-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <CalendarPlus size={19} />
            </div>
            <div>
              <h3 id="new-event-notification-title" className="text-base font-bold text-slate-900">
                {events.length === 1 ? 'New Event Added' : `${events.length} New Events Added`}
              </h3>
              <p className="text-xs text-slate-600">Here's what you need to know</p>
            </div>
          </div>
          <button
            onClick={onDismiss}
            disabled={isDismissing}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-white/60 transition-colors shrink-0"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-3 overflow-y-auto">
          {events.map((evt) => (
            <div key={evt.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2.5">
              <h4 className="text-sm font-bold text-slate-900">{evt.name}</h4>
              {evt.description && (
                <p className="text-xs text-slate-600 leading-relaxed">{evt.description}</p>
              )}
              <div className="flex items-center gap-4 pt-1 text-xs text-slate-600">
                <span className="flex items-center gap-1.5">
                  <Calendar size={13} className="text-slate-400 shrink-0" />
                  {formatDate(evt.date)}
                </span>
                <span className="flex items-center gap-1.5 font-semibold text-emerald-700">
                  <Coins size={13} className="text-emerald-600 shrink-0" />
                  {formatCurrency(evt.requiredAmountPerMember)} required
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="p-5 border-t border-slate-100 bg-slate-50/60 shrink-0">
          <button
            type="button"
            onClick={onDismiss}
            disabled={isDismissing}
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-xs disabled:opacity-60 transition-colors cursor-pointer"
          >
            {isDismissing ? 'Please wait...' : 'Got It, Thanks!'}
          </button>
        </div>
      </div>
    </div>
  );
};
