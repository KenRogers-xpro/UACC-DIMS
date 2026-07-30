'use client';

import { useState, useEffect, useCallback, useRef, createContext, useContext } from 'react';
import { useRouter } from 'next/navigation';
import api from './api';
import IdleWarningModal from '@/components/ui/IdleWarningModal';

const AuthContext = createContext({});

// Idle session timeout — 29 minutes of inactivity triggers a 60-second
// warning; 30 minutes total with no response auto-logs-out. The JWT's own
// server-side lifetime (24h, see backend/src/lib/jwt.js) is the real,
// unavoidable security backstop — this is purely a client-side convenience
// timer, which is why "Stay logged in" never needs to call the API.
const IDLE_WARNING_MS = 29 * 60 * 1000;
const IDLE_LOGOUT_MS = 30 * 60 * 1000;
const COUNTDOWN_SECONDS = Math.round((IDLE_LOGOUT_MS - IDLE_WARNING_MS) / 1000);
const ACTIVITY_EVENTS = ['mousemove', 'keydown', 'click', 'touchstart', 'scroll'];
const ACTIVITY_THROTTLE_MS = 3000;
const LAST_ACTIVITY_KEY = 'uacc_dims_last_activity';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showIdleWarning, setShowIdleWarning] = useState(false);
  const [idleSecondsLeft, setIdleSecondsLeft] = useState(COUNTDOWN_SECONDS);
  const router = useRouter();

  const warningTimerRef = useRef(null);
  const logoutTimerRef = useRef(null);
  const countdownIntervalRef = useRef(null);
  const lastThrottleRef = useRef(0);

  const clearIdleTimers = useCallback(() => {
    clearTimeout(warningTimerRef.current);
    clearTimeout(logoutTimerRef.current);
    clearInterval(countdownIntervalRef.current);
  }, []);

  // Auto-logout: clear state and redirect immediately, then fire the
  // logout call in the background without awaiting it. A user who's been
  // idle 30 minutes has very likely let the Render backend spin down too —
  // that request can take 50+ seconds to resolve, and nobody should sit on
  // a stuck "logging out..." screen waiting for it.
  const idleLogout = useCallback(() => {
    clearIdleTimers();
    setShowIdleWarning(false);
    api.clearToken();
    setUser(null);
    router.push('/login');
    api.post('/auth/logout').catch(() => {});
  }, [clearIdleTimers, router]);

  const scheduleIdleTimers = useCallback(() => {
    clearIdleTimers();
    warningTimerRef.current = setTimeout(() => {
      setIdleSecondsLeft(COUNTDOWN_SECONDS);
      setShowIdleWarning(true);
      countdownIntervalRef.current = setInterval(() => {
        setIdleSecondsLeft((s) => (s <= 1 ? 0 : s - 1));
      }, 1000);
    }, IDLE_WARNING_MS);
    logoutTimerRef.current = setTimeout(idleLogout, IDLE_LOGOUT_MS);
  }, [clearIdleTimers, idleLogout]);

  // broadcast=true also writes to localStorage so other tabs see this
  // activity via the 'storage' event and defer their own idle clocks.
  const resetIdleTimer = useCallback((broadcast) => {
    setShowIdleWarning(false);
    scheduleIdleTimers();
    if (broadcast && typeof window !== 'undefined') {
      localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
    }
  }, [scheduleIdleTimers]);

  const stayLoggedIn = useCallback(() => {
    resetIdleTimer(true);
  }, [resetIdleTimer]);

  // Activity listeners — only while authenticated, throttled so a raw
  // mousemove stream doesn't spam timer resets / localStorage writes.
  useEffect(() => {
    if (!user) {
      clearIdleTimers();
      return;
    }

    const handleActivity = () => {
      const now = Date.now();
      if (now - lastThrottleRef.current < ACTIVITY_THROTTLE_MS) return;
      lastThrottleRef.current = now;
      resetIdleTimer(true);
    };

    ACTIVITY_EVENTS.forEach((evt) => window.addEventListener(evt, handleActivity, { passive: true }));
    scheduleIdleTimers();

    return () => {
      ACTIVITY_EVENTS.forEach((evt) => window.removeEventListener(evt, handleActivity));
      clearIdleTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Cross-tab sync: another tab's activity lands here as a 'storage' event
  // (browsers never fire it in the tab that made the write), so this tab's
  // own idle clock defers without needing to re-broadcast.
  useEffect(() => {
    if (!user) return;

    const handleStorage = (e) => {
      if (e.key === LAST_ACTIVITY_KEY && e.newValue) {
        resetIdleTimer(false);
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [user, resetIdleTimer]);

  useEffect(() => {
    async function loadUserFromToken() {
      const token = api.getToken();
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get('/auth/me');
        if (response.success) {
          setUser(response.data);
        } else {
          api.clearToken();
        }
      } catch (error) {
        api.clearToken();
      } finally {
        setLoading(false);
      }
    }

    loadUserFromToken();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      if (response.success && response.data) {
        api.setToken(response.data.token);
        setUser(response.data.user);
        return { success: true };
      }
      return { success: false, error: response.message || 'Login failed' };
    } catch (error) {
      return { success: false, error: 'Login failed. Please try again.' };
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearIdleTimers();
      api.clearToken();
      setUser(null);
      router.push('/login');
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, isAuthenticated: !!user }}>
      {children}
      {user && (
        <IdleWarningModal
          isOpen={showIdleWarning}
          secondsLeft={idleSecondsLeft}
          onStayLoggedIn={stayLoggedIn}
        />
      )}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
