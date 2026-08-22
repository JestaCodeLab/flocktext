import { CircleDot, Clock, CheckCircle2, Ban } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type TicketStatusValue = 'open' | 'in_progress' | 'resolved' | 'closed';

export const ticketStatusLabel: Record<TicketStatusValue, string> = {
  open: 'Open',
  in_progress: 'In progress',
  resolved: 'Resolved',
  closed: 'Closed',
};

// Distinct treatment per status - solid gray / amber outline / green / plain outline -
// so no two statuses read as the same color at a glance.
const STATUS_STYLE: Record<TicketStatusValue, { icon: typeof CircleDot; variant: 'secondary' | 'outline' | 'success'; className?: string }> = {
  open: { icon: CircleDot, variant: 'secondary' },
  in_progress: { icon: Clock, variant: 'outline', className: 'border-warning/30 bg-warning/10 text-warning' },
  resolved: { icon: CheckCircle2, variant: 'success' },
  closed: { icon: Ban, variant: 'outline' },
};

export function TicketStatusBadge({ status, className }: { status: TicketStatusValue; className?: string }) {
  const { icon: Icon, variant, className: styleClassName } = STATUS_STYLE[status];
  return (
    <Badge variant={variant} className={cn(styleClassName, className)}>
      <Icon data-icon="inline-start" className="size-3" />
      {ticketStatusLabel[status]}
    </Badge>
  );
}

export const ticketCategoryLabel: Record<'issue' | 'feature', string> = {
  issue: 'Report an issue',
  feature: 'Feature request',
};
