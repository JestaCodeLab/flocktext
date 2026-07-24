import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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
          <Input id="reject-reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Not appropriate for church notifications…" />
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
