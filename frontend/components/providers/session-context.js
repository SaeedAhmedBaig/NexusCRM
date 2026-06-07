'use client';

import { createContext, useContext } from 'react';

const SessionContext = createContext(null);

export function SessionProvider({ profile, subdomain, children }) {
  return (
    <SessionContext.Provider value={{ profile, subdomain }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error('useSession must be used within SessionProvider');
  }
  return ctx;
}

export function useSessionOptional() {
  return useContext(SessionContext);
}
