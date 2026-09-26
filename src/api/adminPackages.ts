import { adminApi } from '@/api/adminClient';
import type { AdminPackage } from '@/types/admin';

export interface PackagePayload {
  ghs: number;
  credits: number;
  label: string;
  badge?: string;
  active?: boolean;
  sortOrder?: number;
}

export async function fetchAdminPackages() {
  const { data } = await adminApi.get<AdminPackage[]>('/admin/packages');
  return data;
}

export async function createPackage(payload: PackagePayload) {
  const { data } = await adminApi.post<AdminPackage>('/admin/packages', payload);
  return data;
}

export async function updatePackage(id: string, payload: Partial<PackagePayload>) {
  const { data } = await adminApi.patch<AdminPackage>(`/admin/packages/${id}`, payload);
  return data;
}

export async function deletePackage(id: string) {
  const { data } = await adminApi.delete<{ deleted: boolean }>(`/admin/packages/${id}`);
  return data;
}

export interface BmsCreditInfo {
  balance: number | null;
  updatedAt: string | null;
}

export async function fetchBmsCredit() {
  const { data } = await adminApi.get<BmsCreditInfo>('/admin/packages/bms-credit');
  return data;
}

export async function refreshBmsCredit() {
  const { data } = await adminApi.post<BmsCreditInfo>('/admin/packages/bms-credit/refresh');
  return data;
}
