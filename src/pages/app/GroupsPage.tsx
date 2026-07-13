import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Search, Users, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CreateGroupDialog } from '@/components/contacts/CreateGroupDialog';
import { fetchGroups, updateGroup, deleteGroup, type Group } from '@/api/contacts';
import { apiErrorMessage } from '@/api/client';
import { cn } from '@/lib/utils';

export function GroupsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [confirmingDelete, setConfirmingDelete] = useState<Group | null>(null);

  const groups = useQuery({ queryKey: ['groups'], queryFn: fetchGroups });

  const filtered = useMemo(() => {
    if (!search.trim()) return groups.data ?? [];
    const q = search.trim().toLowerCase();
    return (groups.data ?? []).filter((g) => g.name.toLowerCase().includes(q));
  }, [groups.data, search]);

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['groups'] });
  }

  const renameGroup = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => updateGroup(id, name),
    onSuccess: () => {
      setEditingId(null);
      invalidate();
      toast.success('Group renamed.');
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const removeGroup = useMutation({
    mutationFn: deleteGroup,
    onSuccess: () => {
      setConfirmingDelete(null);
      invalidate();
      toast.success('Group deleted.');
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  function startEditing(group: Group) {
    setEditingId(group.id);
    setEditValue(group.name);
  }

  function commitEdit(id: string) {
    const trimmed = editValue.trim();
    if (!trimmed) return;
    renameGroup.mutate({ id, name: trimmed });
  }

  function getInitials(name: string) {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  const AVATAR_COLORS = ['bg-chart-2/15 text-chart-2', 'bg-chart-3/15 text-chart-3', 'bg-chart-4/15 text-chart-4', 'bg-chart-5/15 text-chart-5'];

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <div className="text-[26px] font-extrabold">Groups</div>
          <div className="mt-0.5 text-sm text-muted-foreground">{groups.data?.length ?? 0} groups</div>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-[15px] w-[15px]" /> New group
        </Button>
      </div>

      <div className="mb-4.5 flex items-center gap-2.5">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search groups…"
            className="pl-10"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') setSearch(searchInput);
            }}
          />
        </div>
        <Button variant="outline" onClick={() => setSearch(searchInput)}>
          <Search className="h-[15px] w-[15px]" /> Search
        </Button>
        {search && (
          <Button
            variant="ghost"
            onClick={() => {
              setSearch('');
              setSearchInput('');
            }}
          >
            <X className="h-[15px] w-[15px]" /> Reset
          </Button>
        )}
      </div>

      {!groups.isLoading && filtered.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-10 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Users className="h-5 w-5" />
          </div>
          <div className="text-sm text-muted-foreground">
            {search ? 'No groups match your search.' : 'No groups yet. Create one to get started.'}
          </div>
        </div>
      )}

      <div className="grid grid-cols-4 gap-4">
        {filtered.map((g, i) => (
          <div
            key={g.id}
            className="group relative flex flex-col gap-3 rounded-2xl border-2 border-border bg-card p-4.5 transition-colors hover:border-stat-highlight"
          >
            <div className="flex items-start justify-between gap-2">
              <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[15px] font-bold', AVATAR_COLORS[i % AVATAR_COLORS.length])}>
                {getInitials(g.name)}
              </div>
              {editingId === g.id ? (
                <div className="flex shrink-0 items-center gap-0.5">
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    className="text-success hover:text-success"
                    disabled={renameGroup.isPending}
                    onClick={(e) => {
                      e.preventDefault();
                      commitEdit(g.id);
                    }}
                  >
                    <Check className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.preventDefault();
                      setEditingId(null);
                    }}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    className="text-chart-3 hover:text-chart-3"
                    onClick={(e) => {
                      e.preventDefault();
                      startEditing(g);
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={(e) => {
                      e.preventDefault();
                      setConfirmingDelete(g);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>

            {editingId === g.id ? (
              <Input
                autoFocus
                className="h-8 text-sm"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onClick={(e) => e.preventDefault()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitEdit(g.id);
                  if (e.key === 'Escape') setEditingId(null);
                }}
              />
            ) : (
              <div>
                <Link to={`/app/contacts/groups/${g.id}`} className="block truncate text-[15px] font-bold hover:text-primary">
                  {g.name}
                </Link>
                <Link to={`/app/contacts/groups/${g.id}`} className="text-xs text-muted-foreground hover:text-foreground">
                  {g.count} contact{g.count === 1 ? '' : 's'}
                </Link>
              </div>
            )}
          </div>
        ))}
      </div>

      <CreateGroupDialog open={showCreate} onOpenChange={setShowCreate} onDone={invalidate} />

      <Dialog open={!!confirmingDelete} onOpenChange={(open) => !open && setConfirmingDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete "{confirmingDelete?.name}"?</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-muted-foreground">
            This removes the group. Its {confirmingDelete?.count ?? 0} contact{confirmingDelete?.count === 1 ? '' : 's'} will stay in your
            contacts list, just no longer grouped here.
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmingDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={removeGroup.isPending}
              onClick={() => confirmingDelete && removeGroup.mutate(confirmingDelete.id)}
            >
              Delete group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
