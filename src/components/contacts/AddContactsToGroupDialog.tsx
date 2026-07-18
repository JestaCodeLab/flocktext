import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AddContactsPanel } from '@/components/contacts/AddContactsPanel';
import { useEntityLabels } from '@/lib/terminology';

export function AddContactsToGroupDialog({
  open,
  onOpenChange,
  groupId,
  groupName,
  existingMemberIds,
  onAdded,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  groupName: string;
  existingMemberIds?: Set<string>;
  onAdded?: () => void;
}) {
  const entity = useEntityLabels();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Add {entity.plural} to "{groupName}"
          </DialogTitle>
        </DialogHeader>
        <AddContactsPanel
          groupId={groupId}
          existingMemberIds={existingMemberIds}
          onAdded={onAdded}
          onFinish={() => onOpenChange(false)}
          finishLabel="Close"
        />
      </DialogContent>
    </Dialog>
  );
}
