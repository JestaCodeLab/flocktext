import { adminApi } from '@/api/adminClient';
import type { AdminTemplate } from '@/types/admin';

export async function fetchAdminTemplates() {
  const { data } = await adminApi.get<AdminTemplate[]>('/admin/templates');
  return data;
}

export async function createAdminTemplate(payload: { name: string; body: string }) {
  const { data } = await adminApi.post<AdminTemplate>('/admin/templates', payload);
  return data;
}

export async function updateAdminTemplate({ id, ...payload }: { id: string; name: string; body: string }) {
  const { data } = await adminApi.patch<AdminTemplate>(`/admin/templates/${id}`, payload);
  return data;
}

export async function deleteAdminTemplate(id: string) {
  const { data } = await adminApi.delete<{ deleted: true }>(`/admin/templates/${id}`);
  return data;
}
