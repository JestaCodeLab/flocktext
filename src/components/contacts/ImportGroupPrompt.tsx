import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { FolderPlus, Users, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createGroup, fetchGroups, addContactsToGroup } from '@/api/contacts';
import { apiErrorMessage } from '@/api/client';
import { useEntityLabels } from '@/lib/terminology';

type Mode = 'choice' | 'create' | 'existing';

// Shown after a successful import that wasn't already scoped to a group (see
// ImportContactsWizard), and reused as the bulk "add to group" action from the
// contacts table's multi-select toolbar (see ContactsTable) - grouping contacts
// right away is what makes them easy to select as one audience later when
// sending an SMS.
export function ImportGroupPrompt({ contactIds, onDone }: { contactIds: string[]; onDone: () => void }) {
  const entity = useEntityLabels();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<Mode>('choice');
  const [name, setName] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [addedTo, setAddedTo] = useState<string | null>(null);

  const groups = useQuery({ queryKey: ['groups'], queryFn: fetchGroups, enabled: mode === 'existing' });

  function afterAdd(groupName: string) {
    // Assigning a group changes each contact's own `groups`/`groupsText`, so the
    // contacts list (wherever it's rendered) needs to refetch too, not just ['groups'].
    queryClient.invalidateQueries({ queryKey: ['groups'] });
    queryClient.invalidateQueries({ queryKey: ['contacts'] });
    queryClient.invalidateQueries({ queryKey: ['group-detail'] });
    setAddedTo(groupName);
    toast.success(`Added to "${groupName}".`);
  }

  const createAndAssign = useMutation({
    mutationFn: async () => {
      const group = await createGroup(name.trim());
      await addContactsToGroup(group.id, contactIds);
      return group;
    },
    onSuccess: (group) => afterAdd(group.name),
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const assignExisting = useMutation({
    mutationFn: () => addContactsToGroup(selectedGroupId, contactIds),
    onSuccess: () => afterAdd(groups.data?.find((g) => g.id === selectedGroupId)?.name ?? 'the group'),
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  if (addedTo) {
    return (
      <div className="mt-4 flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 p-4 text-sm font-medium text-success">
        <Check className="h-4 w-4 shrink-0" />
        Added to "{addedTo}" — ready to message as a group.
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-xl border border-border bg-secondary/30 p-4">
      <div className="mb-1 text-sm font-semibold">Add to a group</div>
      <div className="mb-3 text-sm text-muted-foreground">
        Group these {entity.plural} together so they're easy to select as one audience when you send an SMS.
      </div>

      {mode === 'choice' && (
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setMode('create')}
            className="flex items-center gap-2.5 rounded-lg border border-border bg-card px-4 py-3 text-left text-sm font-semibold transition-colors hover:border-primary/50 hover:bg-accent/30"
          >
            <FolderPlus className="h-4 w-4 shrink-0 text-muted-foreground" />
            Create a new group
          </button>
          <button
            type="button"
            onClick={() => setMode('existing')}
            className="flex items-center gap-2.5 rounded-lg border border-border bg-card px-4 py-3 text-left text-sm font-semibold transition-colors hover:border-primary/50 hover:bg-accent/30"
          >
            <Users className="h-4 w-4 shrink-0 text-muted-foreground" />
            Add to existing group
          </button>
        </div>
      )}

      {mode === 'create' && (
        <div className="flex flex-col gap-2.5 sm:flex-row">
          <Input
            autoFocus
            placeholder="e.g. New members"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && name.trim()) createAndAssign.mutate();
            }}
            className="flex-1"
          />
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setMode('choice')} disabled={createAndAssign.isPending}>
              Back
            </Button>
            <Button disabled={!name.trim() || createAndAssign.isPending} onClick={() => createAndAssign.mutate()}>
              {createAndAssign.isPending ? 'Adding…' : 'Create & add'}
            </Button>
          </div>
        </div>
      )}

      {mode === 'existing' && (
        <div>
          {!groups.isLoading && groups.data?.length === 0 ? (
            <div className="text-sm text-muted-foreground">No groups yet — create one instead.</div>
          ) : (
            <Select
              value={selectedGroupId}
              onValueChange={(value) => setSelectedGroupId(value ?? '')}
              items={(groups.data ?? []).map((g) => ({ value: g.id, label: g.name }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={groups.isLoading ? 'Loading groups…' : 'Choose a group…'} />
              </SelectTrigger>
              <SelectContent>
                {groups.data?.map((g) => (
                  <SelectItem key={g.id} value={g.id} className="cursor-pointer">
                    {g.name} ({g.count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <div className="mt-2.5 flex gap-2">
            <Button variant="outline" onClick={() => setMode('choice')} disabled={assignExisting.isPending}>
              Back
            </Button>
            <Button disabled={!selectedGroupId || assignExisting.isPending} onClick={() => assignExisting.mutate()}>
              {assignExisting.isPending ? 'Adding…' : 'Add to group'}
            </Button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={onDone}
        className="mt-3 text-xs font-medium text-muted-foreground hover:text-foreground"
      >
        Skip for now
      </button>
    </div>
  );
}
