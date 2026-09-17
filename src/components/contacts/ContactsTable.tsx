import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronRight, Pencil, Trash2, UserMinus, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EditContactDialog } from '@/components/contacts/EditContactDialog';
import { ContactDetailDialog } from '@/components/contacts/ContactDetailDialog';
import { ImportGroupPrompt } from '@/components/contacts/ImportGroupPrompt';
import { deleteContact, bulkDeleteContacts, removeContactsFromGroup, type Contact } from '@/api/contacts';
import { apiErrorMessage } from '@/api/client';
import { useEntityLabels } from '@/lib/terminology';
import { getInitials, displayName } from '@/lib/name';

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-10 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Users className="h-5 w-5" />
      </div>
      <div className="text-sm text-muted-foreground">{message}</div>
    </div>
  );
}

export function ContactsTable({
  contacts,
  isLoading,
  emptyMessage,
  groupId,
}: {
  contacts: Contact[] | undefined;
  isLoading: boolean;
  emptyMessage?: string;
  /** When set, the table is rendered in the context of this group and offers a "remove from group" action alongside edit/delete. */
  groupId?: string;
}) {
  const queryClient = useQueryClient();
  const entity = useEntityLabels();
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState<Contact | null>(null);
  const [viewingContact, setViewingContact] = useState<Contact | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmingBulkDelete, setConfirmingBulkDelete] = useState(false);
  const [showGroupPrompt, setShowGroupPrompt] = useState(false);
  const resolvedEmptyMessage = emptyMessage ?? `No ${entity.plural} yet.`;

  // Selection is scoped to whatever page/list is currently rendered - paging, searching,
  // or a bulk action completing all swap `contacts` for a new array, at which point any
  // previously selected ids may no longer be visible, so the selection resets with it.
  useEffect(() => {
    setSelectedIds(new Set());
    setShowGroupPrompt(false);
  }, [contacts]);

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['contacts'] });
    queryClient.invalidateQueries({ queryKey: ['groups'] });
    queryClient.invalidateQueries({ queryKey: ['group-detail'] });
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelectedIds((prev) => {
      if (!contacts?.length) return prev;
      const allSelected = contacts.every((c) => prev.has(c.id));
      return allSelected ? new Set() : new Set(contacts.map((c) => c.id));
    });
  }

  const allSelected = !!contacts?.length && contacts.every((c) => selectedIds.has(c.id));
  const someSelected = selectedIds.size > 0 && !allSelected;

  // Hides the Name column entirely rather than rendering a page of "—" - e.g. an org
  // that only ever imports phone numbers has no use for it. Defaults to shown while
  // loading, since there's no data yet to judge by.
  const showNameColumn = isLoading || !!contacts?.some((c) => displayName(c.name, c.phone));
  const columnCount = showNameColumn ? 6 : 5;

  const removeContact = useMutation({
    mutationFn: deleteContact,
    onSuccess: () => {
      setConfirmingDelete(null);
      invalidate();
      toast.success(`${entity.singularCap} deleted.`);
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const bulkDelete = useMutation({
    mutationFn: () => bulkDeleteContacts(Array.from(selectedIds)),
    onSuccess: (result) => {
      setConfirmingBulkDelete(false);
      setSelectedIds(new Set());
      invalidate();
      toast.success(`Deleted ${result.deleted} ${result.deleted === 1 ? entity.singular : entity.plural}.`);
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const removeFromGroup = useMutation({
    mutationFn: (contactId: string) => removeContactsFromGroup(groupId!, [contactId]),
    onSuccess: () => {
      setViewingContact(null);
      invalidate();
      toast.success(`${entity.singularCap} removed from group.`);
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const bulkRemoveFromGroup = useMutation({
    mutationFn: () => removeContactsFromGroup(groupId!, Array.from(selectedIds)),
    onSuccess: (result) => {
      setSelectedIds(new Set());
      invalidate();
      toast.success(`Removed ${result.removed} ${result.removed === 1 ? entity.singular : entity.plural} from group.`);
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      {/* Desktop/tablet: full table with inline edit/delete actions. */}
      <div className="hidden sm:block">
        {selectedIds.size > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-secondary/40 px-4 py-2.5">
            <div className="text-sm font-semibold">{selectedIds.size} selected</div>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}>
                Clear
              </Button>
              {groupId ? (
                <Button size="sm" variant="outline" disabled={bulkRemoveFromGroup.isPending} onClick={() => bulkRemoveFromGroup.mutate()}>
                  <UserMinus className="h-3.5 w-3.5" />
                  {bulkRemoveFromGroup.isPending ? 'Removing…' : 'Remove from group'}
                </Button>
              ) : (
                <>
                  <Button size="sm" variant="outline" onClick={() => setShowGroupPrompt((v) => !v)}>
                    <Users className="h-3.5 w-3.5" /> Add to group
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => setConfirmingBulkDelete(true)}>
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
        {showGroupPrompt && !groupId && (
          <div className="border-b border-border px-4 pb-4">
            <ImportGroupPrompt
              contactIds={Array.from(selectedIds)}
              onDone={() => {
                setShowGroupPrompt(false);
                setSelectedIds(new Set());
              }}
            />
          </div>
        )}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-0">
                <Checkbox checked={allSelected} indeterminate={someSelected} onCheckedChange={toggleSelectAll} aria-label={`Select all ${entity.plural}`} />
              </TableHead>
              <TableHead className="text-[13px]">Phone</TableHead>
              {showNameColumn && <TableHead className="text-[13px]">Name</TableHead>}
              <TableHead className="text-[13px]">Groups</TableHead>
              <TableHead className="text-[13px]">Added</TableHead>
              <TableHead className="w-0 text-[13px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={columnCount} className="py-3">
                    <Skeleton className="h-5 w-full" />
                  </TableCell>
                </TableRow>
              ))}
            {contacts?.map((c) => (
              <TableRow key={c.id} data-state={selectedIds.has(c.id) ? 'selected' : undefined}>
                <TableCell>
                  <Checkbox checked={selectedIds.has(c.id)} onCheckedChange={() => toggleSelect(c.id)} aria-label={`Select ${c.name}`} />
                </TableCell>
                <TableCell className="font-semibold">{c.phone}</TableCell>
                {showNameColumn && (
                  <TableCell className="text-muted-foreground">
                    {displayName(c.name, c.phone) ? (
                      <div className="flex items-center gap-2.5">
                        <Avatar size="sm">
                          <AvatarFallback className="bg-chart-4/15 text-chart-4 font-semibold">{getInitials(c.name)}</AvatarFallback>
                        </Avatar>
                        {c.name}
                      </div>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                )}
                <TableCell className="text-muted-foreground">{c.groupsText || '—'}</TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(c.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-0.5">
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <Button size="icon-sm" variant="ghost" className="text-chart-3 hover:text-chart-3" onClick={() => setEditingContact(c)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        }
                      />
                      <TooltipContent>Edit</TooltipContent>
                    </Tooltip>
                    {groupId && (
                      <Tooltip>
                        <TooltipTrigger
                          render={
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              disabled={removeFromGroup.isPending}
                              onClick={() => removeFromGroup.mutate(c.id)}
                            >
                              <UserMinus className="h-3.5 w-3.5" />
                            </Button>
                          }
                        />
                        <TooltipContent>Remove from group</TooltipContent>
                      </Tooltip>
                    )}
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <Button size="icon-sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setConfirmingDelete(c)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        }
                      />
                      <TooltipContent>Delete</TooltipContent>
                    </Tooltip>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {!isLoading && contacts?.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={columnCount} className="py-10">
                  <EmptyState message={resolvedEmptyMessage} />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile: tappable list, row opens ContactDetailDialog for edit/delete. */}
      <div className="divide-y divide-border sm:hidden">
        {isLoading &&
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-3.5 py-3">
              <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        {contacts?.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setViewingContact(c)}
            className="flex w-full items-center gap-3 px-3.5 py-3 text-left active:bg-secondary/60"
          >
            {displayName(c.name, c.phone) && (
              <Avatar size="sm">
                <AvatarFallback className="bg-chart-4/15 text-chart-4 font-semibold">{getInitials(c.name)}</AvatarFallback>
              </Avatar>
            )}
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">{c.phone}</div>
              {showNameColumn && (
                <div className="truncate text-xs text-muted-foreground">{displayName(c.name, c.phone) || '—'}</div>
              )}
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          </button>
        ))}
        {!isLoading && contacts?.length === 0 && <EmptyState message={resolvedEmptyMessage} />}
      </div>

      <ContactDetailDialog
        contact={viewingContact}
        onOpenChange={(open) => !open && setViewingContact(null)}
        onEdit={(c) => {
          setViewingContact(null);
          setEditingContact(c);
        }}
        onDelete={(c) => {
          setViewingContact(null);
          setConfirmingDelete(c);
        }}
        onRemoveFromGroup={groupId ? (c) => removeFromGroup.mutate(c.id) : undefined}
      />

      <EditContactDialog
        contact={editingContact}
        onOpenChange={(open) => !open && setEditingContact(null)}
        onUpdated={() => {
          setEditingContact(null);
          invalidate();
        }}
      />

      <Dialog open={!!confirmingDelete} onOpenChange={(open) => !open && setConfirmingDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete "{confirmingDelete?.name}"?</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-muted-foreground">This permanently removes the {entity.singular} and cannot be undone.</div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmingDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={removeContact.isPending}
              onClick={() => confirmingDelete && removeContact.mutate(confirmingDelete.id)}
            >
              Delete {entity.singular}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmingBulkDelete} onOpenChange={setConfirmingBulkDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Delete {selectedIds.size} {selectedIds.size === 1 ? entity.singular : entity.plural}?
            </DialogTitle>
          </DialogHeader>
          <div className="text-sm text-muted-foreground">This permanently removes them and cannot be undone.</div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmingBulkDelete(false)}>
              Cancel
            </Button>
            <Button variant="destructive" disabled={bulkDelete.isPending} onClick={() => bulkDelete.mutate()}>
              {bulkDelete.isPending ? 'Deleting…' : `Delete ${selectedIds.size}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
