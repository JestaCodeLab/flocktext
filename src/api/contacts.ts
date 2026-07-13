import { api } from '@/api/client';

export interface Contact {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  source: 'manual' | 'csv_import' | 'self_registration';
  phone: string;
  groups: { id: string; name: string }[];
  groupsText: string;
  date: string;
}

export async function fetchContacts(search?: string) {
  const { data } = await api.get<Contact[]>('/contacts', { params: search ? { search } : undefined });
  return data;
}

export async function fetchContactsCount() {
  const { data } = await api.get<{ count: number }>('/contacts/count');
  return data.count;
}

export async function createContact(payload: { name: string; phone: string; dateOfBirth?: string; groupIds?: string[] }) {
  const { data } = await api.post<Contact>('/contacts', payload);
  return data;
}

export async function fetchBirthdays() {
  const { data } = await api.get<Contact[]>('/contacts', { params: { hasDob: true } });
  return data;
}

export async function updateContact(id: string, payload: { name: string; phone: string; dateOfBirth?: string }) {
  const { data } = await api.patch<Contact>(`/contacts/${id}`, payload);
  return data;
}

export async function deleteContact(id: string) {
  const { data } = await api.delete<{ deleted: boolean }>(`/contacts/${id}`);
  return data;
}

export async function bulkDeleteContacts(ids: string[]) {
  const { data } = await api.post<{ deleted: number }>('/contacts/bulk-delete', { ids });
  return data;
}

export interface ImportResult {
  imported: number;
  skipped: number;
  errors: { row: number; reason: string }[];
}

export async function importContactsCsv(file: File, groupId?: string) {
  const formData = new FormData();
  formData.append('file', file);
  if (groupId) formData.append('groupId', groupId);
  const { data } = await api.post<ImportResult>('/contacts/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export interface Group {
  id: string;
  name: string;
  count: number;
}

export async function fetchGroups() {
  const { data } = await api.get<Group[]>('/groups');
  return data;
}

export async function createGroup(name: string) {
  const { data } = await api.post<Group>('/groups', { name });
  return data;
}

export async function updateGroup(id: string, name: string) {
  const { data } = await api.patch<Group>(`/groups/${id}`, { name });
  return data;
}

export async function deleteGroup(id: string) {
  const { data } = await api.delete<{ deleted: boolean }>(`/groups/${id}`);
  return data;
}

export interface GroupDetail extends Group {
  members: Contact[];
}

export async function fetchGroupDetail(id: string) {
  const { data } = await api.get<GroupDetail>(`/groups/${id}`);
  return data;
}

export async function addContactsToGroup(id: string, contactIds: string[]) {
  const { data } = await api.post<{ added: number }>(`/groups/${id}/contacts`, { contactIds });
  return data;
}
