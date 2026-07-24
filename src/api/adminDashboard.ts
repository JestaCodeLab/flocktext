import { adminApi } from '@/api/adminClient';
import type { AdminDashboardSummary, AdminDashboardChart } from '@/types/admin';
import type { DateRangeParams } from '@/lib/dateRange';

export async function fetchAdminDashboardSummary(range: DateRangeParams) {
  const { data } = await adminApi.get<AdminDashboardSummary>('/admin/dashboard/summary', { params: range });
  return data;
}

export async function fetchAdminDashboardChart() {
  const { data } = await adminApi.get<AdminDashboardChart>('/admin/dashboard/chart');
  return data;
}
