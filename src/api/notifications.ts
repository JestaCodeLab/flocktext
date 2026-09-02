import { api } from '@/api/client';

export type NotificationType =
  | 'low_balance'
  | 'schedule_confirm'
  | 'delivery_summary'
  | 'sender_id_approved'
  | 'sender_id_rejected'
  | 'team_invite'
  | 'platform_announcement'
  | 'ticket_status_changed';

export interface FeatureAnnouncementMetadata {
  announcementId?: string;
  kind: 'feature';
  subtext: string;
  media: { kind: 'image' | 'video'; url: string }[];
  links: { label: string; url: string }[];
}

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: { ticketId?: string } | FeatureAnnouncementMetadata | Record<string, unknown>;
  read: boolean;
  date: string;
}

export interface NotificationsResponse {
  unreadCount: number;
  notifications: NotificationItem[];
}

export async function fetchNotifications() {
  const { data } = await api.get<NotificationsResponse>('/notifications');
  return data;
}

export async function markNotificationRead(id: string) {
  const { data } = await api.patch<{ id: string; read: boolean }>(`/notifications/${id}/read`);
  return data;
}

export async function markAllNotificationsRead() {
  const { data } = await api.post<{ marked: boolean }>('/notifications/read-all');
  return data;
}
