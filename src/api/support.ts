import { api } from '@/api/client';

export type TicketCategory = 'issue' | 'feature';
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface TicketSummary {
  id: string;
  subject: string;
  category: TicketCategory;
  status: TicketStatus;
  createdAt: string;
}

export interface TicketDetail extends TicketSummary {
  description: string;
  resolutionNote: string;
  statusUpdatedAt: string | null;
  submittedBy: { id: string; name: string } | null;
}

export async function fetchTickets() {
  const { data } = await api.get<TicketDetail[]>('/tickets');
  return data;
}

export async function fetchTicket(id: string) {
  const { data } = await api.get<TicketDetail>(`/tickets/${id}`);
  return data;
}

export async function submitTicket(payload: { subject: string; category: TicketCategory; description: string }) {
  const { data } = await api.post<TicketDetail>('/tickets', payload);
  return data;
}
