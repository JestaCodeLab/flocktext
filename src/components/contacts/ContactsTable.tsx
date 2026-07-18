import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Pencil, Trash2, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EditContactDialog } from '@/components/contacts/EditContactDialog';
import { deleteContact, type Contact } from '@/api/contacts';
import { apiErrorMessage } from '@/api/client';
import { useEntityLabels } from '@/lib/terminology';

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export function ContactsTable({
  contacts,
  isLoading,
  emptyMessage,
}: {
  contacts: Contact[] | undefined;
  isLoading: boolean;
  emptyMessage?: string;
}) {
  const queryClient = useQueryClient();
  const entity = useEntityLabels();
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState<Contact | null>(null);
  const resolvedEmptyMessage = emptyMessage ?? `No ${entity.plural} yet.`;

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['contacts'] });
    queryClient.invalidateQueries({ queryKey: ['groups'] });
    queryClient.invalidateQueries({ queryKey: ['group-detail'] });
  }

  const removeContact = useMutation({
    mutationFn: deleteContact,
    onSuccess: () => {
      setConfirmingDelete(null);
      invalidate();
      toast.success(`${entity.singularCap} deleted.`);
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Groups</TableHead>
            <TableHead>Added</TableHead>
            <TableHead className="w-0">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading &&
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell colSpan={5} className="py-3">
                  <Skeleton className="h-5 w-full" />
                </TableCell>
              </TableRow>
            ))}
          {contacts?.map((c) => (
            <TableRow key={c.id}>
              <TableCell className="font-semibold">
                <div className="flex items-center gap-2.5">
                  <Avatar size="sm">
                    <AvatarFallback className="bg-chart-4/15 text-chart-4 font-semibold">{getInitials(c.name)}</AvatarFallback>
                  </Avatar>
                  {c.name}
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">{c.phone}</TableCell>
              <TableCell className="text-muted-foreground">{c.groupsText || '—'}</TableCell>
              <TableCell className="text-muted-foreground">
                {new Date(c.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-0.5">
                  <Button size="icon-sm" variant="ghost" className="text-chart-3 hover:text-chart-3" onClick={() => setEditingContact(c)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon-sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setConfirmingDelete(c)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {!isLoading && contacts?.length === 0 && (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={5} className="py-10">
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <Users className="h-5 w-5" />
                  </div>
                  <div className="text-sm text-muted-foreground">{resolvedEmptyMessage}</div>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

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
    </div>
  );
}
