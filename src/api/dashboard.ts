import { api } from '@/api/client';
import type { DateRangeParams } from '@/lib/dateRange';

export interface DashboardSummary {
  churchName: string;
  walletBalanceCredits: number;
  contactsCount: number;
  messagesSent: number;
  deliveryRate: number;
  creditsUsed: number;
}

export async function fetchDashboardSummary(range: DateRangeParams) {
  const { data } = await api.get<DashboardSummary>('/dashboard/summary', { params: range });
  return data;
}

export interface RecentActivityItem {
  id: string;
  preview: string;
  group: string;
  date: string;
  deliveredText: string;
}

export async function fetchRecentActivity(range: DateRangeParams, limit = 5) {
  const { data } = await api.get<RecentActivityItem[]>('/messages/recent', { params: { ...range, limit } });
  return data;
}

export interface DashboardChartBucket {
  date: string;
  label: string;
  sent: number;
  creditsUsed: number;
}

export interface DashboardChart {
  buckets: DashboardChartBucket[];
}

export async function fetchDashboardChart(range: DateRangeParams) {
  const { data } = await api.get<DashboardChart>('/dashboard/chart', { params: range });
  return data;
}
