import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { registerSenderId } from '@/api/organization';
import { apiErrorMessage } from '@/api/client';
import { useAuthStore } from '@/store/authStore';
import type { SessionOrganization } from '@/types';

export function AddSenderIdDialog({
  open,
  onOpenChange,
  onRegistered,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRegistered?: (organization: SessionOrganization) => void;
}) {
  const updateOrganization = useAuthStore((s) => s.updateOrganization);
  const [senderId, setSenderId] = useState('');
  const [purpose, setPurpose] = useState('');

  function reset() {
    setSenderId('');
    setPurpose('');
  }

  const register = useMutation({
    mutationFn: () => registerSenderId(senderId, purpose),
    onSuccess: (data) => {
      updateOrganization(data);
      toast.success('Sender ID submitted for review.');
      onOpenChange(false);
      reset();
      onRegistered?.(data);
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  function handleSubmit() {
    if (!senderId.trim()) {
      toast.error('Enter a sender ID.');
      return;
    }
    if (purpose.trim().length < 5) {
      toast.error('Tell us how this sender ID will be used.');
      return;
    }
    register.mutate();
  }

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
          <DialogTitle>Add sender ID</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-sender-id">Sender ID</Label>
            <Input
              id="new-sender-id"
              placeholder="GRACECHAPEL"
              maxLength={11}
              value={senderId}
              onChange={(e) => setSenderId(e.target.value.toUpperCase())}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-sender-purpose">Purpose</Label>
            <Textarea
              id="new-sender-purpose"
              placeholder="Weekly service reminders and announcements to our congregation."
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={register.isPending} onClick={handleSubmit}>
            {register.isPending ? 'Submitting…' : 'Register Sender ID'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
