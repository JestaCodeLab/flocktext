import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatSenderIdInput } from '@/lib/senderId';

export interface EditSenderIdTarget {
  senderIdId: string;
  senderId: string;
  purpose: string;
}

export function EditSenderIdDialog({
  target,
  onOpenChange,
  onConfirm,
  isPending,
}: {
  target: EditSenderIdTarget | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (senderId: string, purpose: string) => void;
  isPending: boolean;
}) {
  const [senderId, setSenderId] = useState('');
  const [purpose, setPurpose] = useState('');

  useEffect(() => {
    if (target) {
      setSenderId(target.senderId);
      setPurpose(target.purpose);
    }
  }, [target]);

  function handleOpenChange(next: boolean) {
    onOpenChange(next);
  }

  return (
    <Dialog open={!!target} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit sender ID</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-sender-id">Sender ID</Label>
            <Input
              id="edit-sender-id"
              maxLength={11}
              value={senderId}
              onChange={(e) => setSenderId(formatSenderIdInput(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-sender-purpose">Purpose</Label>
            <Textarea id="edit-sender-purpose" value={purpose} onChange={(e) => setPurpose(e.target.value)} />
          </div>
          <div className="text-xs text-muted-foreground">Saving resubmits this for review as pending.</div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={isPending || senderId.trim().length < 3 || purpose.trim().length < 5}
            onClick={() => onConfirm(senderId.trim(), purpose.trim())}
          >
            {isPending ? 'Saving…' : 'Save changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
