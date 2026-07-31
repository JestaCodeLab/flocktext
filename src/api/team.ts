import { api } from '@/api/client';
import type { Role } from '@/types';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  /** Revoked members keep their history but have no access and hold no seat. */
  status: 'active' | 'revoked';
  isFounder: boolean;
  isVerified: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

// Every team call works against either the account the user is currently
// switched into (no organizationId) or another account they belong to - the
// API mounts the same handlers under both prefixes, so the only difference
// here is the path. Managing another account still requires being an admin of
// *that* account.
function teamPath(organizationId?: string) {
  return organizationId ? `/memberships/${organizationId}/team` : '/team';
}

export async function fetchTeam(organizationId?: string) {
  const { data } = await api.get<TeamMember[]>(teamPath(organizationId));
  return data;
}

export async function inviteTeamMember(
  payload: { name: string; email: string; phone: string; role: 'admin' | 'user' },
  organizationId?: string
) {
  const { data } = await api.post<TeamMember>(`${teamPath(organizationId)}/invite`, payload);
  return data;
}

export async function updateTeamMemberRole(id: string, role: 'admin' | 'user', organizationId?: string) {
  const { data } = await api.patch<TeamMember>(`${teamPath(organizationId)}/${id}/role`, { role });
  return data;
}

export async function revokeTeamMember(id: string, organizationId?: string) {
  const { data } = await api.post<TeamMember>(`${teamPath(organizationId)}/${id}/revoke`);
  return data;
}

export async function restoreTeamMember(id: string, organizationId?: string) {
  const { data } = await api.post<TeamMember>(`${teamPath(organizationId)}/${id}/restore`);
  return data;
}

export async function removeTeamMember(id: string, organizationId?: string) {
  const { data } = await api.delete<{ deleted: boolean }>(`${teamPath(organizationId)}/${id}`);
  return data;
}

export interface InviteMultiResultItem {
  organizationId: string;
  status: 'invited' | 'failed';
  /** Only present when status is 'invited'. */
  churchName?: string;
  /** Only present when status is 'invited'. */
  member?: TeamMember;
  /** Only present when status is 'failed'. 'not_admin' also covers not being a member of that account at all. */
  reason?: 'not_admin' | 'seat_unavailable' | 'already_member' | 'not_found' | 'other';
  /** Only present when status is 'failed'. */
  error?: string;
}

// Invites the same person into several of the caller's accounts in one request -
// each account is authorized and invited into independently server-side, so the
// response is a per-account result rather than one pass/fail (see api/routers/membershipRouter.js).
export async function inviteTeamMemberAcrossAccounts(payload: {
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'user';
  organizationIds: string[];
}) {
  const { data } = await api.post<{ results: InviteMultiResultItem[] }>('/memberships/invite', payload);
  return data.results;
}
