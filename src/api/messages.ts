import { api } from '@/api/client';
import type { DateRangeParams } from '@/lib/dateRange';

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
  phone?: string;
  recipientName?: string;
  templateId?: string | null;
  senderId?: string;
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

export async function fetchMessages(status?: 'delivered' | 'failed', range?: DateRangeParams, page?: PageParams) {
  const { data } = await api.get<Paginated<MessageSummary>>('/messages', { params: { status, ...range, ...page } });
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

