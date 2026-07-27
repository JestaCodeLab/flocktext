import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { sendOrgSms } from '@/api/adminOrganizations';
import { apiErrorMessage } from '@/api/client';
import type { AdminOrgUser } from '@/types/admin';

function countSegments(body: string) {
  return Math.max(1, Math.ceil(body.length / 160));
}

export function SendOrgSmsDialog({
  orgId,
  churchName,
  admins,
  open,
  onOpenChange,
}: {
  orgId: string;
  churchName: string;
  admins: AdminOrgUser[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [body, setBody] = useState('');

  function reset() {
    setBody('');
  }

  const send = useMutation({
    mutationFn: () => sendOrgSms(orgId, { body: body.trim() }),
    onSuccess: (data) => {
      toast.success(`Sent — ${data.stats.total} admin${data.stats.total === 1 ? '' : 's'} messaged.`);
      queryClient.invalidateQueries({ queryKey: ['admin-messages'] });
      onOpenChange(false);
      reset();
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) reset();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send SMS to {churchName}'s admins</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
            Sent to {admins.length} admin{admins.length === 1 ? '' : 's'} — {admins.map((a) => a.name).join(', ') || '—'} — using
            FlockText's platform sender ID. Not billed against the organization's wallet.
          </div>
          <div className="space-y-2">
            <Textarea
              placeholder="Type your message…"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="min-h-[120px] resize-y"
              autoFocus
            />
            <div className="text-xs text-muted-foreground">
              {body.length}/160 characters — {countSegments(body)} SMS segment(s)
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={!body.trim() || admins.length === 0 || send.isPending} onClick={() => send.mutate()}>
            {send.isPending ? 'Sending…' : 'Send SMS'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
