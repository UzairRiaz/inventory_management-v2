import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const SESSION_KEY = 'inventory.session';

const AuthContext = createContext({
  token: null,
  user: null,
  loading: true,
  signIn: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(SESSION_KEY);
      if (stored) {
        const session = JSON.parse(stored);
        setToken(session.token || null);
        setUser(session.user || null);
      }
    } catch (_error) {
      window.localStorage.removeItem(SESSION_KEY);
    } finally {
      setLoading(false);
    }
  }, []);

  const signIn = useCallback(async (nextToken, nextUser) => {
    setToken(nextToken);
    setUser(nextUser);
    window.localStorage.setItem(SESSION_KEY, JSON.stringify({ token: nextToken, user: nextUser }));
  }, []);

  const signOut = useCallback(async () => {
    setToken(null);
    setUser(null);
    window.localStorage.removeItem(SESSION_KEY);
  }, []);

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      signIn,
      signOut,
    }),
    [token, user, loading, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
