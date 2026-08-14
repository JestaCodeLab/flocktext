import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ticketStatusLabel, type TicketStatusValue } from '@/lib/ticketStatus';
import type { AdminTicket } from '@/api/adminTickets';

const STATUSES: TicketStatusValue[] = ['open', 'in_progress', 'resolved', 'closed'];

export function UpdateTicketStatusDialog({
  target,
  onOpenChange,
  onConfirm,
  isPending,
}: {
  target: AdminTicket | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (payload: { status: TicketStatusValue; resolutionNote?: string }) => void;
  isPending: boolean;
}) {
  const [status, setStatus] = useState<TicketStatusValue>('open');
  const [resolutionNote, setResolutionNote] = useState('');

  useEffect(() => {
    if (target) {
      setStatus(target.status);
      setResolutionNote(target.resolutionNote || '');
    }
  }, [target]);

  function handleOpenChange(next: boolean) {
    onOpenChange(next);
    if (!next) setResolutionNote('');
  }

  return (
    <Dialog open={!!target} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update "{target?.subject}"</DialogTitle>
        </DialogHeader>
        <div className="space-y-3.5">
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as TicketStatusValue)}
              items={STATUSES.map((s) => ({ value: s, label: ticketStatusLabel[s] }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {ticketStatusLabel[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="resolution-note">Note (optional)</Label>
            <Textarea
              id="resolution-note"
              value={resolutionNote}
              onChange={(e) => setResolutionNote(e.target.value)}
              placeholder="Shared with the org that submitted this ticket…"
              className="min-h-[100px] resize-y"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={isPending} onClick={() => onConfirm({ status, resolutionNote: resolutionNote.trim() || undefined })}>
            {isPending ? 'Saving…' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
