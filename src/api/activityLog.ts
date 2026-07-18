import { api } from '@/api/client';

export interface ActivityLogEntry {
  id: string;
  actorName: string;
  action: string;
  description: string;
  date: string;
}

export async function fetchActivityLog() {
  const { data } = await api.get<ActivityLogEntry[]>('/activity-log');
  return data;
}
