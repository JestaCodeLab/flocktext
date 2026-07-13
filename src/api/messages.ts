import { api } from '@/api/client';

export type RecipientType = 'groups' | 'single' | 'selection' | 'all' | 'birthday';
export type SendMode = 'now' | 'once' | 'recurring';
export type RecurringFreq = 'daily' | 'weekly' | 'monthly';

export interface SendMessagePayload {
  body: string;
  recipientType: RecipientType;
  groupIds?: string[];
  contactIds?: string[];
  phone?: string;
  recipientName?: string;
  templateId?: string | null;
  senderIdToUse?: string;
}

export interface SendMessageResult {
  id: string;
  stats: { total: number; delivered: number; failed: number; pending: number };
  creditCost: number;
  walletBalanceCredits: number;
}

export async function sendMessage(payload: SendMessagePayload) {
  const { data } = await api.post<SendMessageResult>('/messages/send', payload);
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
  const { data } = await api.post<{ id: string; scheduleDate: string }>('/messages/schedule', payload);
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

export async function fetchScheduledMessages() {
  const { data } = await api.get<ScheduledMessage[]>('/messages/scheduled');
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
  stats: MessageStats;
}

export async function fetchMessages(limit?: number) {
  const { data } = await api.get<MessageSummary[]>('/messages', { params: limit ? { limit } : undefined });
  return data;
}

export interface MessageRecipientRow {
  id: string;
  name: string;
  phone: string;
  status: 'pending' | 'delivered' | 'failed';
  reason: string;
  deliveredAt: string | null;
}

export interface MessageDetail {
  id: string;
  body: string;
  date: string;
  senderId: string;
  creditCost: number;
  stats: MessageStats;
  recipients: MessageRecipientRow[];
}

export async function fetchMessageRecipients(id: string) {
  const { data } = await api.get<MessageDetail>(`/messages/${id}/recipients`);
  return data;
}

export async function resendFailedMessage(id: string) {
  const { data } = await api.post<SendMessageResult>(`/messages/${id}/resend-failed`);
  return data;
}

export interface RecipientListRow {
  id: string;
  messageId: string;
  name: string;
  phone: string;
  status: 'pending' | 'delivered' | 'failed';
  reason: string;
  deliveredAt: string | null;
  date: string;
  messagePreview: string;
  senderId: string;
}

export async function fetchRecipientsByStatus(status: 'delivered' | 'failed') {
  const { data } = await api.get<RecipientListRow[]>('/messages/recipients', { params: { status } });
  return data;
}
