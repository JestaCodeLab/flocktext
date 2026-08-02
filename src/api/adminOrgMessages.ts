import { adminApi } from '@/api/adminClient';
import type { DateRangeParams } from '@/lib/dateRange';
import type { MessageDetail } from '@/api/messages';

export type AdminOrgMessageStatus = 'delivered' | 'pending' | 'failed';

export interface AdminOrgMessagesSummary {
  messagesSent: number;
  delivered: number;
  failed: number;
  pending: number;
  deliveryRate: number;
  creditsUsed: number;
}

export async function fetchAdminOrgMessagesSummary(orgId: string, range: DateRangeParams) {
  const { data } = await adminApi.get<AdminOrgMessagesSummary>(`/admin/organizations/${orgId}/messages/summary`, {
    params: range,
  });
  return data;
}

export interface AdminOrgMessagesChartBucket {
  date: string;
  label: string;
  sent: number;
  delivered: number;
  failed: number;
}

export async function fetchAdminOrgMessagesChart(orgId: string, range: DateRangeParams) {
  const { data } = await adminApi.get<{ buckets: AdminOrgMessagesChartBucket[] }>(
    `/admin/organizations/${orgId}/messages/chart`,
    { params: range }
  );
  return data;
}

export interface AdminOrgMessageStats {
  total: number;
  delivered: number;
  failed: number;
  pending: number;
}

export interface AdminOrgMessageSummary {
  id: string;
  preview: string;
  recipients: string;
  senderId: string;
  date: string;
  segments: number;
  creditCost: number;
  source: 'web' | 'api' | 'automation';
  stats: AdminOrgMessageStats;
}

export interface AdminOrgMessageListResponse {
  rows: AdminOrgMessageSummary[];
  total: number;
  page: number;
  pageSize: number;
}

export async function fetchAdminOrgMessages(
  orgId: string,
  status: AdminOrgMessageStatus | undefined,
  range: DateRangeParams,
  page: { page: number; pageSize: number }
) {
  const { data } = await adminApi.get<AdminOrgMessageListResponse>(`/admin/organizations/${orgId}/messages`, {
    params: { status, ...range, ...page },
  });
  return data;
}

export async function fetchAdminOrgMessageRecipients(orgId: string, messageId: string) {
  const { data } = await adminApi.get<MessageDetail>(`/admin/organizations/${orgId}/messages/${messageId}/recipients`);
  return data;
}

export interface ResendPendingResult {
  id: string;
  stats: AdminOrgMessageStats;
  creditCost: number;
  walletBalanceCredits: number;
}

export async function resendPendingMessage(orgId: string, messageId: string) {
  const { data } = await adminApi.post<ResendPendingResult>(
    `/admin/organizations/${orgId}/messages/${messageId}/resend-pending`
  );
  return data;
}

export interface AdminOrgMessageExportRow {
  id: string;
  date: string;
  body: string;
  recipients: string;
  senderId: string;
  total: number;
  delivered: number;
  failed: number;
  pending: number;
  creditCost: number;
}

export async function fetchAdminOrgMessagesExport(
  orgId: string,
  status: AdminOrgMessageStatus | undefined,
  range: DateRangeParams
) {
  const { data } = await adminApi.get<{ rows: AdminOrgMessageExportRow[] }>(
    `/admin/organizations/${orgId}/messages/export`,
    { params: { status, ...range } }
  );
  return data;
}
