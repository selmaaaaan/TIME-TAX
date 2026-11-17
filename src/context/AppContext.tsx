import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Profile, Area, InstitutionSettings, UserRole } from '../types';
import type { Language } from '../utils/i18n';

interface DemoAccountSummary {
  id: string;
  display_name: string;
  email: string;
  role: UserRole;
  department?: string;
}

interface AppContextValue {
  user: Profile | null;
  token: string | null;
  settings: InstitutionSettings | null;
  availableDemoAccounts: DemoAccountSummary[];
  areas: Area[];
  loadingAuth: boolean;
  lang: Language;
  setLang: (l: Language) => void;
  surfaceTheme: 'obsidian' | 'ivory';
  setSurfaceTheme: (t: 'obsidian' | 'ivory') => void;
  currentPath: string;
  navigate: (to: string) => void;
  loginWithAccount: (payload: { email?: string; userId?: string }) => Promise<Profile>;
  logout: () => void;
  refreshAreas: (includeArchived?: boolean) => Promise<void>;
  refreshAuthAndSettings: () => Promise<void>;
  authFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

const AppContext = createContext<AppContextValue | null>(null);

const TOKEN_STORAGE_KEY = 'timetax_auth_token_v1';
const LANG_STORAGE_KEY = 'timetax_lang_v1';

export function getRoleHomeRoute(role?: UserRole | null): string {
  switch (role) {
    case 'super_admin':
      return '/admin/areas';
    case 'management':
      return '/management';
    case 'mentor':
      return '/mentor';
    case 'student':
      return '/student';
    default:
      return '/';
  }
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem(TOKEN_STORAGE_KEY);
    } catch {
      return null;
    }
  });
  const [user, setUser] = useState<Profile | null>(null);
  const [settings, setSettings] = useState<InstitutionSettings | null>(null);
  const [availableDemoAccounts, setAvailableDemoAccounts] = useState<DemoAccountSummary[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [loadingAuth, setLoadingAuth] = useState<boolean>(true);
  const [lang, setLangState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(LANG_STORAGE_KEY);
      return saved === 'ml' ? 'ml' : 'en';
    } catch {
      return 'en';
    }
  });
  const [surfaceTheme, setSurfaceTheme] = useState<'obsidian' | 'ivory'>('obsidian');
  const [currentPath, setCurrentPath] = useState<string>(() => window.location.pathname || '/');

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = useCallback((to: string) => {
    if (to !== window.location.pathname) {
      window.history.pushState({}, '', to);
    }
    setCurrentPath(to);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const mainEl = document.getElementById('app-main-scroll');
    if (mainEl) {
      mainEl.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  const setLang = useCallback((l: Language) => {
    setLangState(l);
    try {
      localStorage.setItem(LANG_STORAGE_KEY, l);
    } catch {
      // ignore storage errors
    }
  }, []);

  const authFetch = useCallback(
    async (url: string, options: RequestInit = {}) => {
      const headers = new Headers(options.headers || {});
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      if (options.body && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }
      return fetch(url, {
        ...options,
        headers,
      });
    },
    [token]
  );

  const refreshAreas = useCallback(async (includeArchived = false) => {
    try {
      const res = await fetch(`/api/areas?includeArchived=${includeArchived ? 'true' : 'false'}`);
      if (res.ok) {
        const data = await res.json();
        setAreas(data.areas || []);
      }
    } catch (err) {
      console.error('Failed to load areas:', err);
    }
  }, []);

  const refreshAuthAndSettings = useCallback(async () => {
    setLoadingAuth(true);
    try {
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch('/api/auth/me', { headers });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user || null);
        setSettings(data.settings || null);
        setAvailableDemoAccounts(data.availableDemoAccounts || []);
      }
    } catch (err) {
      console.error('Failed to verify session:', err);
    } finally {
      setLoadingAuth(false);
    }
  }, [token]);

  useEffect(() => {
    refreshAuthAndSettings();
    refreshAreas(true);
  }, [refreshAuthAndSettings, refreshAreas]);

  const loginWithAccount = useCallback(
    async (payload: { email?: string; userId?: string }): Promise<Profile> => {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }
      setToken(data.token);
      setUser(data.user);
      try {
        localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
      } catch {
        // ignore
      }
      return data.user;
    },
    []
  );

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    try {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    } catch {
      // ignore
    }
    navigate('/');
  }, [navigate]);

  return (
    <AppContext.Provider
      value={{
        user,
        token,
        settings,
        availableDemoAccounts,
        areas,
        loadingAuth,
        lang,
        setLang,
        surfaceTheme,
        setSurfaceTheme,
        currentPath,
        navigate,
        loginWithAccount,
        logout,
        refreshAreas,
        refreshAuthAndSettings,
        authFetch,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp must be used inside AppProvider');
  }
  return ctx;
}
