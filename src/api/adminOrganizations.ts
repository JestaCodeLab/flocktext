import { adminApi } from '@/api/adminClient';
import type { AdminOrgDetail, AdminOrgListItem, AdminOrgUser } from '@/types/admin';

export interface AdminOrgListResponse {
  organizations: AdminOrgListItem[];
  total: number;
  page: number;
  limit: number;
}

export async function fetchAdminOrganizations(params?: { search?: string; status?: string; page?: number }) {
  const { data } = await adminApi.get<AdminOrgListResponse>('/admin/organizations', { params });
  return data;
}

export async function fetchAdminOrganizationDetail(id: string) {
  const { data } = await adminApi.get<AdminOrgDetail>(`/admin/organizations/${id}`);
  return data;
}

export async function updateAdminOrganizationProfile(
  id: string,
  payload: { churchName: string; address?: string; contactEmail?: string }
) {
  const { data } = await adminApi.patch(`/admin/organizations/${id}`, payload);
  return data;
}

export async function suspendOrganization(id: string) {
  const { data } = await adminApi.post<{ status: 'active' | 'suspended' }>(`/admin/organizations/${id}/suspend`);
  return data;
}

export async function reactivateOrganization(id: string) {
  const { data } = await adminApi.post<{ status: 'active' | 'suspended' }>(`/admin/organizations/${id}/reactivate`);
  return data;
}

export async function adjustOrganizationWallet(id: string, payload: { credits: number; reason: string }) {
  const { data } = await adminApi.post<{ walletBalanceCredits: number }>(
    `/admin/organizations/${id}/wallet/adjust`,
    payload
  );
  return data;
}

export async function addOrganizationUser(
  id: string,
  payload: { name: string; email: string; phone: string; role: 'admin' | 'user' }
) {
  const { data } = await adminApi.post<AdminOrgUser>(`/admin/organizations/${id}/users`, payload);
  return data;
}

export async function deleteOrganization(id: string, confirmChurchName: string) {
  const { data } = await adminApi.delete<{ deleted: true }>(`/admin/organizations/${id}`, {
    data: { confirmChurchName },
  });
  return data;
}
