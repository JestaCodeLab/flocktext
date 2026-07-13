import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AddContactsPanel } from '@/components/contacts/AddContactsPanel';
import { createGroup, type Group } from '@/api/contacts';
import { apiErrorMessage } from '@/api/client';
import { cn } from '@/lib/utils';

function Stepper({ step }: { step: 1 | 2 }) {
  return (
    <div className="mb-1 flex items-center gap-2">
      <div className="flex items-center gap-1.5">
        <div
          className={cn(
            'flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold',
            step > 1 ? 'bg-primary text-primary-foreground' : 'bg-accent text-accent-foreground'
          )}
        >
          {step > 1 ? <Check className="h-3 w-3" /> : 1}
        </div>
        <span className={cn('text-xs font-semibold', step === 1 ? 'text-foreground' : 'text-muted-foreground')}>Create group</span>
      </div>
      <div className="h-px w-6 bg-border" />
      <div className="flex items-center gap-1.5">
        <div
          className={cn(
            'flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold',
            step === 2 ? 'bg-accent text-accent-foreground' : 'bg-secondary text-muted-foreground'
          )}
        >
          2
        </div>
        <span className={cn('text-xs font-semibold', step === 2 ? 'text-foreground' : 'text-muted-foreground')}>Add contacts</span>
      </div>
    </div>
  );
}

export function CreateGroupDialog({
  open,
  onOpenChange,
  onDone,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone?: () => void;
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [createdGroup, setCreatedGroup] = useState<Group | null>(null);

  function reset() {
    setName('');
    setCreatedGroup(null);
  }

  function invalidateGroup() {
    queryClient.invalidateQueries({ queryKey: ['groups'] });
    queryClient.invalidateQueries({ queryKey: ['group-detail', createdGroup?.id] });
  }

  const createStep = useMutation({
    mutationFn: createGroup,
    onSuccess: (group) => {
      setCreatedGroup(group);
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  function finish() {
    onOpenChange(false);
    reset();
    onDone?.();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) reset();
      }}
    >
      <DialogContent className={createdGroup ? 'sm:max-w-lg' : undefined}>
        <Stepper step={createdGroup ? 2 : 1} />

        {!createdGroup ? (
          <>
            <DialogHeader>
              <DialogTitle>New group</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="group-name">Group name</Label>
              <Input
                id="group-name"
                autoFocus
                placeholder="e.g. Youth ministry"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && name.trim()) createStep.mutate(name.trim());
                }}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button disabled={createStep.isPending || !name.trim()} onClick={() => createStep.mutate(name.trim())}>
                {createStep.isPending ? 'Creating…' : 'Continue'}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Add contacts to "{createdGroup.name}"</DialogTitle>
            </DialogHeader>
            <AddContactsPanel groupId={createdGroup.id} onAdded={invalidateGroup} onFinish={finish} finishLabel="Skip" />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
