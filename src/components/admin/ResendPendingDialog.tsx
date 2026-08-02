import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export function ResendPendingDialog({
  open,
  onOpenChange,
  onConfirm,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPending: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Resend to pending recipients?</DialogTitle>
        </DialogHeader>
        <div className="text-sm text-muted-foreground">
          This sends a fresh SMS to every recipient still pending on this message and bills the organization&apos;s wallet
          again.
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={isPending} onClick={onConfirm}>
            {isPending ? 'Resending…' : 'Resend'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
