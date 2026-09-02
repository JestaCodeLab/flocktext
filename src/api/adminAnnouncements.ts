import { adminApi } from '@/api/adminClient';
import type { AdminAnnouncement, AnnouncementLinkItem, AnnouncementMediaItem, AnnouncementType } from '@/types/admin';

export interface CreateSmsAnnouncementPayload {
  type: 'sms';
  title: string;
  message: string;
}

export interface CreateFeatureAnnouncementPayload {
  type: 'feature';
  title: string;
  subtext: string;
  media: AnnouncementMediaItem[];
  links: AnnouncementLinkItem[];
}

export type CreateAnnouncementPayload = CreateSmsAnnouncementPayload | CreateFeatureAnnouncementPayload;

export interface AdminAnnouncementListResponse {
  announcements: AdminAnnouncement[];
  total: number;
  page: number;
  limit: number;
}

export async function fetchAdminAnnouncements(type?: AnnouncementType, page = 1, limit = 25) {
  const { data } = await adminApi.get<AdminAnnouncementListResponse>('/admin/announcements', { params: { type, page, limit } });
  return data;
}

export async function createAnnouncement(payload: CreateAnnouncementPayload) {
  const { data } = await adminApi.post<AdminAnnouncement>('/admin/announcements', payload);
  return data;
}
