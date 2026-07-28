import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export function DeleteSenderIdPermanentlyDialog({
  target,
  onOpenChange,
  onConfirm,
  isPending,
}: {
  target: { senderId: string } | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPending: boolean;
}) {
  return (
    <Dialog open={!!target} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Permanently delete "{target?.senderId}"?</DialogTitle>
        </DialogHeader>
        <div className="text-sm text-muted-foreground">
          This removes the record outright rather than just hiding it — it won't be recoverable with Restore afterward. Make
          sure it's already been deregistered on BMS Africa's own dashboard first (there's no API for that), since this only
          cleans up FlockText's own record of it.
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" disabled={isPending} onClick={onConfirm}>
            {isPending ? 'Deleting…' : 'Permanently delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
