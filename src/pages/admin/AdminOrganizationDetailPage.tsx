import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowLeft,
  Ban,
  BadgeCheck,
  BarChart3,
  CheckCircle2,
  CircleCheck,
  KeyRound,
  MessageSquareText,
  MoreVertical,
  Pencil,
  Rocket,
  RotateCcw,
  Send,
  Trash2,
  UserPlus,
  X,
  RefreshCw,
  ShieldCheck,
  Plus,
  Users as UsersIcon,
  Globe,
  Smartphone,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { RejectSenderIdDialog } from '@/components/admin/RejectSenderIdDialog';
import { EditSenderIdDialog, type EditSenderIdTarget } from '@/components/admin/EditSenderIdDialog';
import { EditHubtelCredentialsDialog, type EditHubtelCredentialsTarget } from '@/components/admin/EditHubtelCredentialsDialog';
import { AdminAddUserDialog } from '@/components/admin/AdminAddUserDialog';
import { EditOrgUserDialog } from '@/components/admin/EditOrgUserDialog';
import { DeleteOrgUserDialog } from '@/components/admin/DeleteOrgUserDialog';
import { DeleteOrganizationDialog } from '@/components/admin/DeleteOrganizationDialog';
import { DeleteSenderIdPermanentlyDialog } from '@/components/admin/DeleteSenderIdPermanentlyDialog';
import { SendOrgSmsDialog } from '@/components/admin/SendOrgSmsDialog';
import { SendVerificationReminderDialog } from '@/components/admin/SendVerificationReminderDialog';
import { OrgProgressTimeline, type OrgProgressStep } from '@/components/admin/OrgProgressTimeline';
import {
  fetchAdminOrganizationDetail,
  updateAdminOrganizationProfile,
  suspendOrganization,
  reactivateOrganization,
  adjustOrganizationWallet,
  deleteOrganization,
  deleteOrganizationUser,
  sendVerificationReminder,
} from '@/api/adminOrganizations';
import {
  registerSenderId,
  markSenderIdRegistered,
  approveSenderId,
  rejectSenderId,
  editSenderId,
  checkBmsStatus,
  restoreSenderId,
  permanentlyDeleteSenderId,
  updateHubtelCredentials,
} from '@/api/adminSenderIds';
import { apiErrorMessage } from '@/api/client';
import { senderIdStatusLabel, senderIdStatusVariant } from '@/lib/senderIdStatus';
import type { AdminSenderId, AdminOrgUser } from '@/types/admin';

type OrgTabKey = 'sender-ids' | 'users' | 'danger-zone';

const ORG_TABS: { key: OrgTabKey; label: string; icon: LucideIcon }[] = [
  { key: 'users', label: 'Users', icon: UsersIcon },
  { key: 'sender-ids', label: 'Sender IDs', icon: BadgeCheck },
  { key: 'danger-zone', label: 'Danger Zone', icon: AlertTriangle },
];

