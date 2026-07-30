import { api } from '@/api/client';
import type { Account, Session } from '@/types';

export async function fetchAccounts() {
  const { data } = await api.get<Account[]>('/memberships');
  return data;
}

export async function createAccount(payload: { churchName?: string; organizationType?: string } = {}) {
  const { data } = await api.post<Session>('/memberships', payload);
  return data;
}

export async function switchAccount(organizationId: string) {
  const { data } = await api.post<Session>(`/memberships/${organizationId}/switch`);
  return data;
}

// Only succeeds while that account's onboarding hasn't finished and the
// caller is still its only member - see membershipController.remove.
export async function removeAccount(organizationId: string) {
  const { data } = await api.delete<Session>(`/memberships/${organizationId}`);
  return data;
}
