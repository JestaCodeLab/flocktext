import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Bug, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchTicket } from '@/api/support';
import { ticketStatusLabel, ticketStatusVariant, ticketCategoryLabel } from '@/lib/ticketStatus';

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
        <div className="space-y-3">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      )}

      {ticket.data && (
        <div className="max-w-2xl">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-2.5">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                {ticket.data.category === 'issue' ? <Bug className="h-[18px] w-[18px]" /> : <Sparkles className="h-[18px] w-[18px]" />}
              </div>
              <div>
                <div className="text-[20px] font-bold sm:text-[22px]">{ticket.data.subject}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {ticketCategoryLabel[ticket.data.category]} · Submitted by {ticket.data.submittedBy?.name ?? 'a team member'} on{' '}
                  {new Date(ticket.data.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
            </div>
            <Badge variant={ticketStatusVariant[ticket.data.status]}>{ticketStatusLabel[ticket.data.status]}</Badge>
          </div>

          <div className="mb-4 rounded-xl border border-border bg-card p-5">
            <div className="mb-2 text-[13px] font-semibold text-foreground/80">Description</div>
            <div className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{ticket.data.description}</div>
          </div>

          {ticket.data.resolutionNote && (
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="mb-2 text-[13px] font-semibold text-foreground/80">Note from support</div>
              <div className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{ticket.data.resolutionNote}</div>
              {ticket.data.statusUpdatedAt && (
                <div className="mt-3 text-xs text-muted-foreground">
                  Updated {new Date(ticket.data.statusUpdatedAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
