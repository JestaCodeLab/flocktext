import { adminApi } from '@/api/adminClient';
import type { AdminSession } from '@/types/admin';

export async function adminLogin(email: string, password: string) {
  const { data } = await adminApi.post<AdminSession & { accessToken: string; refreshToken: string }>('/admin/auth/login', {
    email,
    password,
  });
  return data;
}

export async function fetchAdminMe() {
  const { data } = await adminApi.get<AdminSession>('/admin/auth/me');
  return data;
}

export async function updateAdminMe(payload: { name: string; email: string }) {
  const { data } = await adminApi.patch<AdminSession>('/admin/auth/me', payload);
  return data;
}

export async function changeAdminPassword(payload: { currentPassword: string; newPassword: string }) {
  const { data } = await adminApi.post<{ message: string }>('/admin/auth/change-password', payload);
  return data;
}

// For the "stay signed in" button only - unlike the silent background refresh
// in adminClient.ts, this resets the session's absolute expiry, so it must
// only ever be triggered by an explicit admin action.
export async function extendAdminSession(refreshToken: string) {
  const { data } = await adminApi.post<{ accessToken: string; refreshToken: string }>('/admin/auth/extend-session', { refreshToken });
  return data;
}

export async function adminLogout(refreshToken: string | null) {
  const { data } = await adminApi.post<{ message: string }>('/admin/auth/logout', refreshToken ? { refreshToken } : {});
  return data;
}
