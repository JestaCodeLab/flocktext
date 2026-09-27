import { adminApi } from '@/api/adminClient';
import type { DateRangeParams } from '@/lib/dateRange';

export interface AdminActivityLogEntry {
  id: string;
  orgId: string | null;
  churchName: string;
  actorName: string;
  action: string;
  description: string;
  date: string;
}

export interface AdminActivityLogListResponse {
  rows: AdminActivityLogEntry[];
  total: number;
  page: number;
  pageSize: number;
}

export type AdminActivityLogParams = {
  organization?: string;
  action?: string;
  page?: number;
  pageSize?: number;
} & Partial<DateRangeParams>;

// Platform-wide activity feed across every organization - see
// adminActivityLogController.list for the full set of `action` values this can return.
export async function fetchAdminActivityLogs(params?: AdminActivityLogParams) {
  const { data } = await adminApi.get<AdminActivityLogListResponse>('/admin/activity-logs', { params });
  return data;
}
