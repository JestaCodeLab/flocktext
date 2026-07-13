import { api } from '@/api/client';

export interface DashboardSummary {
  churchName: string;
  walletBalanceCredits: number;
  walletBalanceGHS: number;
  contactsCount: number;
  sentThisMonth: number;
  deliveryRate: number;
  creditsUsedThisMonth: number;
}

export async function fetchDashboardSummary() {
  const { data } = await api.get<DashboardSummary>('/dashboard/summary');
  return data;
}

export interface RecentActivityItem {
  id: string;
  preview: string;
  group: string;
  date: string;
  deliveredText: string;
}

export async function fetchRecentActivity() {
  const { data } = await api.get<RecentActivityItem[]>('/messages/recent');
  return data;
}

export type DashboardChartRange = 'week' | 'month';

export interface DashboardChartBucket {
  date: string;
  label: string;
  sent: number;
  creditsUsed: number;
}

export interface DashboardChart {
  range: DashboardChartRange;
  buckets: DashboardChartBucket[];
}

export async function fetchDashboardChart(range: DashboardChartRange) {
  const { data } = await api.get<DashboardChart>('/dashboard/chart', { params: { range } });
  return data;
}
