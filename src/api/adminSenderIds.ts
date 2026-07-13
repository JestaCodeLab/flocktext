import { adminApi } from '@/api/adminClient';
import type { AdminSenderIdPendingEntry, AdminSenderIdRow, SenderIdStatus } from '@/types/admin';

export async function fetchPendingSenderIds() {
  const { data } = await adminApi.get<AdminSenderIdPendingEntry[]>('/admin/sender-ids/pending');
  return data;
}

export async function fetchAllSenderIds() {
  const { data } = await adminApi.get<AdminSenderIdRow[]>('/admin/sender-ids');
  return data;
}

export async function approveSenderId(orgId: string, senderIdId: string) {
  const { data } = await adminApi.post<{ status: SenderIdStatus }>(`/admin/sender-ids/${orgId}/${senderIdId}/approve`);
  return data;
}

export async function rejectSenderId(orgId: string, senderIdId: string, reason: string) {
  const { data } = await adminApi.post<{ status: SenderIdStatus; rejectionReason: string }>(
    `/admin/sender-ids/${orgId}/${senderIdId}/reject`,
    { reason }
  );
  return data;
}

export async function checkBmsStatus(orgId: string, senderIdId: string) {
  const { data } = await adminApi.post<{ bmsStatus: string }>(`/admin/sender-ids/${orgId}/${senderIdId}/check-bms`);
  return data;
}

export async function markSenderIdBmsApproved(orgId: string, senderIdId: string) {
  const { data } = await adminApi.post<{ status: SenderIdStatus }>(`/admin/sender-ids/${orgId}/${senderIdId}/mark-approved`);
  return data;
}
