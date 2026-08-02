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

export interface DeleteAccountResult extends Session {
  // True if the whole organization was permanently deleted right now (caller was its
  // last admin) - no grace period. False if only the caller's own membership was
  // removed, leaving the organization and its other members untouched.
  purged: boolean;
}

// General-purpose account deletion (unlike removeAccount above) - requires the caller's
// password. See membershipController.deleteAccount for what `purged` means.
export async function deleteAccount(organizationId: string, password: string) {
  const { data } = await api.post<DeleteAccountResult>(`/memberships/${organizationId}/delete`, { password });
  return data;
}
