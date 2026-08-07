import { adminApi } from '@/api/adminClient';

export interface AdminMessageStats {
  total: number;
  delivered: number;
  failed: number;
  pending: number;
  rejected: number;
}

export interface AdminMessageSummary {
  id: string;
  orgId: string | null;
  churchName: string;
  preview: string;
  recipientCount: number;
  senderId: string;
  sentBy: string;
  date: string;
  stats: AdminMessageStats;
}

export interface AdminMessageListResponse {
  rows: AdminMessageSummary[];
  total: number;
  page: number;
  pageSize: number;
}

export async function fetchAdminMessages(params?: {
  search?: string;
  status?: 'delivered' | 'failed' | 'rejected';
  page?: number;
  pageSize?: number;
}) {
  const { data } = await adminApi.get<AdminMessageListResponse>('/admin/messages', { params });
  return data;
}

export interface AdminMessageRecipientRow {
  id: string;
  name: string;
  phone: string;
  status: 'pending' | 'delivered' | 'failed' | 'rejected';
  reason: string;
  userReason: string;
  deliveredAt: string | null;
  provider: 'bms' | 'hubtel';
}

export interface AdminMessageDetail {
  id: string;
  churchName: string;
  body: string;
  date: string;
  senderId: string;
  creditCost: number;
  source: 'admin';
  stats: AdminMessageStats;
  recipients: AdminMessageRecipientRow[];
}

export async function fetchAdminMessageRecipients(id: string) {
  const { data } = await adminApi.get<AdminMessageDetail>(`/admin/messages/${id}/recipients`);
  return data;
}

export async function deleteAdminMessage(id: string) {
  const { data } = await adminApi.delete<{ deleted: true }>(`/admin/messages/${id}`);
  return data;
}
