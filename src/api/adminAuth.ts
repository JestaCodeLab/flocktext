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
