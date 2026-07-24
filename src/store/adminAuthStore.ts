import { create } from 'zustand';
import type { AdminSession, AdminSessionAdmin } from '@/types/admin';

interface AdminAuthState {
  session: AdminSession | null;
  accessToken: string | null;
  refreshToken: string | null;
  setSession: (session: AdminSession, accessToken: string, refreshToken: string) => void;
  setAccessToken: (accessToken: string) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  updateAdmin: (patch: Partial<AdminSessionAdmin>) => void;
  clear: () => void;
}

const STORAGE_KEY = 'flocktext.admin.auth';

function loadPersisted(): Pick<AdminAuthState, 'session' | 'accessToken' | 'refreshToken'> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { session: null, accessToken: null, refreshToken: null };
    return JSON.parse(raw);
  } catch {
    return { session: null, accessToken: null, refreshToken: null };
  }
}

function persist(state: Pick<AdminAuthState, 'session' | 'accessToken' | 'refreshToken'>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export const useAdminAuthStore = create<AdminAuthState>((set, get) => ({
  ...loadPersisted(),

  setSession: (session, accessToken, refreshToken) => {
    const next = { session, accessToken, refreshToken };
    persist(next);
    set(next);
  },

  setAccessToken: (accessToken) => {
    const next = { session: get().session, accessToken, refreshToken: get().refreshToken };
    persist(next);
    set({ accessToken });
  },

  setTokens: (accessToken, refreshToken) => {
    const next = { session: get().session, accessToken, refreshToken };
    persist(next);
    set({ accessToken, refreshToken });
  },

  updateAdmin: (patch) => {
    const session = get().session;
    if (!session) return;
    const nextSession = { ...session, admin: { ...session.admin, ...patch } };
    const next = { session: nextSession, accessToken: get().accessToken, refreshToken: get().refreshToken };
    persist(next);
    set({ session: nextSession });
  },

  clear: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({ session: null, accessToken: null, refreshToken: null });
  },
}));
