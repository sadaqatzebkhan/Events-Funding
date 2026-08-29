import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { DashboardData, EventItem, User, EventDetailsResponse } from '../types';

interface DataContextType {
  // Data
  dashboardData: DashboardData | null;
  eventsList: EventItem[];
  membersList: User[];
  
  // Loading states (only true during initial cold fetch if no cache exists)
  isDashboardLoading: boolean;
  isEventsLoading: boolean;
  isMembersLoading: boolean;
  
  // Errors
  dashboardError: string | null;
  eventsError: string | null;
  membersError: string | null;

  // Background refreshing indicator
  isRefreshing: boolean;

  // Actions
  fetchDashboard: (force?: boolean) => Promise<DashboardData | null>;
  fetchEvents: (force?: boolean) => Promise<EventItem[]>;
  fetchMembers: (force?: boolean) => Promise<User[]>;
  refreshAll: () => Promise<void>;
  invalidateCache: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Cache storage keys
const CACHE_KEYS = {
  DASHBOARD: 'mf_cache_dashboard_v1',
  EVENTS: 'mf_cache_events_v1',
  MEMBERS: 'mf_cache_members_v1',
};

function getLocalCache<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function setLocalCache<T>(key: string, data: T): void {
  try {
    sessionStorage.setItem(key, JSON.stringify(data));
  } catch {
    // ignore
  }
}

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize from session cache for instant 0ms rendering
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(() =>
    getLocalCache<DashboardData>(CACHE_KEYS.DASHBOARD)
  );
  const [eventsList, setEventsList] = useState<EventItem[]>(() =>
    getLocalCache<EventItem[]>(CACHE_KEYS.EVENTS) || []
  );
  const [membersList, setMembersList] = useState<User[]>(() =>
    getLocalCache<User[]>(CACHE_KEYS.MEMBERS) || []
  );

  const [isDashboardLoading, setIsDashboardLoading] = useState<boolean>(!dashboardData);
  const [isEventsLoading, setIsEventsLoading] = useState<boolean>(eventsList.length === 0);
  const [isMembersLoading, setIsMembersLoading] = useState<boolean>(membersList.length === 0);

  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [membersError, setMembersError] = useState<string | null>(null);

  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const isFetchingRef = useRef<boolean>(false);

  const fetchDashboard = useCallback(async (force = false): Promise<DashboardData | null> => {
    const token = localStorage.getItem('mf_token');
    if (!token) return null;

    if (!dashboardData && !force) {
      setIsDashboardLoading(true);
    }

    try {
      const res = await fetch('/api/dashboard', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load dashboard data');
      const json: DashboardData = await res.json();
      setDashboardData(json);
      setLocalCache(CACHE_KEYS.DASHBOARD, json);
      setDashboardError(null);
      return json;
    } catch (err: any) {
      setDashboardError(err.message || 'Network error');
      return null;
    } finally {
      setIsDashboardLoading(false);
    }
  }, [dashboardData]);

  const fetchEvents = useCallback(async (force = false): Promise<EventItem[]> => {
    const token = localStorage.getItem('mf_token');
    if (!token) return [];

    if (eventsList.length === 0 && !force) {
      setIsEventsLoading(true);
    }

    try {
      const res = await fetch('/api/events', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load events');
      const json = await res.json();
      const list = json.events || [];
      setEventsList(list);
      setLocalCache(CACHE_KEYS.EVENTS, list);
      setEventsError(null);
      return list;
    } catch (err: any) {
      setEventsError(err.message || 'Network error');
      return [];
    } finally {
      setIsEventsLoading(false);
    }
  }, [eventsList.length]);

  const fetchMembers = useCallback(async (force = false): Promise<User[]> => {
    const token = localStorage.getItem('mf_token');
    if (!token) return [];

    if (membersList.length === 0 && !force) {
      setIsMembersLoading(true);
    }

    try {
      const res = await fetch('/api/members', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load members');
      const json = await res.json();
      const list = json.members || [];
      setMembersList(list);
      setLocalCache(CACHE_KEYS.MEMBERS, list);
      setMembersError(null);
      return list;
    } catch (err: any) {
      setMembersError(err.message || 'Network error');
      return [];
    } finally {
      setIsMembersLoading(false);
    }
  }, [membersList.length]);

  const refreshAll = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setIsRefreshing(true);
    try {
      await Promise.allSettled([
        fetchDashboard(true),
        fetchEvents(true),
        fetchMembers(true),
      ]);
    } finally {
      setIsRefreshing(false);
      isFetchingRef.current = false;
    }
  }, [fetchDashboard, fetchEvents, fetchMembers]);

  const invalidateCache = useCallback(() => {
    sessionStorage.removeItem(CACHE_KEYS.DASHBOARD);
    sessionStorage.removeItem(CACHE_KEYS.EVENTS);
    sessionStorage.removeItem(CACHE_KEYS.MEMBERS);
    // Trigger global event
    window.dispatchEvent(new CustomEvent('mf-data-updated'));
    refreshAll();
  }, [refreshAll]);

  // Initial fetch
  useEffect(() => {
    refreshAll();

    // Listen to data mutations
    const handleDataUpdate = () => {
      refreshAll();
    };
    window.addEventListener('mf-data-updated', handleDataUpdate);

    // Periodic live auto-sync every 8 seconds when window is active
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        refreshAll();
      }
    }, 8000);

    return () => {
      window.removeEventListener('mf-data-updated', handleDataUpdate);
      clearInterval(interval);
    };
  }, [refreshAll]);

  return (
    <DataContext.Provider
      value={{
        dashboardData,
        eventsList,
        membersList,
        isDashboardLoading,
        isEventsLoading,
        isMembersLoading,
        dashboardError,
        eventsError,
        membersError,
        isRefreshing,
        fetchDashboard,
        fetchEvents,
        fetchMembers,
        refreshAll,
        invalidateCache,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
