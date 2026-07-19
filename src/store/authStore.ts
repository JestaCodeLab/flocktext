import { create } from 'zustand';
import type { Session } from '@/types';

interface AuthState {
  session: Session | null;
  accessToken: string | null;
  refreshToken: string | null;
  setSession: (session: Session, accessToken: string, refreshToken: string) => void;
  setAccessToken: (accessToken: string) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  updateOrganization: (patch: Partial<Session['organization']>) => void;
  updateUser: (patch: Partial<Session['user']>) => void;
  clear: () => void;
}

const STORAGE_KEY = 'flocktext.auth';

function loadPersisted(): Pick<AuthState, 'session' | 'accessToken' | 'refreshToken'> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { session: null, accessToken: null, refreshToken: null };
    return JSON.parse(raw);
  } catch {
    return { session: null, accessToken: null, refreshToken: null };
  }
}

function persist(state: Pick<AuthState, 'session' | 'accessToken' | 'refreshToken'>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export const useAuthStore = create<AuthState>((set, get) => ({
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

  updateOrganization: (patch) => {
    const session = get().session;
    if (!session) return;
    const nextSession = { ...session, organization: { ...session.organization, ...patch } };
    const next = { session: nextSession, accessToken: get().accessToken, refreshToken: get().refreshToken };
    persist(next);
    set({ session: nextSession });
  },

  updateUser: (patch) => {
    const session = get().session;
    if (!session) return;
    const nextSession = { ...session, user: { ...session.user, ...patch } };
    const next = { session: nextSession, accessToken: get().accessToken, refreshToken: get().refreshToken };
    persist(next);
    set({ session: nextSession });
  },

  clear: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({ session: null, accessToken: null, refreshToken: null });
  },
}));
