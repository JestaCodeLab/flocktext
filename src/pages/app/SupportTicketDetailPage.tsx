import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Bug, Headset, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchTicket } from '@/api/support';
import { TicketStatusBadge, ticketCategoryLabel } from '@/lib/ticketStatus';
import { getInitials } from '@/lib/name';

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export function SupportTicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const ticket = useQuery({
    queryKey: ['ticket', id],
    queryFn: () => fetchTicket(id!),
    enabled: !!id,
  });

  return (
    <div>
      <Button variant="ghost" className="mb-4 -ml-2.5" onClick={() => navigate('/app/support')}>
        <ArrowLeft className="h-4 w-4" /> Back to Support
      </Button>

      {ticket.isLoading && (
        <div className="max-w-3xl space-y-3">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
        </div>
      )}

      {ticket.isError && (
        <div className="max-w-3xl rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          Couldn't load this ticket. It may have been removed.
        </div>
      )}

      {ticket.data && (
        <div className="max-w-3xl">
          <div className="mb-4 overflow-hidden rounded-xl border border-border bg-card">
            <div className="flex flex-wrap items-start justify-between gap-3 p-5">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  {ticket.data.category === 'issue' ? <Bug className="h-[18px] w-[18px]" /> : <Sparkles className="h-[18px] w-[18px]" />}
                </div>
                <div>
                  <div className="text-xs font-medium text-muted-foreground">
                    {ticketCategoryLabel[ticket.data.category]} · #{ticket.data.id.slice(-6).toUpperCase()}
                  </div>
                  <div className="mt-0.5 text-[20px] font-bold sm:text-[22px]">{ticket.data.subject}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Submitted by <span className="font-medium text-foreground">{ticket.data.submittedBy?.name ?? 'a team member'}</span> on{' '}
                    {formatDate(ticket.data.createdAt)}
                  </div>
                </div>
              </div>
              <TicketStatusBadge status={ticket.data.status} className="shrink-0" />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex gap-3">
              <Avatar size="sm" className="mt-0.5">
                <AvatarFallback className="bg-muted text-muted-foreground">
                  {getInitials(ticket.data.submittedBy?.name ?? 'You')}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1 rounded-xl rounded-tl-sm border border-border bg-card p-4">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <div className="text-[13px] font-semibold">{ticket.data.submittedBy?.name ?? 'You'}</div>
                  <div className="shrink-0 text-xs text-muted-foreground">{formatDate(ticket.data.createdAt)}</div>
                </div>
                <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{ticket.data.description}</div>
              </div>
            </div>

            {ticket.data.resolutionNote && (
              <div className="flex gap-3">
                <Avatar size="sm" className="mt-0.5">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    <Headset className="h-3.5 w-3.5" />
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1 rounded-xl rounded-tl-sm border border-primary/15 bg-primary/[0.04] p-4">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <div className="text-[13px] font-semibold">Support team</div>
                    {ticket.data.statusUpdatedAt && (
                      <div className="shrink-0 text-xs text-muted-foreground">{formatDateTime(ticket.data.statusUpdatedAt)}</div>
                    )}
                  </div>
                  <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{ticket.data.resolutionNote}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
