import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Pencil, Trash2, UserPlus, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ContactsTable } from '@/components/contacts/ContactsTable';
import { AddContactsToGroupDialog } from '@/components/contacts/AddContactsToGroupDialog';
import { fetchGroupDetail, updateGroup, deleteGroup } from '@/api/contacts';
import { apiErrorMessage } from '@/api/client';
import { useEntityLabels } from '@/lib/terminology';

export function GroupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const entity = useEntityLabels();
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [showAddContacts, setShowAddContacts] = useState(false);

  const detail = useQuery({
    queryKey: ['group-detail', id],
    queryFn: () => fetchGroupDetail(id!),
    enabled: !!id,
  });

  const renameGroup = useMutation({
    mutationFn: (name: string) => updateGroup(id!, name),
    onSuccess: () => {
      setEditing(false);
      queryClient.invalidateQueries({ queryKey: ['group-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      toast.success('Group renamed.');
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const removeGroup = useMutation({
    mutationFn: () => deleteGroup(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast.success('Group deleted.');
      navigate('/app/contacts/groups');
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  function startEditing() {
    setEditValue(detail.data?.name ?? '');
    setEditing(true);
  }

  function commitEdit() {
    const trimmed = editValue.trim();
    if (!trimmed) return;
    renameGroup.mutate(trimmed);
  }

  const existingMemberIds = useMemo(() => new Set((detail.data?.members ?? []).map((c) => c.id)), [detail.data?.members]);

  function invalidateDetail() {
    queryClient.invalidateQueries({ queryKey: ['group-detail', id] });
    queryClient.invalidateQueries({ queryKey: ['groups'] });
  }

  return (
    <div>
      <Link to="/app/contacts/groups" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Groups
      </Link>

      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {editing ? (
            <>
              <Input
                autoFocus
                className="h-auto w-64 py-1 text-[26px] font-extrabold"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitEdit();
                  if (e.key === 'Escape') setEditing(false);
                }}
              />
              <Button size="icon-sm" variant="ghost" className="text-success hover:text-success" disabled={renameGroup.isPending} onClick={commitEdit}>
                <Check className="h-4 w-4" />
              </Button>
              <Button size="icon-sm" variant="ghost" onClick={() => setEditing(false)}>
                <X className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <div className="text-[26px] font-extrabold">{detail.data?.name ?? '—'}</div>
              <Button size="icon-sm" variant="ghost" onClick={startEditing}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
        </div>
        <div className="flex items-center gap-2.5">
          <Button onClick={() => setShowAddContacts(true)}>
            <UserPlus className="h-[15px] w-[15px]" /> Add {entity.singular}
          </Button>
          <Button variant="destructive" onClick={() => setConfirmingDelete(true)}>
            <Trash2 className="h-[15px] w-[15px]" /> Delete
          </Button>
        </div>
      </div>
      <div className="mb-4.5 text-sm text-muted-foreground">
        {detail.data?.count ?? 0} {detail.data?.count === 1 ? entity.singular : entity.plural}
      </div>

      <ContactsTable
        contacts={detail.data?.members}
        isLoading={detail.isLoading}
        emptyMessage={`No ${entity.plural} in this group yet.`}
      />

      {id && (
        <AddContactsToGroupDialog
          open={showAddContacts}
          onOpenChange={setShowAddContacts}
          groupId={id}
          groupName={detail.data?.name ?? ''}
          existingMemberIds={existingMemberIds}
          onAdded={invalidateDetail}
        />
      )}

      <Dialog open={confirmingDelete} onOpenChange={setConfirmingDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete "{detail.data?.name}"?</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-muted-foreground">
            This removes the group. Its {entity.plural} will stay in your {entity.plural} list, just no longer grouped here.
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmingDelete(false)}>
              Cancel
            </Button>
            <Button variant="destructive" disabled={removeGroup.isPending} onClick={() => removeGroup.mutate()}>
              Delete group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
