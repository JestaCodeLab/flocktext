import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { fetchSenderIdTemplates } from '@/api/adminSenderIds';

export function RejectSenderIdDialog({
  target,
  onOpenChange,
  onConfirm,
  isPending,
}: {
  target: { senderId: string } | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
  isPending: boolean;
}) {
  const [reason, setReason] = useState('');
  // Rarely changes and every admin page that can reject a sender ID mounts this
  // dialog - cache it instead of refetching each time the dialog opens.
  const templates = useQuery({
    queryKey: ['admin-sender-id-templates'],
    queryFn: fetchSenderIdTemplates,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (target) setReason(templates.data?.rejectionReason || '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, templates.data]);

  function handleOpenChange(next: boolean) {
    onOpenChange(next);
    if (!next) setReason('');
  }

  return (
    <Dialog open={!!target} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject sender ID "{target?.senderId}"</DialogTitle>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="reject-reason">Reason</Label>
          <Textarea
            id="reject-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Not appropriate for church notifications…"
            className="min-h-[100px] resize-y"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" disabled={isPending || !reason} onClick={() => onConfirm(reason)}>
            {isPending ? 'Rejecting…' : 'Reject'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
