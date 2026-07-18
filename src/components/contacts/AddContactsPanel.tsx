import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Search, Users, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DialogFooter } from '@/components/ui/dialog';
import { CsvImportPanel } from '@/components/contacts/CsvImportPanel';
import { addContactsToGroup, fetchContacts } from '@/api/contacts';
import { apiErrorMessage } from '@/api/client';
import { cn } from '@/lib/utils';
import { useEntityLabels } from '@/lib/terminology';

export function AddContactsPanel({
  groupId,
  existingMemberIds,
  onAdded,
  onFinish,
  finishLabel = 'Skip',
}: {
  groupId: string;
  existingMemberIds?: Set<string>;
  onAdded?: () => void;
  onFinish: () => void;
  finishLabel?: string;
}) {
  const entity = useEntityLabels();
  const [mode, setMode] = useState<'select' | 'import'>('select');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const contacts = useQuery({
    queryKey: ['contacts', search],
    queryFn: () => fetchContacts(search || undefined),
    enabled: mode === 'select',
  });

  const availableContacts = useMemo(
    () => (contacts.data ?? []).filter((c) => !existingMemberIds?.has(c.id)),
    [contacts.data, existingMemberIds]
  );

  const addStep = useMutation({
    mutationFn: () => addContactsToGroup(groupId, Array.from(selectedIds)),
    onSuccess: (result) => {
      if (result.added > 0) toast.success(`Added ${result.added} ${result.added === 1 ? entity.singular : entity.plural}.`);
      onAdded?.();
      onFinish();
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  function toggleContact(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setMode('select')}
          className={cn(
            'flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors',
            mode === 'select' ? 'border-primary bg-accent/40 text-foreground' : 'border-border text-muted-foreground hover:text-foreground'
          )}
        >
          <Users className="h-4 w-4" /> Select existing
        </button>
        <button
          type="button"
          onClick={() => setMode('import')}
          className={cn(
            'flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors',
            mode === 'import' ? 'border-primary bg-accent/40 text-foreground' : 'border-border text-muted-foreground hover:text-foreground'
          )}
        >
          <Upload className="h-4 w-4" /> Import from file
        </button>
      </div>

      {mode === 'select' ? (
        <>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={`Search ${entity.plural}…`}
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="max-h-[280px] overflow-auto rounded-lg border border-border">
            {contacts.isLoading && <div className="p-4 text-sm text-muted-foreground">Loading {entity.plural}…</div>}
            {!contacts.isLoading && availableContacts.length === 0 && (
              <div className="p-4 text-sm text-muted-foreground">No {entity.plural} found.</div>
            )}
            {availableContacts.map((c) => (
              <label
                key={c.id}
                className="flex cursor-pointer items-center gap-3 border-b border-border px-3.5 py-2.5 last:border-b-0 hover:bg-secondary/60"
              >
                <Checkbox checked={selectedIds.has(c.id)} onCheckedChange={() => toggleContact(c.id)} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{c.name}</div>
                  <div className="truncate text-xs text-muted-foreground">{c.phone}</div>
                </div>
              </label>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={onFinish}>
              {finishLabel}
            </Button>
            <Button disabled={addStep.isPending || selectedIds.size === 0} onClick={() => addStep.mutate()}>
              {addStep.isPending
                ? 'Adding…'
                : `Add ${selectedIds.size} ${selectedIds.size === 1 ? entity.singular : entity.plural}`}
            </Button>
          </DialogFooter>
        </>
      ) : (
        <>
          <CsvImportPanel groupId={groupId} onImported={() => onAdded?.()} />
          <DialogFooter>
            <Button className="w-full" variant="outline" onClick={onFinish}>
              Done
            </Button>
          </DialogFooter>
        </>
      )}
    </>
  );
}
