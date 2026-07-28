import { adminApi } from '@/api/adminClient';
import type { AdminSenderIdPendingEntry, AdminSenderIdRow, SenderIdStatus } from '@/types/admin';

export async function fetchSenderIdTemplates() {
  const { data } = await adminApi.get<{ rejectionReason: string }>('/admin/sender-ids/templates');
  return data;
}

export async function fetchPendingSenderIds() {
  const { data } = await adminApi.get<AdminSenderIdPendingEntry[]>('/admin/sender-ids/pending');
  return data;
}

export async function fetchAllSenderIds() {
  const { data } = await adminApi.get<AdminSenderIdRow[]>('/admin/sender-ids');
  return data;
}

// Only allowed while the request is pending_review or rejected - editing resets
// it to pending_review with a clean rejection reason/BMS status server-side.
export async function editSenderId(orgId: string, senderIdId: string, payload: { senderId: string; purpose: string }) {
  const { data } = await adminApi.patch<{ id: string; senderId: string; purpose: string; status: SenderIdStatus }>(
    `/admin/sender-ids/${orgId}/${senderIdId}`,
    payload
  );
  return data;
}

export async function registerSenderId(orgId: string, senderIdId: string) {
  const { data } = await adminApi.post<{ status: SenderIdStatus }>(`/admin/sender-ids/${orgId}/${senderIdId}/register`);
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

// Only allowed while the request is "deleted" - restores straight to "approved".
export async function restoreSenderId(orgId: string, senderIdId: string) {
  const { data } = await adminApi.post<{ status: SenderIdStatus }>(`/admin/sender-ids/${orgId}/${senderIdId}/restore`);
  return data;
}

// Only allowed while the request is "deleted" - removes the record outright.
export async function permanentlyDeleteSenderId(orgId: string, senderIdId: string) {
  const { data } = await adminApi.delete<{ deleted: boolean }>(`/admin/sender-ids/${orgId}/${senderIdId}`);
  return data;
}
