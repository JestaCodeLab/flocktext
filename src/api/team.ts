import { api } from '@/api/client';
import type { Role } from '@/types';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  isVerified: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export async function fetchTeam() {
  const { data } = await api.get<TeamMember[]>('/team');
  return data;
}

export async function inviteTeamMember(payload: { name: string; email: string; phone: string; role: 'admin' | 'viewer' }) {
  const { data } = await api.post<TeamMember>('/team/invite', payload);
  return data;
}

export async function updateTeamMemberRole(id: string, role: 'admin' | 'viewer') {
  const { data } = await api.patch<TeamMember>(`/team/${id}/role`, { role });
  return data;
}

export async function removeTeamMember(id: string) {
  const { data } = await api.delete<{ deleted: boolean }>(`/team/${id}`);
  return data;
}
