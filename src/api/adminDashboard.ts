import { adminApi } from '@/api/adminClient';
import type { AdminDashboardSummary } from '@/types/admin';

export async function fetchAdminDashboardSummary() {
  const { data } = await adminApi.get<AdminDashboardSummary>('/admin/dashboard/summary');
  return data;
}
