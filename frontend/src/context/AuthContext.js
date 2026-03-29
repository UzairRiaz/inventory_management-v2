import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch, useSelector } from 'react-redux';
import { clearSession, setLoading, setSession } from '../store/authSlice';

const SESSION_KEY = 'inventory.session';

export function useInitializeAuth() {
  const dispatch = useDispatch();

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(SESSION_KEY);
        if (stored) {
          const session = JSON.parse(stored);
          dispatch(setSession({ token: session.token, user: session.user }));
        }
      } catch (_error) {
        await AsyncStorage.removeItem(SESSION_KEY);
      } finally {
        dispatch(setLoading(false));
      }
    })();
  }, [dispatch]);
}

export function useAuth() {
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);
  const user = useSelector((state) => state.auth.user);
  const loading = useSelector((state) => state.auth.loading);

  return {
    token,
    user,
    loading,
    signIn: async (nextToken, nextUser) => {
      dispatch(setSession({ token: nextToken, user: nextUser }));
      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify({ token: nextToken, user: nextUser }));
    },
    signOut: async () => {
      dispatch(clearSession());
      await AsyncStorage.removeItem(SESSION_KEY);
    },
  };
}
