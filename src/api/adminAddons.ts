import { adminApi } from '@/api/adminClient';
import type { AdminAddon } from '@/types/admin';

export interface AddonUpdatePayload {
  ghs?: number;
  description?: string;
  active?: boolean;
}

export async function fetchAdminAddons() {
  const { data } = await adminApi.get<AdminAddon[]>('/admin/addons');
  return data;
}

export async function updateAddon(id: string, payload: AddonUpdatePayload) {
  const { data } = await adminApi.patch<AdminAddon>(`/admin/addons/${id}`, payload);
  return data;
}
