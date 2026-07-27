import { adminApi } from '@/api/adminClient';

export type AdminTransactionType = 'sms_package' | 'birthday_automation' | 'extra_team_seat';

export interface AdminTransaction {
  id: string;
  orgId: string | null;
  churchName: string;
  type: AdminTransactionType;
  label: string;
  amountGHS: number;
  credits: number;
  paystackReference: string | null;
  date: string;
}

export interface AdminTransactionListResponse {
  rows: AdminTransaction[];
  total: number;
  page: number;
  pageSize: number;
  summary: { totalGHS: number; count: number };
}

export async function fetchAdminTransactions(params?: {
  search?: string;
  type?: AdminTransactionType;
  page?: number;
  pageSize?: number;
}) {
  const { data } = await adminApi.get<AdminTransactionListResponse>('/admin/transactions', { params });
  return data;
}
