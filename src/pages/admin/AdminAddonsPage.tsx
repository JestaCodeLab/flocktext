import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, TriangleAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MobileList, MobileListCard, MobileListEmpty, MobileListRow } from '@/components/admin/MobileRecordList';
import {
  fetchAdminAddons,
  createAddon,
  updateAddon,
  type AddonCreatePayload,
  type AddonUpdatePayload,
} from '@/api/adminAddons';
import { apiErrorMessage } from '@/api/client';
import type { AdminAddon } from '@/types/admin';

const emptyForm: AddonUpdatePayload = { ghs: 0, description: '', active: true };
const emptyCreateForm: AddonCreatePayload = { name: '', description: '', ghs: 0, active: true };

export function AdminAddonsPage() {
  const queryClient = useQueryClient();
  const addons = useQuery({ queryKey: ['admin-addons'], queryFn: fetchAdminAddons });

  const [editing, setEditing] = useState<AdminAddon | null>(null);
  const [form, setForm] = useState<AddonUpdatePayload>(emptyForm);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState<AddonCreatePayload>(emptyCreateForm);

  function openEdit(addon: AdminAddon) {
    setEditing(addon);
    setForm({ ghs: addon.ghs, description: addon.description, active: addon.active });
  }

  const save = useMutation({
    mutationFn: () => updateAddon(editing!.id, form),
    onSuccess: () => {
      toast.success('Addon updated.');
      setEditing(null);
      queryClient.invalidateQueries({ queryKey: ['admin-addons'] });
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const create = useMutation({
    mutationFn: () => createAddon(createForm),
    onSuccess: (addon) => {
      toast.success(`"${addon.name}" created.`);
      setShowCreate(false);
      setCreateForm(emptyCreateForm);
      queryClient.invalidateQueries({ queryKey: ['admin-addons'] });
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="text-[26px] font-extrabold">Addons</div>
        <Button
          onClick={() => {
            setCreateForm(emptyCreateForm);
            setShowCreate(true);
          }}
        >
          <Plus className="h-4 w-4" /> Create addon
        </Button>
      </div>
      <div className="mb-5 text-sm text-muted-foreground">
        Configure pricing for paid features. Organizations pay once via Paystack to unlock each addon.
      </div>

      <MobileList>
        {addons.data?.map((addon) => (
          <MobileListCard key={addon.id}>
            <div className="mb-2 flex items-start justify-between gap-2">
              <span className="font-semibold">{addon.name}</span>
              <Button size="icon-sm" variant="ghost" className="shrink-0" onClick={() => openEdit(addon)}>
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
            <div className="mb-2 text-sm text-muted-foreground">{addon.description}</div>
            <MobileListRow label="Price" value={`GHS ${addon.ghs}`} />
            <MobileListRow
              label="Status"
              value={<Badge variant={addon.active ? 'default' : 'secondary'}>{addon.active ? 'active' : 'inactive'}</Badge>}
            />
          </MobileListCard>
        ))}
      </MobileList>
      {addons.data?.length === 0 && <MobileListEmpty>No addons yet.</MobileListEmpty>}

      <div className="hidden overflow-hidden rounded-xl border border-border bg-card md:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary hover:bg-secondary">
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Price (GHS)</TableHead>
              <TableHead>Status</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {addons.data?.map((addon) => (
              <TableRow key={addon.id}>
                <TableCell className="font-semibold">{addon.name}</TableCell>
                <TableCell className="max-w-md text-muted-foreground">{addon.description}</TableCell>
                <TableCell className="text-muted-foreground">GHS {addon.ghs}</TableCell>
                <TableCell>
                  <Badge variant={addon.active ? 'default' : 'secondary'}>{addon.active ? 'active' : 'inactive'}</Badge>
                </TableCell>
                <TableCell>
                  <Button size="icon-sm" variant="ghost" onClick={() => openEdit(addon)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit {editing?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="addon-description">Description</Label>
              <Input
                id="addon-description"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="addon-ghs">Price (GHS)</Label>
              <Input
                id="addon-ghs"
                type="number"
                value={form.ghs || ''}
                onChange={(e) => setForm((f) => ({ ...f, ghs: Number(e.target.value) }))}
              />
            </div>
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={form.active ?? true}
                onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
              />
              Active (purchasable by organizations)
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button disabled={save.isPending || !form.ghs} onClick={() => save.mutate()}>
              {save.isPending ? 'Saving…' : 'Save changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create addon</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 p-3 text-xs text-warning">
              <TriangleAlert className="h-3.5 w-3.5 shrink-0" />
              <div>
                This creates a purchasable catalog entry only. Unlike Birthday Automation or Extra Team Seat, it won't
                automatically unlock any feature — someone still needs to add the code that checks for it.
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-addon-name">Name</Label>
              <Input
                id="new-addon-name"
                value={createForm.name}
                onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Priority Support"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-addon-description">Description</Label>
              <Textarea
                id="new-addon-description"
                value={createForm.description}
                onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="What the organization is paying for."
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-addon-ghs">Price (GHS)</Label>
              <Input
                id="new-addon-ghs"
                type="number"
                value={createForm.ghs || ''}
                onChange={(e) => setCreateForm((f) => ({ ...f, ghs: Number(e.target.value) }))}
              />
            </div>
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={createForm.active ?? true}
                onChange={(e) => setCreateForm((f) => ({ ...f, active: e.target.checked }))}
              />
              Active (purchasable by organizations)
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button disabled={create.isPending || !createForm.name.trim() || !createForm.ghs} onClick={() => create.mutate()}>
              {create.isPending ? 'Creating…' : 'Create addon'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
