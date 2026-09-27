import { adminApi } from '@/api/adminClient';

// 'manual' = recorded by hand via RecordTransactionDialog (see recordAdminTransaction
// below) for a real payment the normal flow never captured - not a closed enum
// server-side (Transaction.type is free-form), but these are the values this app
// actually produces.
export type AdminTransactionType = 'sms_package' | 'birthday_automation' | 'extra_team_seat' | 'manual';

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

export async function deleteAdminTransaction(id: string) {
  const { data } = await adminApi.delete<{ deleted: true }>(`/admin/transactions/${id}`);
  return data;
}

export interface RecordTransactionPayload {
  organizationId: string;
  // Positive to credit, negative to debit/correct.
  credits: number;
  // Real-world amount this represents, if any - defaults to 0 server-side.
  amountGHS?: number;
  label: string;
  // External reference (e.g. a Paystack reference) - optional, but enforced unique
  // server-side so the same payment can never be recorded twice.
  reference?: string;
}

export interface RecordTransactionResult {
  id: string;
  walletBalanceCredits: number;
}

export async function recordAdminTransaction(payload: RecordTransactionPayload) {
  const { data } = await adminApi.post<RecordTransactionResult>('/admin/transactions', payload);
  return data;
}
