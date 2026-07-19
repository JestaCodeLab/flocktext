import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Building2,
  UserRound,
  BadgeCheck,
  Bell,
  Users,
  ShieldCheck,
  Plus,
  Star,
  Trash2,
  UserPlus,
  Sun,
  Moon,
  Monitor,
  PaintBucket,
  Info,
  KeyRound,
  Copy,
  Church,
  Briefcase,
  Landmark,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PasswordInput } from '@/components/ui/password-input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AddSenderIdDialog } from '@/components/organization/AddSenderIdDialog';
import { InviteTeamMemberDialog } from '@/components/organization/InviteTeamMemberDialog';
import { LowBalanceThresholdDialog } from '@/components/organization/LowBalanceThresholdDialog';
import { updateOrganizationProfile, updateNotifPrefs, setPrimarySenderId, deleteSenderId } from '@/api/organization';
import { updateMe, changePassword } from '@/api/auth';
import { fetchTeam, updateTeamMemberRole, removeTeamMember } from '@/api/team';
import { fetchApiKeys, createApiKey, revokeApiKey } from '@/api/developer';
import { initializeAddonPurchase, verifyAddonPurchase } from '@/api/addons';
import { apiErrorMessage } from '@/api/client';
import { openPaystackPopup } from '@/lib/paystack';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore, type ThemeMode } from '@/store/themeStore';
import { senderIdStatusLabel, senderIdStatusVariant } from '@/lib/senderIdStatus';
import { cn } from '@/lib/utils';
import { useEntityLabels, type OrganizationType } from '@/lib/terminology';
import { useAddonEntitlements } from '@/lib/addons';

type Tint = 'primary' | 'blue' | 'violet' | 'gold' | 'teal' | 'green' | 'neutral';

const TINT_CLASS: Record<Tint, string> = {
  primary: 'bg-primary/15 text-primary',
  blue: 'bg-chart-3/15 text-chart-3',
  violet: 'bg-chart-4/15 text-chart-4',
  gold: 'bg-chart-1/15 text-chart-1',
  teal: 'bg-chart-5/15 text-chart-5',
  green: 'bg-chart-2/15 text-chart-2',
  neutral: 'bg-muted text-muted-foreground',
};

const THEME_OPTIONS: { mode: ThemeMode; label: string; icon: LucideIcon }[] = [
  { mode: 'light', label: 'Light', icon: Sun },
  { mode: 'dark', label: 'Dark', icon: Moon },
  { mode: 'system', label: 'System', icon: Monitor },
];

type SectionKey = 'account' | 'preferences' | 'sender-ids' | 'notifications' | 'team' | 'developer' | 'security';

const SECTIONS: { key: SectionKey; label: string; icon: LucideIcon; tint: Tint }[] = [
  { key: 'account', label: 'Account', icon: Building2, tint: 'primary' },
  { key: 'preferences', label: 'Preferences', icon: PaintBucket, tint: 'violet' },
  { key: 'sender-ids', label: 'Sender IDs', icon: BadgeCheck, tint: 'gold' },
  { key: 'notifications', label: 'Notifications', icon: Bell, tint: 'teal' },
  { key: 'team', label: 'Team', icon: Users, tint: 'green' },
  { key: 'developer', label: 'Developer', icon: KeyRound, tint: 'blue' },
  { key: 'security', label: 'Security', icon: ShieldCheck, tint: 'neutral' },
];

