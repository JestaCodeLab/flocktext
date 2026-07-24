import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Ban, CheckCircle2, Send, X, RefreshCw, ShieldCheck, Plus, Users as UsersIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RejectSenderIdDialog } from '@/components/admin/RejectSenderIdDialog';
import { AdminAddUserDialog } from '@/components/admin/AdminAddUserDialog';
import { DeleteOrganizationDialog } from '@/components/admin/DeleteOrganizationDialog';
import {
  fetchAdminOrganizationDetail,
  updateAdminOrganizationProfile,
  suspendOrganization,
  reactivateOrganization,
  adjustOrganizationWallet,
  deleteOrganization,
} from '@/api/adminOrganizations';
import { registerSenderId, approveSenderId, rejectSenderId, checkBmsStatus } from '@/api/adminSenderIds';
import { apiErrorMessage } from '@/api/client';
import { senderIdStatusLabel, senderIdStatusVariant } from '@/lib/senderIdStatus';
import type { AdminSenderId } from '@/types/admin';

function DetailSkeleton() {
  return (
    <div>
      <Skeleton className="mb-4 h-4 w-40" />
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="mt-2 h-4 w-32" />
        </div>
        <Skeleton className="h-9 w-28" />
      </div>
      <div className="mb-6 grid grid-cols-4 gap-3.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[84px] rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  );
}

export function AdminOrganizationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const detail = useQuery({
    queryKey: ['admin-org-detail', id],
    queryFn: () => fetchAdminOrganizationDetail(id!),
    enabled: !!id,
    retry: false,
  });

  const [profileForm, setProfileForm] = useState({ churchName: '', address: '', contactEmail: '' });
  const [walletCredits, setWalletCredits] = useState('');
  const [walletReason, setWalletReason] = useState('');
  const [rejectTarget, setRejectTarget] = useState<AdminSenderId | null>(null);
  const [showAddUser, setShowAddUser] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

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

  const register = useMutation({
    mutationFn: (senderIdId: string) => registerSenderId(id!, senderIdId),
    onSuccess: () => {
      toast.success('Submitted to BMS Africa for registration.');
      invalidate();
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not register this sender ID with BMS Africa.')),
  });

  const approve = useMutation({
    mutationFn: (senderIdId: string) => approveSenderId(id!, senderIdId),
    onSuccess: () => {
      toast.success('Sender ID approved.');
      invalidate();
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const reject = useMutation({
    mutationFn: (reason: string) => rejectSenderId(id!, rejectTarget!.id, reason),
    onSuccess: () => {
      toast.success('Rejected.');
      setRejectTarget(null);
      invalidate();
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const syncBms = useMutation({
    mutationFn: (senderIdId: string) => checkBmsStatus(id!, senderIdId),
    onSuccess: () => invalidate(),
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const remove = useMutation({
    mutationFn: (confirmChurchName: string) => deleteOrganization(id!, confirmChurchName),
    onSuccess: () => {
      toast.success('Organization deleted.');
      queryClient.invalidateQueries({ queryKey: ['admin-organizations'] });
      navigate('/admin/organizations');
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  if (detail.isLoading) return <DetailSkeleton />;

  if (detail.isError || !detail.data) {
    return (
      <div>
        <Link to="/admin/organizations" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to organizations
        </Link>
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border p-14 text-center">
          <div className="text-sm font-semibold">Organization not found.</div>
          <div className="text-sm text-muted-foreground">It may have been deleted or the link is incorrect.</div>
        </div>
      </div>
    );
  }

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
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {org.senderIds.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-semibold">{s.senderId}</TableCell>
                <TableCell className="max-w-[220px] text-muted-foreground">{s.purpose || '—'}</TableCell>
                <TableCell>
                  <Badge variant={senderIdStatusVariant[s.status]}>{senderIdStatusLabel[s.status]}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{s.bmsStatus || '—'}</TableCell>
                <TableCell>
                  {s.status === 'pending_review' && (
                    <Button size="sm" disabled={register.isPending} onClick={() => register.mutate(s.id)}>
                      <Send className="h-3.5 w-3.5" /> Register
                    </Button>
                  )}
                  {s.status === 'processing' && (
                    <div className="flex items-center gap-1.5">
                      <Button size="sm" variant="outline" disabled={syncBms.isPending} onClick={() => syncBms.mutate(s.id)}>
                        <RefreshCw className="h-3.5 w-3.5" /> Check BMS status
                      </Button>
                      <Button size="sm" disabled={approve.isPending} onClick={() => approve.mutate(s.id)}>
                        <ShieldCheck className="h-3.5 w-3.5" /> Approve
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => setRejectTarget(s)}>
                        <X className="h-3.5 w-3.5" /> Reject
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {org.senderIds.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-6 text-center text-muted-foreground">
                  No sender IDs submitted yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="mb-3 flex items-center justify-between">
        <div className="text-[13px] font-bold text-foreground/80">Users</div>
        <Button size="sm" onClick={() => setShowAddUser(true)}>
          <Plus className="h-3.5 w-3.5" /> Add user
        </Button>
      </div>
      <div className="mb-6 overflow-hidden rounded-xl border border-border bg-card">
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
            {org.users.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <UsersIcon className="h-5 w-5 text-muted-foreground" />
                    No team members yet.
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="rounded-xl border border-destructive/30 bg-card p-5">
        <div className="mb-1 text-[13px] font-bold text-destructive">Danger zone</div>
        <div className="mb-4 text-sm text-muted-foreground">
          Permanently delete this organization and all of its data. This cannot be undone.
        </div>
        <Button variant="destructive" onClick={() => setShowDelete(true)}>
          Delete organization
        </Button>
      </div>

      <RejectSenderIdDialog
        target={rejectTarget}
        onOpenChange={(open) => !open && setRejectTarget(null)}
        onConfirm={(reason) => reject.mutate(reason)}
        isPending={reject.isPending}
      />
      <AdminAddUserDialog orgId={id!} open={showAddUser} onOpenChange={setShowAddUser} />
      <DeleteOrganizationDialog
        org={{
          churchName: org.churchName,
          userCount: org.users.length,
          contactsCount: org.contactsCount,
          messagesTotal: org.messagesTotal,
          walletBalanceCredits: org.walletBalanceCredits,
        }}
        open={showDelete}
        onOpenChange={setShowDelete}
        onConfirm={() => remove.mutate(org.churchName)}
        isPending={remove.isPending}
      />
    </div>
  );
}
