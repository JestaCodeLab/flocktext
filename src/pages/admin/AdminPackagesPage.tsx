import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Radio, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { StatCard } from '@/components/admin/StatCard';
import {
  fetchAdminPackages,
  createPackage,
  updatePackage,
  deletePackage,
  fetchBmsCredit,
  refreshBmsCredit,
  type PackagePayload,
} from '@/api/adminPackages';
import { apiErrorMessage } from '@/api/client';
import type { AdminPackage } from '@/types/admin';

const emptyForm: PackagePayload = { ghs: 0, credits: 0, label: '', badge: '', active: true, sortOrder: 0 };

export function AdminPackagesPage() {
  const queryClient = useQueryClient();
  const packages = useQuery({ queryKey: ['admin-packages'], queryFn: fetchAdminPackages });
  const bmsCredit = useQuery({ queryKey: ['admin-bms-credit'], queryFn: fetchBmsCredit });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AdminPackage | null>(null);
  const [form, setForm] = useState<PackagePayload>(emptyForm);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(pkg: AdminPackage) {
    setEditing(pkg);
    setForm({ ghs: pkg.ghs, credits: pkg.credits, label: pkg.label, badge: pkg.badge, active: pkg.active, sortOrder: pkg.sortOrder });
    setOpen(true);
  }

  const save = useMutation({
    mutationFn: () => (editing ? updatePackage(editing.id, form) : createPackage(form)),
    onSuccess: () => {
      toast.success(editing ? 'Package updated.' : 'Package created.');
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-packages'] });
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deletePackage(id),
    onSuccess: () => {
      toast.success('Package deleted.');
      queryClient.invalidateQueries({ queryKey: ['admin-packages'] });
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const refresh = useMutation({
    mutationFn: refreshBmsCredit,
    onSuccess: () => {
      toast.success('Balance refreshed from BMS Africa.');
      queryClient.invalidateQueries({ queryKey: ['admin-bms-credit'] });
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  return (
    <div>
      <div className="mb-6 text-[26px] font-extrabold">SMS credit packages</div>

      <div className="mb-6 flex max-w-md items-end gap-3">
        <div className="flex-1">
          <StatCard
            icon={Radio}
            tone={bmsCredit.data?.balance == null ? 'warning' : 'default'}
            label={
              bmsCredit.data?.updatedAt
                ? `System's BMS Africa balance · updated ${new Date(bmsCredit.data.updatedAt).toLocaleString()}`
                : "System's BMS Africa balance · no sends recorded yet"
            }
            value={bmsCredit.data?.balance != null ? `${bmsCredit.data.balance} credits` : '—'}
          />
        </div>
        <Button variant="outline" disabled={refresh.isPending} onClick={() => refresh.mutate()}>
          <RefreshCw className="h-4 w-4" /> {refresh.isPending ? 'Checking…' : 'Refresh from BMS'}
        </Button>
      </div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <div className="text-[13px] font-bold text-foreground/80">Merchant-facing packages</div>
          <div className="mt-0.5 text-sm text-muted-foreground">{packages.data?.length ?? 0} packages</div>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-[15px] w-[15px]" /> New package
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary hover:bg-secondary">
              <TableHead>Label</TableHead>
              <TableHead>GHS</TableHead>
              <TableHead>Credits</TableHead>
              <TableHead>Badge</TableHead>
              <TableHead>Status</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {packages.data?.map((pkg) => (
              <TableRow key={pkg.id}>
                <TableCell className="font-semibold">{pkg.label}</TableCell>
                <TableCell className="text-muted-foreground">GHS {pkg.ghs}</TableCell>
                <TableCell className="text-muted-foreground">{pkg.credits}</TableCell>
                <TableCell className="text-muted-foreground">{pkg.badge || '—'}</TableCell>
                <TableCell>
                  <Badge variant={pkg.active ? 'default' : 'secondary'}>{pkg.active ? 'active' : 'inactive'}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <Button size="icon-sm" variant="ghost" onClick={() => openEdit(pkg)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon-sm" variant="ghost" onClick={() => remove.mutate(pkg.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit package' : 'New package'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="pkg-label">Label</Label>
              <Input id="pkg-label" value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="pkg-ghs">Amount (GHS)</Label>
                <Input
                  id="pkg-ghs"
                  type="number"
                  value={form.ghs || ''}
                  onChange={(e) => setForm((f) => ({ ...f, ghs: Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pkg-credits">Credits</Label>
                <Input
                  id="pkg-credits"
                  type="number"
                  value={form.credits || ''}
                  onChange={(e) => setForm((f) => ({ ...f, credits: Number(e.target.value) }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="pkg-badge">Badge (optional)</Label>
                <Input
                  id="pkg-badge"
                  placeholder="Most popular"
                  value={form.badge}
                  onChange={(e) => setForm((f) => ({ ...f, badge: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pkg-sort">Sort order</Label>
                <Input
                  id="pkg-sort"
                  type="number"
                  value={form.sortOrder ?? 0}
                  onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))}
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={form.active ?? true}
                onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
              />
              Active (visible to merchants)
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button disabled={save.isPending || !form.label || !form.ghs || !form.credits} onClick={() => save.mutate()}>
              {save.isPending ? 'Saving…' : editing ? 'Save changes' : 'Create package'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