function SettingsCard({
  icon: Icon,
  title,
  description,
  action,
  tint = 'primary',
  className,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  tint?: Tint;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn('rounded-2xl border border-border bg-card p-6', className)}>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', TINT_CLASS[tint])}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[16px] font-bold">{title}</div>
            <div className="mt-0.5 text-[13px] text-muted-foreground">{description}</div>
          </div>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function AccountSection() {
  const organization = useAuthStore((s) => s.session?.organization);
  const updateOrganization = useAuthStore((s) => s.updateOrganization);
  const user = useAuthStore((s) => s.session?.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const entity = useEntityLabels();

  const [churchName, setChurchName] = useState(organization?.churchName ?? '');
  const [address, setAddress] = useState(organization?.address ?? '');
  const [contactEmail, setContactEmail] = useState(organization?.contactEmail ?? '');

  const saveOrg = useMutation({
    mutationFn: () =>
      updateOrganizationProfile({
        churchName,
        address,
        contactEmail,
        organizationType: organization?.organizationType ?? 'institution',
      }),
    onSuccess: (data) => {
      updateOrganization(data);
      toast.success('Organization profile updated.');
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');

  const saveUser = useMutation({
    mutationFn: () => updateMe({ name, email }),
    onSuccess: (data) => {
      updateUser(data.user);
      toast.success('Account details updated.');
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <SettingsCard
        icon={Building2}
        title="Organization profile"
        description={`Shown across FlockText and to your ${entity.plural}.`}
        tint="primary"
      >
        <div className="space-y-3.5">
          <div className="grid grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <Label htmlFor="settings-church-name">Organization name</Label>
              <Input id="settings-church-name" value={churchName} onChange={(e) => setChurchName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="settings-address">Address</Label>
              <Input id="settings-address" value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="settings-contact-email">Contact email</Label>
            <Input id="settings-contact-email" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
          </div>
          <Button disabled={saveOrg.isPending} onClick={() => saveOrg.mutate()}>
            {saveOrg.isPending ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </SettingsCard>

      <SettingsCard icon={UserRound} title="Your details" description="Your personal name and email on this account." tint="blue">
        <div className="space-y-3.5">
          <div className="grid grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <Label htmlFor="settings-name">Full name</Label>
              <Input id="settings-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="settings-email">Email</Label>
              <Input id="settings-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>
          <Button disabled={saveUser.isPending} onClick={() => saveUser.mutate()}>
            {saveUser.isPending ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </SettingsCard>
    </div>
  );
}

const CATEGORY_OPTIONS: { value: OrganizationType; label: string; description: string; icon: LucideIcon }[] = [
  { value: 'church', label: 'Church', description: 'Contacts are called members', icon: Church },
  { value: 'business', label: 'Business', description: 'Contacts are called customers', icon: Briefcase },
  { value: 'institution', label: 'Institution', description: 'Contacts are called contacts', icon: Landmark },
];

function PreferencesSection() {
  const themeMode = useThemeStore((s) => s.mode);
  const setThemeMode = useThemeStore((s) => s.setMode);
  const organization = useAuthStore((s) => s.session?.organization);
  const updateOrganization = useAuthStore((s) => s.updateOrganization);

  const saveCategory = useMutation({
    mutationFn: (organizationType: OrganizationType) =>
      updateOrganizationProfile({
        churchName: organization?.churchName ?? '',
        address: organization?.address ?? '',
        contactEmail: organization?.contactEmail,
        organizationType,
      }),
    onSuccess: (data) => {
      updateOrganization(data);
      toast.success('Organization category updated.');
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  return (
    <div className="flex flex-col gap-5 lg:flex-row">
      <SettingsCard
        icon={PaintBucket}
        title="Appearance"
        description="Choose how FlockText looks on this device."
        tint="violet"
        className="lg:flex-1"
      >
        <div className="grid grid-cols-3 gap-2">
          {THEME_OPTIONS.map((option) => (
            <button
              key={option.mode}
              type="button"
              onClick={() => setThemeMode(option.mode)}
              className={cn(
                'flex flex-col items-center gap-1.5 rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors',
                themeMode === option.mode
                  ? 'border-primary bg-accent/40 text-foreground'
                  : 'border-border text-muted-foreground hover:text-foreground'
              )}
            >
              <option.icon className="h-4 w-4" />
              {option.label}
            </button>
          ))}
        </div>
      </SettingsCard>

      <SettingsCard
        icon={Landmark}
        title="Organization category"
        description="Configure how FlockText refers to your contacts and members."
        tint="gold"
        className="lg:flex-1"
      >
        <div className="grid grid-cols-3 gap-2.5">
          {CATEGORY_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              disabled={saveCategory.isPending}
              onClick={() => saveCategory.mutate(option.value)}
              className={cn(
                'flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3.5 text-center transition-colors',
                organization?.organizationType === option.value
                  ? 'border-primary bg-accent/40 text-foreground'
                  : 'border-border text-muted-foreground hover:text-foreground'
              )}
            >
              <option.icon className="h-5 w-5" />
              <span className="text-sm font-semibold">{option.label}</span>
              {/* <span className="text-xs leading-snug">{option.description}</span> */}
            </button>
          ))}
        </div>
      </SettingsCard>
    </div>
  );
}

function SenderIdsSection() {
  const organization = useAuthStore((s) => s.session?.organization);
  const updateOrganization = useAuthStore((s) => s.updateOrganization);
  const [showAdd, setShowAdd] = useState(false);
  const senderIds = organization?.senderIds ?? [];
  const hasApproved = senderIds.some((s) => s.status === 'approved');

  const setPrimary = useMutation({
    mutationFn: setPrimarySenderId,
    onSuccess: (data) => {
      updateOrganization(data);
      toast.success('Primary sender ID updated.');
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const remove = useMutation({
    mutationFn: deleteSenderId,
    onSuccess: (data) => {
      updateOrganization(data);
      toast.success('Sender ID removed.');
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  return (
    <>
      <SettingsCard
        icon={BadgeCheck}
        title="Sender IDs"
        description="Register the names your messages send from."
        tint="gold"
        action={
          <Button size="sm" onClick={() => setShowAdd(true)}>
            <Plus className="h-[15px] w-[15px]" /> Add sender ID
          </Button>
        }
      >
        {senderIds.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No sender IDs registered yet.
          </div>
        ) : (
          <>
            {!hasApproved && (
              <div className="mb-4 flex items-start gap-2 rounded-lg border border-border/50 bg-background p-3 text-xs">
                <Info className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="text-muted-foreground">
                  No approved sender ID yet. Until one is approved, your messages send from the platform's default sender ID.
                </div>
              </div>
            )}
            <div className="divide-y divide-border">
              {senderIds.map((s) => (
                <div key={s.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="text-[15px] font-bold">{s.senderId}</div>
                      {s.isPrimary && <Badge>Primary</Badge>}
                      <Badge variant={senderIdStatusVariant[s.status]}>{senderIdStatusLabel[s.status]}</Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      {!s.isPrimary && (
                        <Button size="icon-sm" variant="ghost" disabled={setPrimary.isPending} onClick={() => setPrimary.mutate(s.id)}>
                          <Star className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {s.status !== 'approved' && (
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          className="text-destructive"
                          disabled={remove.isPending}
                          onClick={() => remove.mutate(s.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">{s.purpose}</div>
                  {s.status === 'rejected' && s.rejectionReason && (
                    <div className="mt-2.5 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{s.rejectionReason}</div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </SettingsCard>

      <AddSenderIdDialog open={showAdd} onOpenChange={setShowAdd} />
    </>
  );
}

function NotificationsSection() {
  const organization = useAuthStore((s) => s.session?.organization);
  const updateOrganization = useAuthStore((s) => s.updateOrganization);
  const prefs = organization?.notifPrefs ?? { lowBalance: true, lowBalanceThreshold: 50, scheduleConfirm: true, deliverySummary: false };
  const [showThreshold, setShowThreshold] = useState(false);

  const save = useMutation({
    mutationFn: updateNotifPrefs,
    onSuccess: (data) => updateOrganization(data),
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  type ToggleKey = 'lowBalance' | 'scheduleConfirm' | 'deliverySummary';

  function toggle(key: ToggleKey) {
    save.mutate({ ...prefs, [key]: !prefs[key] });
  }

  const rows: { key: ToggleKey; label: string; description: string }[] = [
    {
      key: 'lowBalance',
      label: 'Low balance alerts',
      description: `Get notified when your SMS credit balance drops below ${prefs.lowBalanceThreshold.toLocaleString()} credits.`,
    },
    { key: 'scheduleConfirm', label: 'Schedule confirmations', description: 'Get notified when a scheduled or recurring send is confirmed.' },
    { key: 'deliverySummary', label: 'Delivery summaries', description: 'Get a summary after each send completes.' },
  ];

  return (
    <>
      <SettingsCard icon={Bell} title="Notifications" description="Choose what FlockText should keep you posted on." tint="teal">
        <div className="divide-y divide-border">
          {rows.map((row) => (
            <div key={row.key} className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
              <div>
                <div className="text-sm font-semibold">{row.label}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">{row.description}</div>
              </div>
              <div className="flex items-center gap-3">
                {row.key === 'lowBalance' && (
                  <Button variant="outline" size="sm" onClick={() => setShowThreshold(true)}>
                    Set limit
                  </Button>
                )}
                <Switch checked={prefs[row.key]} onCheckedChange={() => toggle(row.key)} disabled={save.isPending} />
              </div>
            </div>
          ))}
        </div>
      </SettingsCard>

      <LowBalanceThresholdDialog open={showThreshold} onOpenChange={setShowThreshold} prefs={prefs} />
    </>
  );
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function TeamSection() {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((s) => s.session?.user);
  const isAdmin = currentUser?.role === 'admin';
  const [showInvite, setShowInvite] = useState(false);
  const team = useQuery({ queryKey: ['team'], queryFn: fetchTeam });
  const entitlements = useAddonEntitlements();

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['team'] });
  }

  // The webhook is the authoritative confirmation, but this gives immediate
  // feedback - both paths call the same idempotent credit logic, so whichever
  // lands first wins.
  const verify = useMutation({
    mutationFn: verifyAddonPurchase,
    onSuccess: () => {
      toast.success('Payment confirmed — seat added.');
      queryClient.invalidateQueries({ queryKey: ['addons'] });
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const buySeat = useMutation({
    mutationFn: () => initializeAddonPurchase('extra_team_seat'),
    onSuccess: async (data) => {
      if (data.mode === 'stub') {
        toast.success('Seat added.');
        queryClient.invalidateQueries({ queryKey: ['addons'] });
        return;
      }
      try {
        await openPaystackPopup({
          email: data.email,
          amountGHS: data.amountGHS,
          reference: data.reference,
          subaccountCode: data.subaccountCode,
          metadata: { organizationId: data.organizationId, addonKey: data.addonKey, kind: 'addon' },
          onSuccess: (reference) => verify.mutate(reference),
          onClose: () => toast('Payment cancelled.'),
        });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Could not open checkout.');
      }
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const additionalMemberCount = team.data?.filter((m) => !m.isFounder).length ?? 0;
  const purchasedSeats = entitlements.data?.purchasedSeats ?? 0;
  const remainingSeats = purchasedSeats - additionalMemberCount;
  const seatAddonGhs = entitlements.data?.addons.find((a) => a.key === 'extra_team_seat')?.ghs ?? 0;

  const changeRole = useMutation({
    mutationFn: ({ id, role }: { id: string; role: 'admin' | 'user' }) => updateTeamMemberRole(id, role),
    onSuccess: () => {
      toast.success('Role updated.');
      invalidate();
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const remove = useMutation({
    mutationFn: removeTeamMember,
    onSuccess: () => {
      toast.success('Team member removed.');
      invalidate();
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  return (
    <>
      <SettingsCard
        icon={Users}
        title="Team"
        description={isAdmin ? 'Invite teammates and manage their access.' : 'Everyone with access to this account.'}
        tint="green"
        action={
          isAdmin &&
          (remainingSeats > 0 ? (
            <Button size="sm" onClick={() => setShowInvite(true)}>
              <UserPlus className="h-[15px] w-[15px]" /> Invite
            </Button>
          ) : (
            <Button size="sm" disabled={buySeat.isPending} onClick={() => buySeat.mutate()}>
              <UserPlus className="h-[15px] w-[15px]" /> {buySeat.isPending ? 'Starting checkout…' : `Buy seat — GHS ${seatAddonGhs}`}
            </Button>
          ))
        }
      >
        {isAdmin && (
          <div className="mb-4 text-xs font-semibold text-muted-foreground">
            {remainingSeats > 0
              ? `${remainingSeats} additional seat${remainingSeats === 1 ? '' : 's'} available.`
              : 'No additional seats available — purchase a seat to invite another member.'}
          </div>
        )}
        {team.isLoading && (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        )}
        {team.data && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Role</TableHead>
                {isAdmin && <TableHead className="w-px" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {team.data.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
                        {getInitials(member.name)}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold">{member.name}</div>
                        <div className="truncate text-xs text-muted-foreground">{member.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {isAdmin && member.id !== currentUser?.id ? (
                      <Select value={member.role} onValueChange={(v) => changeRole.mutate({ id: member.id, role: v as 'admin' | 'user' })}>
                        <SelectTrigger size="sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="user">User</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant={member.role === 'admin' ? 'default' : 'secondary'} className="capitalize">
                        {member.role}
                      </Badge>
                    )}
                  </TableCell>
                  {isAdmin && (
                    <TableCell>
                      {member.id !== currentUser?.id && (
                        <Button size="icon-sm" variant="ghost" className="text-destructive" disabled={remove.isPending} onClick={() => remove.mutate(member.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </SettingsCard>

      <InviteTeamMemberDialog open={showInvite} onOpenChange={setShowInvite} />
    </>
  );
}

const API_ENDPOINTS: { method: string; path: string; description: string }[] = [
  { method: 'GET', path: '/v1/wallet/balance', description: 'Check the current SMS credit balance.' },
  { method: 'POST', path: '/v1/wallet/topup', description: 'Start a credit purchase - returns a checkout URL to present to your user.' },
  { method: 'GET', path: '/v1/sender-ids', description: 'List registered sender IDs and their approval status.' },
  { method: 'POST', path: '/v1/sender-ids', description: 'Register a new sender ID for review.' },
  { method: 'POST', path: '/v1/messages/send', description: 'Send an SMS to a phone number, group, or your full contact list.' },
];

function DeveloperSection() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [label, setLabel] = useState('');
  const [revealedKey, setRevealedKey] = useState<string | null>(null);

  const keys = useQuery({ queryKey: ['api-keys'], queryFn: fetchApiKeys });

  const create = useMutation({
    mutationFn: () => createApiKey(label),
    onSuccess: (data) => {
      setShowCreate(false);
      setLabel('');
      setRevealedKey(data.key);
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const revoke = useMutation({
    mutationFn: revokeApiKey,
    onSuccess: () => {
      toast.success('API key revoked.');
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  function copyKey() {
    if (!revealedKey) return;
    navigator.clipboard.writeText(revealedKey);
    toast.success('Copied to clipboard.');
  }

  return (
    <>
      <SettingsCard
        icon={KeyRound}
        title="API keys"
        description="Let your own systems call FlockText directly - check balance, manage sender IDs, and send SMS."
        tint="blue"
        action={
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="h-[15px] w-[15px]" /> Generate new key
          </Button>
        }
      >
        {keys.isLoading && (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        )}
        {keys.data?.length === 0 && (
          <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No API keys yet.
          </div>
        )}
        {!!keys.data?.length && (
          <div className="divide-y divide-border">
            {keys.data.map((k) => (
              <div key={k.id} className="flex items-center justify-between gap-3 py-3.5 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="truncate text-sm font-semibold">{k.label}</div>
                    {k.revoked && (
                      <Badge variant="secondary" className="capitalize">
                        Revoked
                      </Badge>
                    )}
                  </div>
                  <div className="mt-0.5 font-mono text-xs text-muted-foreground">{k.keyPrefix}••••••••</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    Created {new Date(k.createdAt).toLocaleDateString()} · Last used{' '}
                    {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleDateString() : 'never'}
                  </div>
                </div>
                {!k.revoked && (
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    className="shrink-0 text-destructive"
                    disabled={revoke.isPending}
                    onClick={() => revoke.mutate(k.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </SettingsCard>

      <div className="mt-5 rounded-2xl border border-border bg-card p-6">
        <div className="mb-3 text-[13px] font-bold text-foreground/80">Reference</div>
        <div className="mb-4 space-y-1 text-sm">
          <div className="text-muted-foreground">
            Base URL: <span className="font-mono text-foreground">{window.location.origin.replace(/:\d+$/, '')}/api</span>
          </div>
          <div className="text-muted-foreground">
            Auth header: <span className="font-mono text-foreground">Authorization: Bearer &lt;your key&gt;</span>
          </div>
        </div>
        <div className="divide-y divide-border overflow-hidden rounded-lg border border-border">
          {API_ENDPOINTS.map((e) => (
            <div key={e.path} className="flex items-start gap-3 p-3 text-sm">
              <Badge variant="outline" className="mt-0.5 shrink-0 font-mono">
                {e.method}
              </Badge>
              <div className="min-w-0">
                <div className="font-mono text-foreground">{e.path}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">{e.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Generate API key</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="api-key-label">Label</Label>
            <Input
              id="api-key-label"
              placeholder="e.g. Production integration"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button disabled={create.isPending || !label.trim()} onClick={() => create.mutate()}>
              {create.isPending ? 'Generating…' : 'Generate key'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!revealedKey} onOpenChange={(open) => !open && setRevealedKey(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Your new API key</DialogTitle>
          </DialogHeader>
          <div className="flex items-center gap-2 rounded-lg border border-border bg-background p-3">
            <code className="flex-1 overflow-x-auto text-sm">{revealedKey}</code>
            <Button size="icon-sm" variant="ghost" onClick={copyKey}>
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 p-3 text-xs text-warning">
            <Info className="h-4 w-4 shrink-0" />
            <div>Copy this key now - you won't be able to see it again. Store it somewhere safe.</div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRevealedKey(null)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function SecuritySection() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const savePassword = useMutation({
    mutationFn: () => changePassword({ currentPassword, newPassword }),
    onSuccess: () => {
      toast.success('Password updated.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  function handleSave() {
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    savePassword.mutate();
  }

  return (
    <SettingsCard icon={ShieldCheck} title="Change password" description="Use a strong password you don't use elsewhere." tint="neutral">
      <div className="space-y-3.5">
        <div className="space-y-1.5">
          <Label htmlFor="settings-current-password">Current password</Label>
          <PasswordInput id="settings-current-password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="settings-new-password">New password</Label>
          <PasswordInput id="settings-new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="settings-confirm-password">Confirm new password</Label>
          <PasswordInput id="settings-confirm-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
        </div>
        <Button disabled={savePassword.isPending || !currentPassword || !newPassword} onClick={handleSave}>
          {savePassword.isPending ? 'Updating…' : 'Update password'}
        </Button>
      </div>
    </SettingsCard>
  );
}

const SECTION_CONTENT: Record<SectionKey, React.ComponentType> = {
  account: AccountSection,
  preferences: PreferencesSection,
  'sender-ids': SenderIdsSection,
  notifications: NotificationsSection,
  team: TeamSection,
  developer: DeveloperSection,
  security: SecuritySection,
};

const TRIGGER_CLASS = 'rounded-none border-b-2 border-transparent data-active:border-b-primary data-active:text-primary data-active:font-bold';

export function SettingsPage() {
  const location = useLocation();
  const initialTab: SectionKey = (location.state as { tab?: SectionKey } | null)?.tab ?? 'account';

  return (
    <div>
      <div className="mb-4">
        <div className="mb-1 text-[26px] font-bold">Settings</div>
        <div className="text-sm text-muted-foreground">Manage your account settings and preferences</div>
      </div>

      <Tabs defaultValue={initialTab}>
        <div className="mb-7 overflow-x-auto border-b">
          <TabsList variant="line" className="group-data-[orientation=horizontal]/tabs:h-auto min-w-0 justify-start gap-6 p-0">
            {SECTIONS.map((section) => (
              <TabsTrigger key={section.key} value={section.key} className={cn('h-auto px-0 py-3', TRIGGER_CLASS)}>
                {section.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {SECTIONS.map((section) => {
          const Section = SECTION_CONTENT[section.key];
          return (
            <TabsContent key={section.key} value={section.key}>
              <Section />
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
