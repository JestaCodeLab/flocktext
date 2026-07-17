import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AddSenderIdDialog } from '@/components/organization/AddSenderIdDialog';
import { InviteTeamMemberDialog } from '@/components/organization/InviteTeamMemberDialog';
import { updateOrganizationProfile, updateNotifPrefs, setPrimarySenderId, deleteSenderId } from '@/api/organization';
import { updateMe, changePassword } from '@/api/auth';
import { fetchTeam, updateTeamMemberRole, removeTeamMember } from '@/api/team';
import { fetchApiKeys, createApiKey, revokeApiKey } from '@/api/developer';
import { apiErrorMessage } from '@/api/client';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore, type ThemeMode } from '@/store/themeStore';
import { senderIdStatusLabel, senderIdStatusVariant } from '@/lib/senderIdStatus';
import { cn } from '@/lib/utils';

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

type SectionKey = 'account' | 'appearance' | 'sender-ids' | 'notifications' | 'team' | 'developer' | 'security';

const SECTIONS: { key: SectionKey; label: string; icon: LucideIcon; tint: Tint }[] = [
  { key: 'account', label: 'Account', icon: Building2, tint: 'primary' },
  { key: 'appearance', label: 'Appearance', icon: PaintBucket, tint: 'violet' },
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
  children,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  tint?: Tint;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', TINT_CLASS[tint])}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[16px] font-bold">{title}</div>
            <div className="mt-0.5 text-sm text-muted-foreground">{description}</div>
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

  const [churchName, setChurchName] = useState(organization?.churchName ?? '');
  const [address, setAddress] = useState(organization?.address ?? '');
  const [contactEmail, setContactEmail] = useState(organization?.contactEmail ?? '');

  const saveOrg = useMutation({
    mutationFn: () => updateOrganizationProfile({ churchName, address, contactEmail }),
    onSuccess: (data) => {
      updateOrganization(data);
      toast.success('Church profile updated.');
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
      <SettingsCard icon={Building2} title="Church profile" description="Shown across FlockText and to your contacts." tint="primary">
        <div className="space-y-3.5">
          <div className="grid grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <Label htmlFor="settings-church-name">Church name</Label>
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

function AppearanceSection() {
  const themeMode = useThemeStore((s) => s.mode);
  const setThemeMode = useThemeStore((s) => s.setMode);

  return (
    <SettingsCard icon={PaintBucket} title="Appearance" description="Choose how FlockText looks on this device." tint="violet">
      <div className="grid max-w-sm grid-cols-3 gap-2">
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
  const prefs = organization?.notifPrefs ?? { lowBalance: true, scheduleConfirm: true, deliverySummary: false };

  const save = useMutation({
    mutationFn: updateNotifPrefs,
    onSuccess: (data) => updateOrganization(data),
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  function toggle(key: keyof typeof prefs) {
    save.mutate({ ...prefs, [key]: !prefs[key] });
  }

  const rows: { key: keyof typeof prefs; label: string; description: string }[] = [
    { key: 'lowBalance', label: 'Low balance alerts', description: 'Get notified when your SMS credit balance runs low.' },
    { key: 'scheduleConfirm', label: 'Schedule confirmations', description: 'Get notified when a scheduled or recurring send is confirmed.' },
    { key: 'deliverySummary', label: 'Delivery summaries', description: 'Get a summary after each send completes.' },
  ];

  return (
    <SettingsCard icon={Bell} title="Notifications" description="Choose what FlockText should keep you posted on." tint="teal">
      <div className="divide-y divide-border">
        {rows.map((row) => (
          <div key={row.key} className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
            <div>
              <div className="text-sm font-semibold">{row.label}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">{row.description}</div>
            </div>
            <Switch checked={prefs[row.key]} onCheckedChange={() => toggle(row.key)} disabled={save.isPending} />
          </div>
        ))}
      </div>
    </SettingsCard>
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
  const isOwner = currentUser?.role === 'owner';
  const [showInvite, setShowInvite] = useState(false);
  const team = useQuery({ queryKey: ['team'], queryFn: fetchTeam });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['team'] });
  }

  const changeRole = useMutation({
    mutationFn: ({ id, role }: { id: string; role: 'admin' | 'viewer' }) => updateTeamMemberRole(id, role),
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
        description={isOwner ? 'Invite teammates and manage their access.' : 'Everyone with access to this account.'}
        tint="green"
        action={
          isOwner && (
            <Button size="sm" onClick={() => setShowInvite(true)}>
              <UserPlus className="h-[15px] w-[15px]" /> Invite
            </Button>
          )
        }
      >
        {team.isLoading && (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        )}
        {team.data && (
          <div className="divide-y divide-border">
            {team.data.map((member) => (
              <div key={member.id} className="flex items-center justify-between gap-3 py-3.5 first:pt-0 last:pb-0">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
                    {getInitials(member.name)}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{member.name}</div>
                    <div className="truncate text-xs text-muted-foreground">{member.email}</div>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {isOwner && member.role !== 'owner' ? (
                    <Select value={member.role} onValueChange={(v) => changeRole.mutate({ id: member.id, role: v as 'admin' | 'viewer' })}>
                      <SelectTrigger size="sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge variant={member.role === 'owner' ? 'default' : 'secondary'} className="capitalize">
                      {member.role}
                    </Badge>
                  )}
                  {isOwner && member.role !== 'owner' && member.id !== currentUser?.id && (
                    <Button size="icon-sm" variant="ghost" className="text-destructive" disabled={remove.isPending} onClick={() => remove.mutate(member.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
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
  appearance: AppearanceSection,
  'sender-ids': SenderIdsSection,
  notifications: NotificationsSection,
  team: TeamSection,
  developer: DeveloperSection,
  security: SecuritySection,
};

const TRIGGER_CLASS = 'rounded-none border-b-2 border-transparent data-active:border-b-primary data-active:text-primary data-active:font-bold';

export function SettingsPage() {
  return (
    <div>
      <div className="mb-4">
        <div className="mb-1 text-[26px] font-bold">Settings</div>
        <div className="text-sm text-muted-foreground">Manage your account settings and preferences</div>
      </div>

      <Tabs defaultValue="account">
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
