import React, { useState, useEffect, useRef } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider, useData } from './context/DataContext';
import { LoginPage } from './pages/LoginPage';
import { NavTab } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { Header } from './components/Header';
import { DashboardPage } from './pages/DashboardPage';
import { EventsPage } from './pages/EventsPage';
import { EventDetailsPage } from './pages/EventDetailsPage';
import { MembersPage } from './pages/MembersPage';
import { MemberDetailsPage } from './pages/MemberDetailsPage';
import { ProfilePage } from './pages/ProfilePage';
import { EventModal } from './components/EventModal';
import { PageLoader } from './components/PageLoader';
import { NewEventNotificationModal } from './components/NewEventNotificationModal';
import { ExitConfirmModal } from './components/ExitConfirmModal';
import { EventItem } from './types';

const MainApp: React.FC = () => {
  const { user, isLoading } = useAuth();
  const { invalidateCache } = useData();
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');

  // Sub-detail view state
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  // Global Create Event Modal
  const [isGlobalCreateEventOpen, setIsGlobalCreateEventOpen] = useState(false);

  // Exit Confirmation Modal
  const [isExitConfirmOpen, setIsExitConfirmOpen] = useState(false);
  const isQuittingRef = useRef(false);

  // New-event notification modal (members/viewers only)
  const [unseenEvents, setUnseenEvents] = useState<EventItem[]>([]);
  const [isDismissingNotification, setIsDismissingNotification] = useState(false);

  // Ref to track latest state inside popstate listener
  const stateRef = useRef({
    activeTab,
    selectedEventId,
    selectedMemberId,
    isGlobalCreateEventOpen,
    isExitConfirmOpen,
  });

  useEffect(() => {
    stateRef.current = {
      activeTab,
      selectedEventId,
      selectedMemberId,
      isGlobalCreateEventOpen,
      isExitConfirmOpen,
    };
  }, [activeTab, selectedEventId, selectedMemberId, isGlobalCreateEventOpen, isExitConfirmOpen]);

  // Back button interception & history trap
  useEffect(() => {
    if (!user) return;

    // Push initial guard barrier so browser back button is intercepted
    window.history.pushState({ guard: 'mf_app' }, '');

    const handlePopState = () => {
      if (isQuittingRef.current) return;

      const current = stateRef.current;

      // 1. If Exit Modal is already open, close it
      if (current.isExitConfirmOpen) {
        setIsExitConfirmOpen(false);
        window.history.pushState({ guard: 'mf_app' }, '');
        return;
      }

      // 2. If Create Event modal is open, close it
      if (current.isGlobalCreateEventOpen) {
        setIsGlobalCreateEventOpen(false);
        window.history.pushState({ guard: 'mf_app' }, '');
        return;
      }

      // 3. If viewing event details, go back to events list
      if (current.selectedEventId) {
        setSelectedEventId(null);
        window.history.pushState({ guard: 'mf_app' }, '');
        return;
      }

      // 4. If viewing member details, go back to members list
      if (current.selectedMemberId) {
        setSelectedMemberId(null);
        window.history.pushState({ guard: 'mf_app' }, '');
        return;
      }

      // 5. If on any main tab (Dashboard, Events, Members, Profile): Always show Exit Confirmation
      setIsExitConfirmOpen(true);
      window.history.pushState({ guard: 'mf_app' }, '');
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [user]);

  const handleConfirmQuit = () => {
    isQuittingRef.current = true;
    setIsExitConfirmOpen(false);
    // Unwind history or close tab/window
    if (window.history.length > 1) {
      window.history.go(-2);
    } else {
      window.close();
    }
  };

  useEffect(() => {
    if (!user || user.role === 'admin') return;

    let cancelled = false;
    (async () => {
      try {
        const token = localStorage.getItem('mf_token');
        const res = await fetch('/api/events/notifications/unseen', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && Array.isArray(data.events) && data.events.length > 0) {
          setUnseenEvents(data.events);
        }
      } catch {
        // Silently ignore
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const handleDismissNotification = async () => {
    setIsDismissingNotification(true);
    try {
      const token = localStorage.getItem('mf_token');
      await fetch('/api/events/notifications/seen', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      // ignore
    } finally {
      setUnseenEvents([]);
      setIsDismissingNotification(false);
    }
  };

  if (isLoading) {
    return <PageLoader />;
  }

  if (!user) {
    return <LoginPage />;
  }

  const handleSelectEvent = (eventId: string) => {
    setSelectedEventId(eventId);
    setActiveTab('events');
  };

  const handleSelectMember = (memberId: string) => {
    setSelectedMemberId(memberId);
    setActiveTab('members');
  };

  const getPageTitle = () => {
    if (activeTab === 'dashboard') return 'Mazeed Abad Fund';
    if (activeTab === 'events') {
      return selectedEventId ? 'Event Details' : 'Events';
    }
    if (activeTab === 'members') {
      return selectedMemberId ? 'Member Profile' : 'Members';
    }
    if (activeTab === 'profile') return 'My Profile';
    return 'Mazeed Abad Fund';
  };

  const handleTabChange = (tab: NavTab) => {
    setActiveTab(tab);
    if (tab === 'events') setSelectedEventId(null);
    if (tab === 'members') setSelectedMemberId(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased flex flex-col justify-between">
      {/* Top Header */}
      <Header title={getPageTitle()} />

      {/* Main Content Viewport */}
      <main
        className="flex-1 w-full max-w-lg mx-auto min-w-0"
        style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom))' }}
      >
        {activeTab === 'dashboard' && (
          <DashboardPage
            onNavigateToEvents={() => {
              setSelectedEventId(null);
              setActiveTab('events');
            }}
            onNavigateToMembers={() => {
              setSelectedMemberId(null);
              setActiveTab('members');
            }}
            onSelectEvent={handleSelectEvent}
            onOpenCreateEvent={() => setIsGlobalCreateEventOpen(true)}
          />
        )}

        {activeTab === 'events' && (
          selectedEventId ? (
            <EventDetailsPage
              eventId={selectedEventId}
              onBack={() => setSelectedEventId(null)}
              onSelectMember={handleSelectMember}
            />
          ) : (
            <EventsPage onSelectEvent={handleSelectEvent} />
          )
        )}

        {activeTab === 'members' && (
          selectedMemberId ? (
            <MemberDetailsPage
              memberId={selectedMemberId}
              onBack={() => setSelectedMemberId(null)}
              onSelectEvent={handleSelectEvent}
            />
          ) : (
            <MembersPage onSelectMember={handleSelectMember} />
          )
        )}

        {activeTab === 'profile' && <ProfilePage />}
      </main>

      {/* Mobile-first Bottom Navigation Bar */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={handleTabChange}
      />

      {/* Global Create Event Modal */}
      <EventModal
        isOpen={isGlobalCreateEventOpen}
        onClose={() => setIsGlobalCreateEventOpen(false)}
        onSuccess={() => {
          setSelectedEventId(null);
          setActiveTab('events');
          invalidateCache();
        }}
      />

      {/* New Event Notification (members/viewers only) */}
      <NewEventNotificationModal
        events={unseenEvents}
        onDismiss={handleDismissNotification}
        isDismissing={isDismissingNotification}
      />

      {/* Accidental Quit / Back Button Confirmation Dialog */}
      <ExitConfirmModal
        isOpen={isExitConfirmOpen}
        onClose={() => setIsExitConfirmOpen(false)}
        onConfirmQuit={handleConfirmQuit}
      />
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <MainApp />
      </DataProvider>
    </AuthProvider>
  );
}

export default App;
