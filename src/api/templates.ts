import { api } from '@/api/client';

export interface Template {
  id: string;
  name: string;
  body: string;
  isCustom: boolean;
  preview: string;
}

export async function fetchTemplates() {
  const { data } = await api.get<Template[]>('/templates');
  return data;
}

export async function createTemplate(payload: { name: string; body: string }) {
  const { data } = await api.post<Template>('/templates', payload);
  return data;
}

export async function deleteTemplate(id: string) {
  await api.delete(`/templates/${id}`);
}
