import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export interface EditHubtelCredentialsTarget {
  senderIdId: string;
  senderId: string;
  hubtelConfigured: boolean;
}

export function EditHubtelCredentialsDialog({
  target,
  onOpenChange,
  onConfirm,
  isPending,
}: {
  target: EditHubtelCredentialsTarget | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (clientId: string, clientSecret: string) => void;
  isPending: boolean;
}) {
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');

  useEffect(() => {
    if (target) {
      setClientId('');
      setClientSecret('');
    }
  }, [target]);

  return (
    <Dialog open={!!target} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Hubtel credentials for {target?.senderId}</DialogTitle>
        </DialogHeader>
        <div className="text-xs text-muted-foreground">
          Used to resend this sender ID&apos;s SMS via Hubtel (backup provider) when BMS Africa leaves a delivery
          stuck pending for 5+ minutes. Hubtel issues its own Client ID/Secret per registered sender ID, so this is
          scoped to <span className="font-semibold text-foreground">{target?.senderId}</span> specifically, not the
          whole organization.
        </div>
        <div className="space-y-3.5">
          <div className="space-y-1.5">
            <Label htmlFor="hubtel-client-id">Client ID</Label>
            <Input
              id="hubtel-client-id"
              autoComplete="off"
              placeholder={target?.hubtelConfigured ? '••••••••' : ''}
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="hubtel-client-secret">Client secret</Label>
            <PasswordInput
              id="hubtel-client-secret"
              autoComplete="off"
              placeholder={target?.hubtelConfigured ? '••••••••' : ''}
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={isPending || !clientId || !clientSecret} onClick={() => onConfirm(clientId, clientSecret)}>
            {isPending ? 'Saving…' : target?.hubtelConfigured ? 'Update credentials' : 'Save credentials'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
