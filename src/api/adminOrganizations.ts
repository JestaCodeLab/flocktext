import { adminApi } from '@/api/adminClient';
import type { AdminOrgDetail, AdminOrgFunnelSummary, AdminOrgListItem, AdminOrgUser, OrgStage, OrgSubStage } from '@/types/admin';
import type { DateRangeParams } from '@/lib/dateRange';

export interface AdminOrgListResponse {
  organizations: AdminOrgListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export type AdminOrgListParams = {
  search?: string;
  status?: string;
  stage?: OrgStage;
  subStage?: OrgSubStage;
  page?: number;
  pageSize?: number;
} & Partial<DateRangeParams>;

export async function fetchAdminOrganizations(params?: AdminOrgListParams) {
  const { data } = await adminApi.get<AdminOrgListResponse>('/admin/organizations', { params });
  return data;
}

// Stage counts for the lifecycle funnel's stat cards - same cohort date-range
// semantics as fetchAdminOrganizations (which registrations to look at).
export async function fetchAdminOrgFunnelSummary(range: DateRangeParams) {
  const { data } = await adminApi.get<AdminOrgFunnelSummary>('/admin/organizations/funnel-summary', { params: range });
  return data;
}

export async function fetchAdminOrganizationDetail(id: string) {
  const { data } = await adminApi.get<AdminOrgDetail>(`/admin/organizations/${id}`);
  return data;
}

export async function updateAdminOrganizationProfile(
  id: string,
  payload: { churchName: string; address?: string; contactEmail?: string }
) {
  const { data } = await adminApi.patch(`/admin/organizations/${id}`, payload);
  return data;
}

export async function suspendOrganization(id: string) {
  const { data } = await adminApi.post<{ status: 'active' | 'suspended' }>(`/admin/organizations/${id}/suspend`);
  return data;
}

export async function reactivateOrganization(id: string) {
  const { data } = await adminApi.post<{ status: 'active' | 'suspended' }>(`/admin/organizations/${id}/reactivate`);
  return data;
}

export interface SendOrgSmsResult {
  id: string;
  stats: { total: number; delivered: number; failed: number; pending: number };
}

// Sends to every admin user of the org under FlockText's own platform sender ID -
// not billed against the org's wallet. See AdminOrganizationDetailPage's "Send SMS" button.
export async function sendOrgSms(id: string, payload: { body: string }) {
  const { data } = await adminApi.post<SendOrgSmsResult>(`/admin/organizations/${id}/send-sms`, payload);
  return data;
}

export async function adjustOrganizationWallet(id: string, payload: { credits: number; reason: string }) {
  const { data } = await adminApi.post<{ walletBalanceCredits: number }>(
    `/admin/organizations/${id}/wallet/adjust`,
    payload
  );
  return data;
}

export async function addOrganizationUser(
  id: string,
  payload: { name: string; email: string; phone: string; role: 'admin' | 'user' }
) {
  const { data } = await adminApi.post<AdminOrgUser>(`/admin/organizations/${id}/users`, payload);
  return data;
}

export async function updateOrganizationUser(
  id: string,
  userId: string,
  payload: { name: string; email: string; phone: string; role: 'admin' | 'user' }
) {
  const { data } = await adminApi.patch<AdminOrgUser>(`/admin/organizations/${id}/users/${userId}`, payload);
  return data;
}

export async function deleteOrganizationUser(id: string, userId: string) {
  const { data } = await adminApi.delete<{ deleted: true }>(`/admin/organizations/${id}/users/${userId}`);
  return data;
}

// Manual, on-demand version of the automated hourly dropoff reminder - only valid for a
// team member with isVerified: false. Sends a fresh code + resume link over SMS only.
export async function sendVerificationReminder(id: string, userId: string) {
  const { data } = await adminApi.post<{ sent: true }>(`/admin/organizations/${id}/users/${userId}/send-verification-reminder`);
  return data;
}

// Admin override for someone stuck on OTP verification that sales/support has already
// confirmed by phone - skips the code-entry flow but still seeds the org's default
// group/free-trial credit, same as a normal first verification.
export async function manuallyVerifyUser(id: string, userId: string) {
  const { data } = await adminApi.post<{ isVerified: true; verifiedAt: string }>(`/admin/organizations/${id}/users/${userId}/verify`);
  return data;
}

export async function deleteOrganization(id: string, confirmChurchName: string) {
  const { data } = await adminApi.delete<{ deleted: true }>(`/admin/organizations/${id}`, {
    data: { confirmChurchName },
  });
  return data;
}