const TRIGGER_CLASS = 'data-active:text-primary data-active:font-bold data-active:after:bg-primary';

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
  const [permanentDeleteTarget, setPermanentDeleteTarget] = useState<AdminSenderId | null>(null);
  const [editTarget, setEditTarget] = useState<EditSenderIdTarget | null>(null);
  const [hubtelTarget, setHubtelTarget] = useState<EditHubtelCredentialsTarget | null>(null);
  const [showAddUser, setShowAddUser] = useState(false);
  const [editUserTarget, setEditUserTarget] = useState<AdminOrgUser | null>(null);
  const [deleteUserTarget, setDeleteUserTarget] = useState<AdminOrgUser | null>(null);
  const [verificationReminderTarget, setVerificationReminderTarget] = useState<AdminOrgUser | null>(null);
  const [showDelete, setShowDelete] = useState(false);
  const [showSendSms, setShowSendSms] = useState(false);

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

  const saveHubtel = useMutation({
    mutationFn: ({ clientId, clientSecret }: { clientId: string; clientSecret: string }) =>
      updateHubtelCredentials(id!, hubtelTarget!.senderIdId, { clientId, clientSecret }),
    onSuccess: () => {
      toast.success('Hubtel credentials saved.');
      setHubtelTarget(null);
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

  const markRegistered = useMutation({
    mutationFn: (senderIdId: string) => markSenderIdRegistered(id!, senderIdId),
    onSuccess: () => {
      toast.success('Marked as already registered with BMS Africa.');
      invalidate();
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
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

  const edit = useMutation({
    mutationFn: ({ senderId, purpose }: { senderId: string; purpose: string }) =>
      editSenderId(id!, editTarget!.senderIdId, { senderId, purpose }),
    onSuccess: () => {
      toast.success('Sender ID updated and resubmitted for review.');
      setEditTarget(null);
      invalidate();
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const syncBms = useMutation({
    mutationFn: (senderIdId: string) => checkBmsStatus(id!, senderIdId),
    onSuccess: () => invalidate(),
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const restore = useMutation({
    mutationFn: (senderIdId: string) => restoreSenderId(id!, senderIdId),
    onSuccess: () => {
      toast.success('Sender ID restored — the organization can send with it again.');
      invalidate();
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const permanentlyDelete = useMutation({
    mutationFn: () => permanentlyDeleteSenderId(id!, permanentDeleteTarget!.id),
    onSuccess: () => {
      toast.success('Sender ID permanently deleted.');
      setPermanentDeleteTarget(null);
      invalidate();
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const removeUser = useMutation({
    mutationFn: () => deleteOrganizationUser(id!, deleteUserTarget!.id),
    onSuccess: () => {
      toast.success(`${deleteUserTarget?.name} removed.`);
      setDeleteUserTarget(null);
      invalidate();
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const sendVerificationReminderMutation = useMutation({
    mutationFn: () => sendVerificationReminder(id!, verificationReminderTarget!.id),
    onSuccess: () => {
      toast.success(`Verification reminder sent to ${verificationReminderTarget?.name}.`);
      setVerificationReminderTarget(null);
      invalidate();
    },
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

  const firstSenderIdAt = org.senderIds.map((s) => s.createdAt).sort()[0] ?? null;
  // Sender ID comes before Onboarding here, not after - the wizard's own step order is
  // organization profile -> sender ID -> contacts, and onboardingCompletedAt only flips
  // once the *last* step (contacts) is done, so it always lands at or after firstSenderIdAt
  // for anyone following the wizard in order. Ordering these to match keeps someone who's
  // submitted a sender ID but hasn't finished contacts yet from looking like they
  // regressed (Sender ID done, but an earlier-looking "Onboarding" still not).
  const progressSteps: OrgProgressStep[] = [
    { key: 'registered', label: 'Registered', icon: UserPlus, completedAt: org.createdAt },
    { key: 'sender-id', label: 'Sender ID', icon: BadgeCheck, completedAt: firstSenderIdAt },
    { key: 'onboarded', label: 'Onboarding', icon: Rocket, completedAt: org.onboardingCompletedAt },
    { key: 'first-send', label: 'First SMS sent', icon: Send, completedAt: org.firstMessageSentAt },
  ];

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
          <div className="mt-0.5 text-sm text-muted-foreground">
            Joined{' '}
            {new Date(org.createdAt).toLocaleString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
            })}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            title="Refresh"
            disabled={detail.isFetching}
            onClick={() => detail.refetch()}
          >
            <RefreshCw className={`h-4 w-4 ${detail.isFetching ? 'animate-spin' : ''}`} />
          </Button>
          <Button variant="outline" onClick={() => navigate(`/admin/organizations/${id}/delivery-report`)}>
            <BarChart3 className="h-4 w-4" /> Delivery report
          </Button>
          <Button variant="outline" onClick={() => setShowSendSms(true)}>
            <MessageSquareText className="h-4 w-4" /> Send SMS
          </Button>
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

      <div className="mb-6">
        <OrgProgressTimeline steps={progressSteps} />
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

      <Tabs defaultValue="sender-ids">
        <div className="mb-4 overflow-x-auto border-b">
          <TabsList variant="line" className="group-data-[orientation=horizontal]/tabs:h-auto min-w-0 justify-start gap-6 p-0">
            {ORG_TABS.map((tab) => (
              <TabsTrigger key={tab.key} value={tab.key} className={cn('h-auto px-0 py-3', TRIGGER_CLASS)}>
                <tab.icon className="h-3.5 w-3.5" /> {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="sender-ids">
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary hover:bg-secondary">
                  <TableHead>Sender ID</TableHead>
                  <TableHead>Purpose</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>BMS status</TableHead>
                  <TableHead className="w-0">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {org.senderIds.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-semibold">{s.senderId}</TableCell>
                    <TableCell className="w-[220px] text-muted-foreground">
                      {s.purpose ? (
                        <Tooltip>
                          <TooltipTrigger render={<span className="block max-w-[220px] truncate" />}>{s.purpose}</TooltipTrigger>
                          <TooltipContent>{s.purpose}</TooltipContent>
                        </Tooltip>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={senderIdStatusVariant[s.status]}>{senderIdStatusLabel[s.status]}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{s.bmsStatus || '—'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {(s.status === 'processing' || s.status === 'approved') && (
                          <Badge variant={s.hubtelConfigured ? 'default' : 'outline'}>
                            {s.hubtelConfigured ? 'Hubtel configured' : 'Hubtel not configured'}
                          </Badge>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button size="icon-sm" variant="ghost" title="Actions">
                                <MoreVertical className="h-3.5 w-3.5" />
                              </Button>
                            }
                          />
                          <DropdownMenuContent align="end" className="w-56">
                            {s.status === 'pending_review' && (
                              <>
                                <DropdownMenuItem className="cursor-pointer" disabled={register.isPending} onClick={() => register.mutate(s.id)}>
                                  <Send className="h-3.5 w-3.5" /> Register
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="cursor-pointer"
                                  disabled={markRegistered.isPending}
                                  onClick={() => markRegistered.mutate(s.id)}
                                  title="Use if this sender ID was already registered with BMS Africa before this request"
                                >
                                  <CircleCheck className="h-3.5 w-3.5" /> Already registered
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="cursor-pointer"
                                  onClick={() => setEditTarget({ senderIdId: s.id, senderId: s.senderId, purpose: s.purpose })}
                                >
                                  <Pencil className="h-3.5 w-3.5" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem variant="destructive" className="cursor-pointer" onClick={() => setRejectTarget(s)}>
                                  <X className="h-3.5 w-3.5" /> Reject
                                </DropdownMenuItem>
                              </>
                            )}
                            {s.status === 'rejected' && (
                              <DropdownMenuItem
                                className="cursor-pointer"
                                onClick={() => setEditTarget({ senderIdId: s.id, senderId: s.senderId, purpose: s.purpose })}
                              >
                                <Pencil className="h-3.5 w-3.5" /> Edit
                              </DropdownMenuItem>
                            )}
                            {s.status === 'processing' && (
                              <>
                                <DropdownMenuItem className="cursor-pointer" disabled={syncBms.isPending} onClick={() => syncBms.mutate(s.id)}>
                                  <RefreshCw className="h-3.5 w-3.5" /> Check BMS status
                                </DropdownMenuItem>
                                <DropdownMenuItem className="cursor-pointer" disabled={approve.isPending} onClick={() => approve.mutate(s.id)}>
                                  <ShieldCheck className="h-3.5 w-3.5" /> Approve
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="cursor-pointer"
                                  onClick={() => setHubtelTarget({ senderIdId: s.id, senderId: s.senderId, hubtelConfigured: s.hubtelConfigured })}
                                >
                                  <KeyRound className="h-3.5 w-3.5" /> Hubtel credentials
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem variant="destructive" className="cursor-pointer" onClick={() => setRejectTarget(s)}>
                                  <X className="h-3.5 w-3.5" /> Reject
                                </DropdownMenuItem>
                              </>
                            )}
                            {s.status === 'approved' && (
                              <DropdownMenuItem
                                className="cursor-pointer"
                                onClick={() => setHubtelTarget({ senderIdId: s.id, senderId: s.senderId, hubtelConfigured: s.hubtelConfigured })}
                              >
                                <KeyRound className="h-3.5 w-3.5" /> Hubtel credentials
                              </DropdownMenuItem>
                            )}
                            {s.status === 'deleted' && (
                              <>
                                <DropdownMenuItem className="cursor-pointer" disabled={restore.isPending} onClick={() => restore.mutate(s.id)}>
                                  <RotateCcw className="h-3.5 w-3.5" /> Restore
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem variant="destructive" className="cursor-pointer" onClick={() => setPermanentDeleteTarget(s)}>
                                  <Trash2 className="h-3.5 w-3.5" /> Delete permanently
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
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
        </TabsContent>

        <TabsContent value="users">
          <div className="mb-3 flex items-center justify-end">
            <Button size="sm" onClick={() => setShowAddUser(true)}>
              <Plus className="h-3.5 w-3.5" /> Add user
            </Button>
          </div>
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary hover:bg-secondary">
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Verified</TableHead>
                  <TableHead>Registered via</TableHead>
                  <TableHead>Actions</TableHead>
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
                    <TableCell className="text-muted-foreground">
                      <Badge variant="outline" className="gap-1 font-normal">
                        {u.registeredVia === 'mobile' ? (
                          <Smartphone className="h-3 w-3" />
                        ) : (
                          <Globe className="h-3 w-3" />
                        )}
                        {u.registeredVia === 'mobile' ? 'Mobile app' : 'Web'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {!u.isVerified && (
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            title="Send verification reminder SMS"
                            onClick={() => setVerificationReminderTarget(u)}
                          >
                            <Send className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button size="icon-sm" variant="ghost" title="Edit" onClick={() => setEditUserTarget(u)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          className="text-destructive"
                          title="Remove"
                          onClick={() => setDeleteUserTarget(u)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {org.users.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
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
        </TabsContent>

        <TabsContent value="danger-zone">
          <div className="rounded-xl border border-destructive/30 bg-card p-5">
            <div className="mb-1 text-[13px] font-bold text-destructive">Danger zone</div>
            <div className="mb-4 text-sm text-muted-foreground">
              Permanently delete this organization and all of its data. This cannot be undone.
            </div>
            <Button variant="destructive" onClick={() => setShowDelete(true)}>
              Delete organization
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      <EditSenderIdDialog
        target={editTarget}
        onOpenChange={(open) => !open && setEditTarget(null)}
        onConfirm={(senderId, purpose) => edit.mutate({ senderId, purpose })}
        isPending={edit.isPending}
      />
      <RejectSenderIdDialog
        target={rejectTarget}
        onOpenChange={(open) => !open && setRejectTarget(null)}
        onConfirm={(reason) => reject.mutate(reason)}
        isPending={reject.isPending}
      />
      <DeleteSenderIdPermanentlyDialog
        target={permanentDeleteTarget}
        onOpenChange={(open) => !open && setPermanentDeleteTarget(null)}
        onConfirm={() => permanentlyDelete.mutate()}
        isPending={permanentlyDelete.isPending}
      />
      <EditHubtelCredentialsDialog
        target={hubtelTarget}
        onOpenChange={(open) => !open && setHubtelTarget(null)}
        onConfirm={(clientId, clientSecret) => saveHubtel.mutate({ clientId, clientSecret })}
        isPending={saveHubtel.isPending}
      />
      <AdminAddUserDialog orgId={id!} open={showAddUser} onOpenChange={setShowAddUser} />
      <EditOrgUserDialog orgId={id!} target={editUserTarget} onOpenChange={(open) => !open && setEditUserTarget(null)} />
      <DeleteOrgUserDialog
        target={deleteUserTarget}
        onOpenChange={(open) => !open && setDeleteUserTarget(null)}
        onConfirm={() => removeUser.mutate()}
        isPending={removeUser.isPending}
      />
      <SendVerificationReminderDialog
        target={verificationReminderTarget}
        onOpenChange={(open) => !open && setVerificationReminderTarget(null)}
        onConfirm={() => sendVerificationReminderMutation.mutate()}
        isPending={sendVerificationReminderMutation.isPending}
      />
      <SendOrgSmsDialog
        orgId={id!}
        churchName={org.churchName || 'this organization'}
        admins={org.users.filter((u) => u.role === 'admin')}
        open={showSendSms}
        onOpenChange={setShowSendSms}
      />
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
