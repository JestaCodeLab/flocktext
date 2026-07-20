import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export function DeleteSenderIdDialog({
  target,
  onOpenChange,
  onConfirm,
  isPending,
}: {
  target: { senderId: string; status: string } | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPending: boolean;
}) {
  const isApproved = target?.status === 'approved';

  return (
    <Dialog open={!!target} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete sender ID "{target?.senderId}"?</DialogTitle>
        </DialogHeader>
        <div className="text-sm text-muted-foreground">
          {isApproved
            ? 'This sender ID is approved and may be in active use. Once removed, sends will use another approved sender ID, or the platform default if none remain.'
            : 'This will remove the sender ID from your organization.'}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" disabled={isPending} onClick={onConfirm}>
            {isPending ? 'Removing…' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
