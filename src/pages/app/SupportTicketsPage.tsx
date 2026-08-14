import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, LifeBuoy, Bug, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { fetchTickets, submitTicket, type TicketCategory } from '@/api/support';
import { apiErrorMessage } from '@/api/client';
import { ticketStatusLabel, ticketStatusVariant, ticketCategoryLabel } from '@/lib/ticketStatus';

export function SupportTicketsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<TicketCategory>('bug');
  const [description, setDescription] = useState('');

  const tickets = useQuery({ queryKey: ['tickets'], queryFn: fetchTickets });

  function closeForm() {
    setShowForm(false);
    setSubject('');
    setCategory('bug');
    setDescription('');
  }

  const create = useMutation({
    mutationFn: submitTicket,
    onSuccess: () => {
      toast.success('Ticket submitted.');
      closeForm();
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-[22px] font-bold sm:text-[26px]">Support</div>
          <div className="mt-0.5 text-sm text-muted-foreground">Report an issue or request a feature — we'll keep you posted here.</div>
        </div>
        <Button className="self-start sm:self-auto" onClick={() => setShowForm(true)}>
          <Plus className="h-[15px] w-[15px]" /> New ticket
        </Button>
      </div>

      <Dialog open={showForm} onOpenChange={(open) => (open ? setShowForm(true) : closeForm())}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New ticket</DialogTitle>
          </DialogHeader>
          <div className="space-y-3.5">
            <div className="space-y-1.5">
              <div className="text-[13px] font-semibold">Subject</div>
              <Input placeholder="e.g. Scheduled messages not sending" value={subject} onChange={(e) => setSubject(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <div className="text-[13px] font-semibold">Type</div>
              <Select
                value={category}
                onValueChange={(v) => setCategory(v as TicketCategory)}
                items={[
                  { value: 'bug', label: ticketCategoryLabel.bug },
                  { value: 'feature', label: ticketCategoryLabel.feature },
                ]}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bug">{ticketCategoryLabel.bug}</SelectItem>
                  <SelectItem value="feature">{ticketCategoryLabel.feature}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <div className="text-[13px] font-semibold">Description</div>
              <Textarea
                placeholder="Tell us what happened, or what you'd like to see…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[130px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeForm}>
              Cancel
            </Button>
            <Button
              disabled={create.isPending || !subject.trim() || description.trim().length < 10}
              onClick={() => create.mutate({ subject, category, description })}
            >
              {create.isPending ? 'Submitting…' : 'Submit ticket'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {!tickets.isLoading && tickets.data?.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-10 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <LifeBuoy className="h-5 w-5" />
          </div>
          <div className="text-sm text-muted-foreground">No tickets yet. Report an issue or request a feature to get started.</div>
        </div>
      )}

      <div className="space-y-2.5">
        {tickets.isLoading && Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[74px] rounded-xl" />)}
        {tickets.data?.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => navigate(`/app/support/${t.id}`)}
            className="flex w-full items-start gap-3 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:bg-secondary/40"
          >
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
              {t.category === 'bug' ? <Bug className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <div className="truncate text-[14px] font-semibold">{t.subject}</div>
                <Badge variant={ticketStatusVariant[t.status]}>{ticketStatusLabel[t.status]}</Badge>
              </div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                {ticketCategoryLabel[t.category]} · {new Date(t.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
