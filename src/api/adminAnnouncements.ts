import { adminApi } from '@/api/adminClient';
import type { AdminAnnouncement } from '@/types/admin';

export interface CreateAnnouncementPayload {
  title: string;
  message: string;
}

export interface AdminAnnouncementListResponse {
  announcements: AdminAnnouncement[];
  total: number;
  page: number;
  limit: number;
}

export async function fetchAdminAnnouncements(page = 1, limit = 25) {
  const { data } = await adminApi.get<AdminAnnouncementListResponse>('/admin/announcements', { params: { page, limit } });
  return data;
}

export async function createAnnouncement(payload: CreateAnnouncementPayload) {
  const { data } = await adminApi.post<AdminAnnouncement>('/admin/announcements', payload);
  return data;
}
