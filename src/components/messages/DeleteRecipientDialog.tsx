import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// Shared by both the org self-service and admin delivery detail pages - confirms
// removing a single skipped/failed/rejected recipient row from a message's report
// (see messageController.removeRecipient - list-cleanup only, nothing financial).
export function DeleteRecipientDialog({
  open,
  onOpenChange,
  recipientName,
  onConfirm,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipientName?: string;
  onConfirm: () => void;
  isPending: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remove {recipientName || 'this contact'}?</DialogTitle>
        </DialogHeader>
        <div className="text-sm text-muted-foreground">
          This removes {recipientName || 'this contact'} from the recipient list for this message. This cannot be undone.
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" disabled={isPending} onClick={onConfirm}>
            {isPending ? 'Removing…' : 'Remove'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
