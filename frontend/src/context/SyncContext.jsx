import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const SyncContext = createContext();

export function SyncProvider({ children, intervalMs = 45000 }) {
  const [timestamp, setTimestamp] = useState(Date.now());

  // Manual trigger to force refresh now
  const refresh = useCallback(() => setTimestamp(Date.now()), []);

  useEffect(() => {
    const id = setInterval(() => setTimestamp(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return (
    <SyncContext.Provider value={{ timestamp, refresh }}>
      {children}
    </SyncContext.Provider>
  );
}

export function useSync() {
  return useContext(SyncContext);
}
