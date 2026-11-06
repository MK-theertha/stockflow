import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { apiFetch } from '@/lib/api-client';

// The session lives in an httpOnly cookie set by the API, so the browser asks
// the API who is logged in instead of reading the token itself.
// useSession() returns { data: { user } | null, status, signIn, signOut, refresh }.
const SessionContext = createContext(null);

const toState = (user) =>
  user ? { data: { user }, status: 'authenticated' } : { data: null, status: 'unauthenticated' };

export function SessionProvider({ children }) {
  const [state, setState] = useState({ data: null, status: 'loading' });

  // Re-reads the session, e.g. after the profile changes the user's name.
  const refresh = useCallback(async () => {
    try {
      const { user } = await apiFetch('/api/auth/session');
      setState(toState(user));
    } catch {
      setState(toState(null));
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const signIn = useCallback(async (email, password) => {
    const { user } = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    setState(toState(user));
    return user;
  }, []);

  const signOut = useCallback(async () => {
    await apiFetch('/api/auth/logout', { method: 'POST' });
    setState(toState(null));
  }, []);

  const value = useMemo(
    () => ({ ...state, signIn, signOut, refresh }),
    [state, signIn, signOut, refresh]
  );
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export const useSession = () => useContext(SessionContext);
