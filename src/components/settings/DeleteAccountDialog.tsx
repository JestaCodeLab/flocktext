import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { Account } from '@/types';

export function DeleteAccountDialog({
  account,
  onOpenChange,
  onConfirm,
  isPending,
}: {
  account: Account | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (password: string) => void;
  isPending: boolean;
}) {
  const [password, setPassword] = useState('');

  function handleOpenChange(open: boolean) {
    if (!open) setPassword('');
    onOpenChange(open);
  }

  return (
    <Dialog open={!!account} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete {account?.churchName || 'this account'}?</DialogTitle>
        </DialogHeader>
        <div className="text-sm text-muted-foreground">
          If you're the only admin left on this account, it and everything in it — contacts, messages, sender IDs,
          wallet balance — will be permanently deleted immediately. This can't be undone. Otherwise, you'll just lose
          your own access to it right away; the account and its other members are unaffected.
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="delete-account-password">Enter your password to confirm</Label>
          <PasswordInput id="delete-account-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <DialogFooter>
          <Button variant="outline" disabled={isPending} onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" disabled={isPending || !password} onClick={() => onConfirm(password)}>
            {isPending ? 'Deleting…' : 'Delete account'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
