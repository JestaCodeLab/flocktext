import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil } from 'lucide-react';
import toast from 'react-hot-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { fetchAdminAddons, updateAddon, type AddonUpdatePayload } from '@/api/adminAddons';
import { apiErrorMessage } from '@/api/client';
import type { AdminAddon } from '@/types/admin';

const emptyForm: AddonUpdatePayload = { ghs: 0, description: '', active: true };

export function AdminAddonsPage() {
  const queryClient = useQueryClient();
  const addons = useQuery({ queryKey: ['admin-addons'], queryFn: fetchAdminAddons });

  const [editing, setEditing] = useState<AdminAddon | null>(null);
  const [form, setForm] = useState<AddonUpdatePayload>(emptyForm);

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

  return (
    <div>
      <div className="mb-6 text-[26px] font-extrabold">Addons</div>
      <div className="mb-5 text-sm text-muted-foreground">
        Configure pricing for paid features. Organizations pay once via Paystack to unlock each addon.
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
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
    </div>
  );
}
