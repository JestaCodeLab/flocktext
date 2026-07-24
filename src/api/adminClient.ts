import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { useAdminAuthStore } from '@/store/adminAuthStore';

export const adminApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

adminApi.interceptors.request.use((config) => {
  const { accessToken } = useAdminAuthStore.getState();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const { refreshToken, setTokens, clear } = useAdminAuthStore.getState();
  if (!refreshToken) throw new Error('No refresh token.');

  try {
    const { data } = await axios.post(`${adminApi.defaults.baseURL}/admin/auth/refresh`, { refreshToken });
    // The refresh token is rotated server-side on every use (old one is
    // invalidated), so the new one must be persisted too, not just the access token.
    setTokens(data.accessToken, data.refreshToken);
    return data.accessToken;
  } catch (err) {
    clear();
    throw err;
  }
}

adminApi.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    const isAuthRoute = original?.url?.includes('/admin/auth/login') || original?.url?.includes('/admin/auth/refresh');

    if (error.response?.status === 401 && original && !original._retry && !isAuthRoute) {
      original._retry = true;
      try {
        refreshPromise ??= refreshAccessToken();
        const token = await refreshPromise;
        refreshPromise = null;
        original.headers.Authorization = `Bearer ${token}`;
        return adminApi(original);
      } catch (refreshError) {
        refreshPromise = null;
        window.location.href = '/admin/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
