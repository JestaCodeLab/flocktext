import { adminApi } from '@/api/adminClient';
import type { TicketCategory, TicketStatus } from '@/api/support';

export interface AdminTicket {
  id: string;
  orgId: string | null;
  churchName: string;
  submittedBy: { id: string; name: string; email: string } | null;
  subject: string;
  description: string;
  category: TicketCategory;
  status: TicketStatus;
  resolutionNote: string;
  statusUpdatedAt: string | null;
  createdAt: string;
}

export interface AdminTicketListResponse {
  rows: AdminTicket[];
  total: number;
  page: number;
  pageSize: number;
}

export async function fetchAdminTickets(params?: {
  status?: TicketStatus;
  category?: TicketCategory;
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  const { data } = await adminApi.get<AdminTicketListResponse>('/admin/tickets', { params });
  return data;
}

export async function fetchAdminTicket(id: string) {
  const { data } = await adminApi.get<AdminTicket>(`/admin/tickets/${id}`);
  return data;
}

export async function updateAdminTicketStatus(id: string, payload: { status: TicketStatus; resolutionNote?: string }) {
  const { data } = await adminApi.patch<AdminTicket>(`/admin/tickets/${id}/status`, payload);
  return data;
}
