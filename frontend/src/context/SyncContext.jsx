import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

const SyncContext = createContext();

// Helper to get refresh settings from localStorage
const getRefreshSettings = () => {
  try {
    const stored = localStorage.getItem('reliefroute_settings');
    if (stored) {
      const settings = JSON.parse(stored);
      return {
        dashboardRefresh: settings.dashboardRefresh ?? 45,
        mapRefresh: settings.mapRefresh ?? 30,
        notificationRefresh: settings.notificationRefresh ?? 15,
      };
    }
  } catch {
    // Ignore parse errors
  }
  return { dashboardRefresh: 45, mapRefresh: 30, notificationRefresh: 15 };
};

export function SyncProvider({ children }) {
  // Separate timestamps for each refresh type
  const [dashboardTimestamp, setDashboardTimestamp] = useState(Date.now());
  const [mapTimestamp, setMapTimestamp] = useState(Date.now());
  const [notificationTimestamp, setNotificationTimestamp] = useState(Date.now());
  
  const [lastDecision, setLastDecision] = useState(null);
  const [highlightedRoute, setHighlightedRoute] = useState(null);
  const [refreshSettings, setRefreshSettings] = useState(getRefreshSettings);
  
  // Refs for intervals
  const dashboardIntervalRef = useRef(null);
  const mapIntervalRef = useRef(null);
  const notificationIntervalRef = useRef(null);

  // Manual triggers for each type
  const refreshDashboard = useCallback(() => setDashboardTimestamp(Date.now()), []);
  const refreshMap = useCallback(() => setMapTimestamp(Date.now()), []);
  const refreshNotifications = useCallback(() => setNotificationTimestamp(Date.now()), []);
  
  // Refresh all at once
  const refreshAll = useCallback(() => {
    const now = Date.now();
    setDashboardTimestamp(now);
    setMapTimestamp(now);
    setNotificationTimestamp(now);
  }, []);

  // Legacy: keep 'timestamp' and 'refresh' for backwards compatibility (uses map timestamp)
  const timestamp = mapTimestamp;
  const refresh = refreshMap;

  // Update last decision and extract route coordinates
  const updateLastDecision = useCallback((decision) => {
    setLastDecision(decision);
    // Extract primary route coordinates if available
    if (decision?.primary_route_coordinates) {
      setHighlightedRoute(decision.primary_route_coordinates);
    } else if (decision?.selected_routes?.[0]?.path_coordinates) {
      setHighlightedRoute(decision.selected_routes[0].path_coordinates);
    } else {
      setHighlightedRoute(null);
    }
  }, []);

  const clearHighlightedRoute = useCallback(() => {
    setHighlightedRoute(null);
  }, []);

  // Listen for settings changes in localStorage (only update if values actually changed)
  useEffect(() => {
    const handleStorageChange = () => {
      const newSettings = getRefreshSettings();
      setRefreshSettings(prev => {
        // Only update if values actually changed
        if (prev.dashboardRefresh !== newSettings.dashboardRefresh ||
            prev.mapRefresh !== newSettings.mapRefresh ||
            prev.notificationRefresh !== newSettings.notificationRefresh) {
          console.log('[SyncContext] Settings changed:', newSettings);
          return newSettings;
        }
        return prev;
      });
    };
    
    // Listen for storage events (from other tabs)
    window.addEventListener('storage', handleStorageChange);
    
    // Also poll for changes in same tab (localStorage doesn't fire events in same tab)
    const pollId = setInterval(handleStorageChange, 2000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(pollId);
    };
  }, []);

  // Dashboard refresh interval
  useEffect(() => {
    if (dashboardIntervalRef.current) {
      clearInterval(dashboardIntervalRef.current);
      dashboardIntervalRef.current = null;
    }
    
    const intervalMs = refreshSettings.dashboardRefresh * 1000;
    console.log('[SyncContext] Dashboard refresh:', intervalMs === 0 ? 'MANUAL ONLY' : `${intervalMs}ms`);
    
    if (intervalMs <= 0) return;
    
    dashboardIntervalRef.current = setInterval(() => {
      console.log('[SyncContext] Dashboard auto-refresh');
      setDashboardTimestamp(Date.now());
    }, intervalMs);
    
    return () => {
      if (dashboardIntervalRef.current) {
        clearInterval(dashboardIntervalRef.current);
        dashboardIntervalRef.current = null;
      }
    };
  }, [refreshSettings.dashboardRefresh]);

  // Map refresh interval
  useEffect(() => {
    if (mapIntervalRef.current) {
      clearInterval(mapIntervalRef.current);
      mapIntervalRef.current = null;
    }
    
    const intervalMs = refreshSettings.mapRefresh * 1000;
    console.log('[SyncContext] Map refresh:', intervalMs === 0 ? 'MANUAL ONLY' : `${intervalMs}ms`);
    
    if (intervalMs <= 0) return;
    
    mapIntervalRef.current = setInterval(() => {
      console.log('[SyncContext] Map auto-refresh');
      setMapTimestamp(Date.now());
    }, intervalMs);
    
    return () => {
      if (mapIntervalRef.current) {
        clearInterval(mapIntervalRef.current);
        mapIntervalRef.current = null;
      }
    };
  }, [refreshSettings.mapRefresh]);

  // Notification refresh interval
  useEffect(() => {
    if (notificationIntervalRef.current) {
      clearInterval(notificationIntervalRef.current);
      notificationIntervalRef.current = null;
    }
    
    const intervalMs = refreshSettings.notificationRefresh * 1000;
    console.log('[SyncContext] Notification refresh:', intervalMs === 0 ? 'MANUAL ONLY' : `${intervalMs}ms`);
    
    if (intervalMs <= 0) return;
    
    notificationIntervalRef.current = setInterval(() => {
      console.log('[SyncContext] Notification auto-refresh');
      setNotificationTimestamp(Date.now());
    }, intervalMs);
    
    return () => {
      if (notificationIntervalRef.current) {
        clearInterval(notificationIntervalRef.current);
        notificationIntervalRef.current = null;
      }
    };
  }, [refreshSettings.notificationRefresh]);

  return (
    <SyncContext.Provider value={{ 
      // Separate timestamps
      dashboardTimestamp,
      mapTimestamp,
      notificationTimestamp,
      // Separate refresh functions
      refreshDashboard,
      refreshMap,
      refreshNotifications,
      refreshAll,
      // Legacy (backwards compatible)
      timestamp,
      refresh,
      // Other state
      lastDecision, 
      highlightedRoute,
      updateLastDecision,
      clearHighlightedRoute,
      refreshSettings
    }}>
      {children}
    </SyncContext.Provider>
  );
}

export function useSync() {
  return useContext(SyncContext);
}
