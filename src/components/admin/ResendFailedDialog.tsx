import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export function ResendFailedDialog({
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
          <DialogTitle>Resend to rejected recipients?</DialogTitle>
        </DialogHeader>
        <div className="text-sm text-muted-foreground">
          This sends a fresh SMS to every recipient who was rejected on this message (never accepted by the SMS provider) and bills the
          organization&apos;s wallet again.
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
