import { api } from '@/api/client';

export interface ApiKey {
  id: string;
  label: string;
  keyPrefix: string;
  lastUsedAt: string | null;
  createdAt: string;
  revoked: boolean;
}

export interface CreatedApiKey extends ApiKey {
  key: string;
}

export async function fetchApiKeys() {
  const { data } = await api.get<ApiKey[]>('/developer/api-keys');
  return data;
}

export async function createApiKey(label: string) {
  const { data } = await api.post<CreatedApiKey>('/developer/api-keys', { label });
  return data;
}

export async function revokeApiKey(id: string) {
  const { data } = await api.delete<ApiKey>(`/developer/api-keys/${id}`);
  return data;
}
