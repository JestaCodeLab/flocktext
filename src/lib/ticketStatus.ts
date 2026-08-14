export type TicketStatusValue = 'open' | 'in_progress' | 'resolved' | 'closed';

export const ticketStatusLabel: Record<TicketStatusValue, string> = {
  open: 'Open',
  in_progress: 'In progress',
  resolved: 'Resolved',
  closed: 'Closed',
};

export const ticketStatusVariant: Record<TicketStatusValue, 'default' | 'secondary' | 'destructive'> = {
  open: 'secondary',
  in_progress: 'default',
  resolved: 'default',
  closed: 'destructive',
};

export const ticketCategoryLabel: Record<'bug' | 'feature', string> = {
  bug: 'Report an issue',
  feature: 'Feature request',
};
