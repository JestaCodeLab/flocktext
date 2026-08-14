import { api } from '@/api/client';
import { useAuthStore } from '@/store/authStore';
import type { DateRangeParams } from '@/lib/dateRange';

// Message-sending endpoints validate this against the server-resolved active
// membership - if it doesn't match (e.g. the account was switched in another
// tab mid-flight), the server rejects the request rather than silently
// sending under the now-active org's sender ID/wallet.
function activeOrganizationId() {
  return useAuthStore.getState().session?.organization.id;
}

export interface PageParams {
  page: number;
  pageSize: number;
}

export interface Paginated<T> {
  rows: T[];
  total: number;
  page: number;
  pageSize: number;
}

export type RecipientType = 'groups' | 'single' | 'selection' | 'all' | 'birthday' | 'list';
export type SendMode = 'now' | 'once' | 'recurring';
export type RecurringFreq = 'daily' | 'weekly' | 'monthly';

export interface SendMessagePayload {
  body: string;
  recipientType: RecipientType;
  groupIds?: string[];
  contactIds?: string[];
  recipients?: { phone: string; name?: string }[];
  phone?: string;
  recipientName?: string;
  templateId?: string | null;
  senderId?: string;
}

export interface SendMessageResult {
  id: string;
  stats: { total: number; delivered: number; failed: number; pending: number; rejected: number };
  creditCost: number;
  walletBalanceCredits: number;
}

export async function sendMessage(payload: SendMessagePayload) {
  const { data } = await api.post<SendMessageResult>('/messages/send', { ...payload, organizationId: activeOrganizationId() });
  return data;
}

export interface ScheduleMessagePayload extends SendMessagePayload {
  sendMode: 'once' | 'recurring';
  scheduleDate?: string;
  recurringFreq?: RecurringFreq;
  recurringTime?: string;
  recurringDayOfWeek?: number;
  recurringDayOfMonth?: number;
}

export async function scheduleMessage(payload: ScheduleMessagePayload) {
  const { data } = await api.post<{ id: string; scheduleDate: string }>('/messages/schedule', {
    ...payload,
    organizationId: activeOrganizationId(),
  });
  return data;
}

export interface ScheduledMessage {
  id: string;
  body: string;
  recipientType: RecipientType;
  groups: { id: string; name: string }[];
  contactCount: number;
  phone?: string;
  recipientName?: string;
  sendMode: SendMode;
  scheduleDate: string;
  recurringFreq?: RecurringFreq;
  recurringTime?: string;
  recurringDayOfWeek?: number;
  recurringDayOfMonth?: number;
}

export async function fetchScheduledMessages(range?: DateRangeParams, page?: PageParams) {
  const { data } = await api.get<Paginated<ScheduledMessage>>('/messages/scheduled', { params: { ...range, ...page } });
  return data;
}

export async function cancelScheduledMessage(id: string) {
  const { data } = await api.delete<{ cancelled: boolean }>(`/messages/scheduled/${id}`);
  return data;
}

export interface MessageStats {
  total: number;
  delivered: number;
  failed: number;
  pending: number;
  rejected: number;
}

export interface MessageSummary {
  id: string;
  preview: string;
  recipientType: RecipientType;
  recipients: string;
  senderId: string;
  date: string;
  segments: number;
  creditCost: number;
  source: 'web' | 'api' | 'automation';
  stats: MessageStats;
}

export async function fetchMessages(status?: 'delivered' | 'failed' | 'rejected', range?: DateRangeParams, page?: PageParams) {
  const { data } = await api.get<Paginated<MessageSummary>>('/messages', { params: { status, ...range, ...page } });
  return data;
}

export interface MessageRecipientRow {
  id: string;
  name: string;
  phone: string;
  status: 'pending' | 'delivered' | 'failed' | 'rejected';
  // Technical/admin-facing cause - shown only in the Admin Console.
  reason: string;
  // Friendly, org-facing version of the same outcome - shown in the org's own reports.
  userReason: string;
  deliveredAt: string | null;
  // Only populated by the admin-facing recipients endpoints (see api/adminOrgMessages.ts) -
  // undefined on the org self-service endpoint this type is also shared with.
  provider?: 'bms' | 'hubtel';
  // Set once services/deliveryEscalation.js resends this recipient through the backup
  // provider - admin-only, same as provider above.
  escalatedAt?: string | null;
  // Last time this recipient's status changed - admin-only. Used to timestamp a failed
  // recipient's resolution, since only `deliveredAt` is set for the delivered case.
  updatedAt?: string;
}

export interface MessageDetail {
  id: string;
  body: string;
  date: string;
  senderId: string;
  creditCost: number;
  source: 'web' | 'api' | 'automation';
  stats: MessageStats;
  recipients: MessageRecipientRow[];
}

export async function fetchMessageRecipients(id: string) {
  const { data } = await api.get<MessageDetail>(`/messages/${id}/recipients`);
  return data;
}

export async function resendFailedMessage(id: string) {
  const { data } = await api.post<SendMessageResult>(`/messages/${id}/resend-failed`, { organizationId: activeOrganizationId() });
  return data;
}

