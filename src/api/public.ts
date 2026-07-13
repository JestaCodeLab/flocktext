import { api } from '@/api/client';

export async function fetchPublicOrg(token: string) {
  const { data } = await api.get<{ churchName: string }>(`/public/org/${token}`);
  return data;
}

export interface SelfRegisterPayload {
  firstName: string;
  lastName: string;
  phone: string;
  dateOfBirth?: string;
}

export async function submitPublicContact(token: string, payload: SelfRegisterPayload) {
  const { data } = await api.post<{ message: string }>(`/public/org/${token}/contacts`, payload);
  return data;
}
