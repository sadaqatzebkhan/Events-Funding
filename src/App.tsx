import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
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
import { EventItem } from './types';

const MainApp: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');

  // Sub-detail view state
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  // Global Create Event Modal
  const [isGlobalCreateEventOpen, setIsGlobalCreateEventOpen] = useState(false);

  // New-event notification modal (members/viewers only — admins create events, not receive these)
  const [unseenEvents, setUnseenEvents] = useState<EventItem[]>([]);
  const [isDismissingNotification, setIsDismissingNotification] = useState(false);

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
        // Silently ignore — a missed notification is not worth disrupting the app for.
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
      // Even if this fails, close the modal locally — it'll just be offered again next visit.
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
    if (activeTab === 'dashboard') return 'Mutual Fund';
    if (activeTab === 'events') {
      return selectedEventId ? 'Event Details' : 'Events';
    }
    if (activeTab === 'members') {
      return selectedMemberId ? 'Member Profile' : 'Members';
    }
    if (activeTab === 'profile') return 'My Profile';
    return 'Mutual Fund';
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

      {/* Main Content Viewport — bottom padding clears the fixed BottomNav, which
          itself grows taller on devices with a gesture/button navigation bar
          (see BottomNav.tsx's safe-area-inset-bottom padding). */}
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
        }}
      />

      {/* New Event Notification (members/viewers only) */}
      <NewEventNotificationModal
        events={unseenEvents}
        onDismiss={handleDismissNotification}
        isDismissing={isDismissingNotification}
      />
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

export default App;
