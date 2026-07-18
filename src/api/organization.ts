import { api } from '@/api/client';
import type { NotifPrefs, SessionOrganization } from '@/types';

export async function updateOrganizationProfile(payload: {
  churchName: string;
  address: string;
  contactEmail?: string;
  organizationType: 'church' | 'business' | 'institution';
}) {
  const { data } = await api.patch<SessionOrganization>('/organization', payload);
  return data;
}

export async function updateNotifPrefs(payload: NotifPrefs) {
  const { data } = await api.patch<SessionOrganization>('/organization/notifications', payload);
  return data;
}

export async function registerSenderId(senderId: string, purpose: string) {
  const { data } = await api.post<SessionOrganization>('/organization/sender-id', { senderId, purpose });
  return data;
}

export async function setPrimarySenderId(id: string) {
  const { data } = await api.patch<SessionOrganization>(`/organization/sender-id/${id}/primary`);
  return data;
}

export async function deleteSenderId(id: string) {
  const { data } = await api.delete<SessionOrganization>(`/organization/sender-id/${id}`);
  return data;
}

export async function skipOnboardingStep(step: 'sender_id' | 'contacts' | 'wallet') {
  const { data } = await api.post<SessionOrganization>('/organization/onboarding/skip', { step });
  return data;
}

export async function getContactLink() {
  const { data } = await api.get<{ token: string; url: string }>('/organization/contact-link');
  return data;
}

export async function fetchEffectiveSenderId() {
  const { data } = await api.get<{ senderId: string }>('/organization/effective-sender-id');
  return data;
}

export interface BirthdayAutomation {
  enabled: boolean;
  sendTime: string;
  message: string;
}

export async function fetchBirthdayAutomation() {
  const { data } = await api.get<BirthdayAutomation>('/organization/birthday-automation');
  return data;
}

export async function updateBirthdayAutomation(payload: BirthdayAutomation) {
  const { data } = await api.patch<BirthdayAutomation>('/organization/birthday-automation', payload);
  return data;
}
