import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export function DeleteOrganizationDialog({
  org,
  open,
  onOpenChange,
  onConfirm,
  isPending,
}: {
  org: { churchName: string; userCount: number; contactsCount: number; messagesTotal: number; walletBalanceCredits: number } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPending: boolean;
}) {
  const [confirmText, setConfirmText] = useState('');
  const churchName = org?.churchName || 'Untitled organization';
  const matches = confirmText.trim().toLowerCase() === churchName.trim().toLowerCase();

  function handleOpenChange(next: boolean) {
    onOpenChange(next);
    if (!next) setConfirmText('');
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" /> Delete "{churchName}"?
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm text-muted-foreground">
          <div>This permanently deletes the organization and everything tied to it:</div>
          <ul className="list-inside list-disc space-y-1">
            <li>{org?.userCount ?? 0} team member{org?.userCount === 1 ? '' : 's'}</li>
            <li>{(org?.contactsCount ?? 0).toLocaleString()} contacts and their groups</li>
            <li>{(org?.messagesTotal ?? 0).toLocaleString()} messages sent, templates, and API keys</li>
            <li>{(org?.walletBalanceCredits ?? 0).toLocaleString()} credits of wallet history</li>
          </ul>
          <div className="font-semibold text-destructive">This cannot be undone.</div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="delete-org-confirm">
            Type <span className="font-semibold text-foreground">{churchName}</span> to confirm
          </Label>
          <Input id="delete-org-confirm" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} autoComplete="off" />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" disabled={!matches || isPending} onClick={onConfirm}>
            {isPending ? 'Deleting…' : 'Delete organization'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
