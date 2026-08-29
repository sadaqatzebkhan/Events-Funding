import React, { useState } from 'react';
import { EventItem } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import {
  CalendarDays,
  PlusCircle,
  Eye,
  Edit2,
  Trash2,
  Search,
} from 'lucide-react';
import { EventModal } from '../components/EventModal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EventsSkeleton } from '../components/Skeleton';

interface EventsPageProps {
  onSelectEvent: (eventId: string) => void;
}

export const EventsPage: React.FC<EventsPageProps> = ({ onSelectEvent }) => {
  const { user } = useAuth();
  const { eventsList: events, isEventsLoading: isLoading, eventsError: error, fetchEvents, invalidateCache } = useData();
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<EventItem | null>(null);
  const [eventToDelete, setEventToDelete] = useState<EventItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteEvent = async () => {
    if (!eventToDelete) return;
    setIsDeleting(true);

    try {
      const token = localStorage.getItem('mf_token');
      const res = await fetch(`/api/events/${eventToDelete.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete event');
      }

      setEventToDelete(null);
      invalidateCache();
    } catch (err: any) {
      alert(err.message || 'Error deleting event');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredEvents = events.filter((e) =>
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (e.description && e.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-4 space-y-4">
      {/* Top Bar with Search and Add button */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search size={15} />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search events..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-slate-900 outline-none placeholder-slate-400 bg-white"
          />
        </div>

        {user?.role === 'admin' && (
          <button
            id="create-new-event-btn"
            onClick={() => {
              setEventToEdit(null);
              setIsEventModalOpen(true);
            }}
            className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
          >
            <PlusCircle size={15} />
            <span>New</span>
          </button>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <EventsSkeleton />
      ) : error ? (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs">
          {error}
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-2">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
            <CalendarDays size={20} />
          </div>
          <h3 className="text-sm font-bold text-slate-800">
            {searchTerm ? 'No matching events' : 'No events added yet'}
          </h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            {user?.role === 'admin'
              ? 'Tap "New" above to create an event and track expenses.'
              : 'Events will appear here once created by the admin.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredEvents.map((evt) => (
            <div
              key={evt.id}
              className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <button
                    onClick={() => onSelectEvent(evt.id)}
                    className="text-left font-bold text-sm text-slate-900 hover:text-slate-700 block truncate cursor-pointer"
                  >
                    {evt.name}
                  </button>
                  <p className="text-[11px] text-slate-500 mt-0.5">{formatDate(evt.date)}</p>
                </div>
                <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg shrink-0">
                  Exp: {formatCurrency(evt.totalExpense)}
                </span>
              </div>

              {evt.description && (
                <p className="text-xs text-slate-600 line-clamp-2">{evt.description}</p>
              )}

              <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl text-xs border border-slate-100 text-center">
                <div>
                  <span className="text-slate-400 block text-[10px] font-medium">Collected</span>
                  <span className="font-bold text-emerald-700 text-xs mt-0.5 block">
                    {formatCurrency(evt.totalPaid || 0)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-medium">Expense</span>
                  <span className="font-bold text-slate-800 text-xs mt-0.5 block">
                    {formatCurrency(evt.totalExpense || 0)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-medium">Fund Pool</span>
                  <span className={`font-bold text-xs mt-0.5 block ${(evt.totalPaid || 0) - (evt.totalExpense || 0) >= 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {(evt.totalPaid || 0) - (evt.totalExpense || 0) >= 0 ? '+' : ''}
                    {formatCurrency((evt.totalPaid || 0) - (evt.totalExpense || 0))}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                <button
                  onClick={() => onSelectEvent(evt.id)}
                  className="flex-1 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Eye size={14} />
                  <span>View Details</span>
                </button>

                {user?.role === 'admin' && (
                  <div className="flex items-center gap-1 ml-2">
                    <button
                      onClick={() => {
                        setEventToEdit(evt);
                        setIsEventModalOpen(true);
                      }}
                      className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
                      title="Edit"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      onClick={() => setEventToDelete(evt)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Event Modal */}
      <EventModal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        eventToEdit={eventToEdit}
        onSuccess={invalidateCache}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!eventToDelete}
        onClose={() => setEventToDelete(null)}
        onConfirm={handleDeleteEvent}
        isLoading={isDeleting}
        title="Delete Event?"
        message={`Are you sure you want to delete "${eventToDelete?.name}"? All expenses and payment records for this event will be removed.`}
        confirmText="Delete Event"
      />
    </div>
  );
};
