import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Ban, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  fetchAdminOrganizationDetail,
  updateAdminOrganizationProfile,
  suspendOrganization,
  reactivateOrganization,
  adjustOrganizationWallet,
} from '@/api/adminOrganizations';
import { apiErrorMessage } from '@/api/client';

export function AdminOrganizationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const detail = useQuery({
    queryKey: ['admin-org-detail', id],
    queryFn: () => fetchAdminOrganizationDetail(id!),
    enabled: !!id,
  });

  const [profileForm, setProfileForm] = useState({ churchName: '', address: '', contactEmail: '' });
  const [walletCredits, setWalletCredits] = useState('');
  const [walletReason, setWalletReason] = useState('');

  useEffect(() => {
    if (detail.data) {
      setProfileForm({
        churchName: detail.data.churchName,
        address: detail.data.address,
        contactEmail: detail.data.contactEmail,
      });
    }
  }, [detail.data]);

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['admin-org-detail', id] });
    queryClient.invalidateQueries({ queryKey: ['admin-organizations'] });
  }

  const saveProfile = useMutation({
    mutationFn: () => updateAdminOrganizationProfile(id!, profileForm),
    onSuccess: () => {
      toast.success('Organization profile updated.');
      invalidate();
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const toggleSuspend = useMutation({
    mutationFn: () => (detail.data?.status === 'active' ? suspendOrganization(id!) : reactivateOrganization(id!)),
    onSuccess: (data) => {
      toast.success(data.status === 'suspended' ? 'Organization suspended.' : 'Organization reactivated.');
      invalidate();
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const adjustWallet = useMutation({
    mutationFn: () => adjustOrganizationWallet(id!, { credits: Number(walletCredits), reason: walletReason }),
    onSuccess: () => {
      toast.success('Wallet adjusted.');
      setWalletCredits('');
      setWalletReason('');
      invalidate();
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  if (!detail.data) return null;
  const org = detail.data;

  return (
    <div>
      <Link to="/admin/organizations" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to organizations
      </Link>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2.5 text-[26px] font-extrabold">
            {org.churchName || 'Untitled organization'}
            <Badge variant={org.status === 'active' ? 'default' : 'destructive'}>{org.status}</Badge>
          </div>
          <div className="mt-0.5 text-sm text-muted-foreground">Joined {new Date(org.createdAt).toLocaleDateString()}</div>
        </div>
        <Button
          variant={org.status === 'active' ? 'destructive' : 'default'}
          disabled={toggleSuspend.isPending}
          onClick={() => toggleSuspend.mutate()}
        >
          {org.status === 'active' ? (
            <>
              <Ban className="h-4 w-4" /> Suspend
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4" /> Reactivate
            </>
          )}
        </Button>
      </div>

      <div className="mb-6 grid grid-cols-4 gap-3.5">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground">Wallet balance</div>
          <div className="mt-1 text-xl font-extrabold">{org.walletBalanceCredits.toLocaleString()} credits</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground">Contacts</div>
          <div className="mt-1 text-xl font-extrabold">{org.contactsCount}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground">Messages sent this month</div>
          <div className="mt-1 text-xl font-extrabold">{org.sentThisMonth}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground">Messages all-time</div>
          <div className="mt-1 text-xl font-extrabold">{org.messagesTotal}</div>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-3.5 text-[13px] font-bold text-foreground/80">Organization profile</div>
          <div className="mb-3 space-y-1.5">
            <Label htmlFor="org-church">Church name</Label>
            <Input
              id="org-church"
              value={profileForm.churchName}
              onChange={(e) => setProfileForm((f) => ({ ...f, churchName: e.target.value }))}
            />
          </div>
          <div className="mb-3 space-y-1.5">
            <Label htmlFor="org-addr">Address</Label>
            <Input
              id="org-addr"
              value={profileForm.address}
              onChange={(e) => setProfileForm((f) => ({ ...f, address: e.target.value }))}
            />
          </div>
          <div className="mb-4 space-y-1.5">
            <Label htmlFor="org-email">Contact email</Label>
            <Input
              id="org-email"
              value={profileForm.contactEmail}
              onChange={(e) => setProfileForm((f) => ({ ...f, contactEmail: e.target.value }))}
            />
          </div>
          <Button disabled={saveProfile.isPending} onClick={() => saveProfile.mutate()}>
            {saveProfile.isPending ? 'Saving…' : 'Save profile'}
          </Button>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-3.5 text-[13px] font-bold text-foreground/80">Adjust wallet</div>
          <div className="mb-3 space-y-1.5">
            <Label htmlFor="adj-credits">Credits (negative to debit)</Label>
            <Input id="adj-credits" type="number" value={walletCredits} onChange={(e) => setWalletCredits(e.target.value)} />
          </div>
          <div className="mb-4 space-y-1.5">
            <Label htmlFor="adj-reason">Reason</Label>
            <Input id="adj-reason" placeholder="Goodwill credit, correcting a failed payment…" value={walletReason} onChange={(e) => setWalletReason(e.target.value)} />
          </div>
          <Button
            disabled={adjustWallet.isPending || !walletCredits || !walletReason}
            onClick={() => adjustWallet.mutate()}
          >
            {adjustWallet.isPending ? 'Applying…' : 'Apply adjustment'}
          </Button>
        </div>
      </div>

      <div className="mb-3 text-[13px] font-bold text-foreground/80">Sender IDs</div>
      <div className="mb-6 overflow-hidden rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary hover:bg-secondary">
              <TableHead>Sender ID</TableHead>
              <TableHead>Purpose</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>BMS status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {org.senderIds.map((s) => (
              <TableRow key={s.senderId}>
                <TableCell className="font-semibold">{s.senderId}</TableCell>
                <TableCell className="text-muted-foreground">{s.purpose || '—'}</TableCell>
                <TableCell className="text-muted-foreground">{s.status}</TableCell>
                <TableCell className="text-muted-foreground">{s.bmsStatus || '—'}</TableCell>
              </TableRow>
            ))}
            {org.senderIds.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="py-6 text-center text-muted-foreground">
                  No sender IDs submitted yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="mb-3 text-[13px] font-bold text-foreground/80">Users</div>
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary hover:bg-secondary">
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Verified</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {org.users.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-semibold">{u.name}</TableCell>
                <TableCell className="text-muted-foreground">{u.phone}</TableCell>
                <TableCell className="text-muted-foreground">{u.email}</TableCell>
                <TableCell className="text-muted-foreground">{u.role}</TableCell>
                <TableCell className="text-muted-foreground">{u.isVerified ? 'Yes' : 'No'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
