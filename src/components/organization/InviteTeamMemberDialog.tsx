import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { CheckCircle2, RefreshCw, XCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  inviteTeamMember,
  inviteTeamMemberAcrossAccounts,
  fetchTeam,
  type InviteMultiResultItem,
} from '@/api/team';
import { fetchAccounts } from '@/api/memberships';
import { initializeAddonPurchase, verifyAddonPurchase } from '@/api/addons';
import { apiErrorMessage } from '@/api/client';
import { openPaystackPopup } from '@/lib/paystack';
import { useHubtelCheckout } from '@/lib/hubtelCheckout';
import { addonsQueryKey, useAddonEntitlements } from '@/lib/addons';
import { formatPhoneInput, normalizePhone } from '@/lib/phone';
import { useEntityLabels } from '@/lib/terminology';

export function InviteTeamMemberDialog({
  open,
  onOpenChange,
  // Fixed target account - set when managing one specific account explicitly
  // (Settings > Account > that account's team sheet). No picker is shown; the
  // form always invites into this account.
  organizationId,
  // Lets one or more of the caller's accounts be chosen in the form instead of
  // always being whichever one the app is currently switched into - used by
  // Settings > Team. Ignored if organizationId is set.
  allowAccountPicker = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId?: string;
  allowAccountPicker?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  // Bumped on every close so the form below fully remounts (and so drops all
  // its local state - fields, picked accounts, results) rather than needing
  // its own explicit reset() path.
  const [instanceKey, setInstanceKey] = useState(0);

  function handleOpenChange(next: boolean) {
    if (busy) return;
    onOpenChange(next);
    if (!next) setInstanceKey((k) => k + 1);
  }

  const showPicker = allowAccountPicker && !organizationId;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Invite team member</DialogTitle>
        </DialogHeader>
        {showPicker ? (
          <MultiAccountInviteForm
            key={instanceKey}
            open={open}
            onBusyChange={setBusy}
            onDone={() => handleOpenChange(false)}
          />
        ) : (
          <SingleAccountInviteForm
            key={instanceKey}
            open={open}
            organizationId={organizationId}
            onBusyChange={setBusy}
            onDone={() => handleOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function RoleField({ role, onChange }: { role: 'admin' | 'user'; onChange: (role: 'admin' | 'user') => void }) {
  const entity = useEntityLabels();
  return (
    <div className="space-y-2">
      <Label>Role</Label>
      <Select value={role} onValueChange={(v) => onChange(v as 'admin' | 'user')}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="admin">Admin — full access, including billing, team management, and the activity log</SelectItem>
          <SelectItem value="user">User — can manage {entity.plural}, sends, and settings, but can't view the activity log</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

// The original single-account flow: invites into exactly one account (fixed by
// the caller), pre-checking seat availability so the submit button can show its
// cost upfront and charge for a seat before inviting if none is free.
function SingleAccountInviteForm({
  open,
  organizationId,
  onBusyChange,
  onDone,
}: {
  open: boolean;
  organizationId?: string;
  onBusyChange: (busy: boolean) => void;
  onDone: () => void;
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'admin' | 'user'>('user');
  const [payingForSeat, setPayingForSeat] = useState(false);

  const entitlements = useAddonEntitlements(organizationId);
  const team = useQuery({
    queryKey: ['team', organizationId ?? 'active'],
    queryFn: () => fetchTeam(organizationId),
    enabled: open,
  });

  // Revoked members hold no seat, matching how the server counts them when
  // inviting or restoring.
  const additionalMemberCount = team.data?.filter((m) => !m.isFounder && m.status === 'active').length ?? 0;
  const purchasedSeats = entitlements.data?.purchasedSeats ?? 0;
  const remainingSeats = purchasedSeats - additionalMemberCount;
  const seatAddonGhs = entitlements.data?.addons.find((a) => a.key === 'extra_team_seat')?.ghs ?? 0;
  const needsSeat = remainingSeats <= 0;

  const invite = useMutation({
    mutationFn: () => inviteTeamMember({ name, email, phone: normalizePhone(phone), role }, organizationId),
    onSuccess: () => {
      toast.success(`Invited ${name} — they'll get an email with login instructions.`);
      queryClient.invalidateQueries({ queryKey: ['team', organizationId ?? 'active'] });
      queryClient.invalidateQueries({ queryKey: addonsQueryKey(organizationId) });
      onDone();
    },
    // Deliberately leaves the dialog open with the form still filled. If this
    // fired after a seat purchase, the seat is already on the account - the
    // person just needs to fix whatever the server rejected and submit again,
    // and the retry won't charge a second time because a seat is now free.
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const busy = invite.isPending || payingForSeat;
  useEffect(() => onBusyChange(busy), [busy, onBusyChange]);

  async function onSeatPurchaseConfirmed(reference: string) {
    try {
      await verifyAddonPurchase(reference, organizationId);
      queryClient.invalidateQueries({ queryKey: addonsQueryKey(organizationId) });
      invite.mutate();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Payment went through but the seat could not be confirmed. Try inviting again.'));
    } finally {
      setPayingForSeat(false);
    }
  }

  const hubtelCheckout = useHubtelCheckout({
    onSuccess: onSeatPurchaseConfirmed,
    onCancel: () => {
      setPayingForSeat(false);
      toast('Payment cancelled — no one was invited.');
    },
  });

  // Buy the seat, then invite with it. Ordered this way because the server
  // refuses an invite with no seat available (402), so the purchase has to
  // land first. The form is validated before any of this so a mistyped field
  // can't get as far as taking money.
  async function purchaseSeatThenInvite() {
    setPayingForSeat(true);
    try {
      const purchase = await initializeAddonPurchase('extra_team_seat', organizationId);

      if (purchase.mode === 'stub') {
        queryClient.invalidateQueries({ queryKey: addonsQueryKey(organizationId) });
        invite.mutate();
        return;
      }

      if (purchase.authorization_url) {
        hubtelCheckout.open({
          reference: purchase.reference,
          url: purchase.authorization_url,
          displayMode: purchase.checkoutDisplay ?? 'redirect',
        });
        return;
      }

      await openPaystackPopup({
        email: purchase.email!,
        amountGHS: purchase.amountGHS,
        reference: purchase.reference,
        subaccountCode: purchase.subaccountCode,
        metadata: { organizationId: purchase.organizationId, addonKey: purchase.addonKey, kind: 'addon' },
        onSuccess: onSeatPurchaseConfirmed,
        onClose: () => {
          setPayingForSeat(false);
          toast('Payment cancelled — no one was invited.');
        },
      });
      // Popup is open; the callbacks above own the rest of the flow.
      return;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : apiErrorMessage(err, 'Could not open checkout.'));
    }
    setPayingForSeat(false);
  }

  function handleSubmit() {
    if (!name.trim() || !email.trim() || !phone.trim()) {
      toast.error('Fill in name, email, and phone.');
      return;
    }
    if (normalizePhone(phone).length < 9) {
      toast.error('Enter a complete phone number.');
      return;
    }
    if (needsSeat) {
      purchaseSeatThenInvite();
      return;
    }
    invite.mutate();
  }

  const submitLabel = payingForSeat
    ? 'Opening checkout…'
    : invite.isPending
      ? 'Sending invite…'
      : needsSeat
        ? `Invite User — GHS ${seatAddonGhs}`
        : 'Send invite';

  return (
    <>
      <div className="space-y-4">
        {needsSeat && (
          <div className="rounded-lg border border-border bg-secondary/40 px-3.5 py-2.5 text-xs text-muted-foreground">
            This account has no free seats left, so inviting adds one for{' '}
            <b className="font-semibold text-foreground">GHS {seatAddonGhs}</b>. You'll be charged when you submit —
            nothing is taken if you cancel.
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="invite-name">Full name</Label>
          <Input id="invite-name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="invite-email">Email</Label>
          <Input id="invite-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="invite-phone">Phone number</Label>
          <Input
            id="invite-phone"
            placeholder="024 xxx xxxx"
            inputMode="numeric"
            value={phone}
            onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
          />
        </div>
        <RoleField role={role} onChange={setRole} />
      </div>
      <DialogFooter>
        <Button variant="outline" disabled={busy} onClick={onDone}>
          Cancel
        </Button>
        <Button disabled={busy} onClick={handleSubmit}>
          {submitLabel}
        </Button>
      </DialogFooter>
      {hubtelCheckout.node}
    </>
  );
}

// The multi-account flow: lets the caller pick any number of accounts they
// admin, invites into all of them in one request, and shows a per-account
// result - a seat-unavailable account gets its own "buy seat & invite" retry
// rather than blocking or rolling back the accounts that succeeded.
function MultiAccountInviteForm({
  open,
  onBusyChange,
  onDone,
}: {
  open: boolean;
  onBusyChange: (busy: boolean) => void;
  onDone: () => void;
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'admin' | 'user'>('user');
  const [selectedOrgIds, setSelectedOrgIds] = useState<string[]>([]);
  const [results, setResults] = useState<InviteMultiResultItem[] | null>(null);
  const [retryingOrgId, setRetryingOrgId] = useState<string | null>(null);

  // Invites are admin-only per target account - accounts the caller is only a
  // plain member of would just fail per-item, so leave them out of the list.
  const accounts = useQuery({ queryKey: ['accounts'], queryFn: fetchAccounts, enabled: open });
  const adminAccounts = accounts.data?.filter((a) => a.role === 'admin') ?? [];

  // Default to just the active account once accounts load, rather than
  // requiring an explicit pick for the common single-account case.
  useEffect(() => {
    if (!accounts.data || selectedOrgIds.length > 0) return;
    const active = accounts.data.find((a) => a.isActive);
    if (active) setSelectedOrgIds([active.organizationId]);
    // Only reacts to accounts finishing load, not to selectedOrgIds itself.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accounts.data]);

  function toggleOrg(orgId: string, checked: boolean) {
    setSelectedOrgIds((prev) => (checked ? [...prev, orgId] : prev.filter((id) => id !== orgId)));
  }

  function churchNameFor(orgId: string, fallback?: string) {
    return accounts.data?.find((a) => a.organizationId === orgId)?.churchName || fallback || 'Untitled account';
  }

  function invalidateForOrg(orgId: string) {
    const isActive = accounts.data?.find((a) => a.isActive)?.organizationId === orgId;
    queryClient.invalidateQueries({ queryKey: ['team', isActive ? 'active' : orgId] });
    queryClient.invalidateQueries({ queryKey: addonsQueryKey(isActive ? undefined : orgId) });
  }

  const submit = useMutation({
    mutationFn: () =>
      inviteTeamMemberAcrossAccounts({
        name,
        email,
        phone: normalizePhone(phone),
        role,
        organizationIds: selectedOrgIds,
      }),
    onSuccess: (data) => {
      setResults(data);
      data.forEach((r) => {
        if (r.status === 'invited') invalidateForOrg(r.organizationId);
      });
      const invitedCount = data.filter((r) => r.status === 'invited').length;
      if (invitedCount === data.length) {
        toast.success(`Invited ${name} into ${invitedCount} account${invitedCount === 1 ? '' : 's'}.`);
      } else if (invitedCount > 0) {
        toast(`Invited into ${invitedCount} of ${data.length} accounts — see details below.`);
      } else {
        toast.error('Could not invite into any of the selected accounts.');
      }
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const busy = submit.isPending || retryingOrgId !== null;
  useEffect(() => onBusyChange(busy), [busy, onBusyChange]);

  async function completeInviteForOrg(orgId: string) {
    try {
      const member = await inviteTeamMember({ name, email, phone: normalizePhone(phone), role }, orgId);
      invalidateForOrg(orgId);
      setResults((prev) =>
        prev?.map((r) => (r.organizationId === orgId ? { organizationId: orgId, status: 'invited', member } : r)) ?? prev
      );
      toast.success(`Invited ${name} into ${churchNameFor(orgId)}.`);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Payment went through but the invite could not be sent. Try again.'));
    } finally {
      setRetryingOrgId(null);
    }
  }

  async function onSeatPurchaseConfirmed(reference: string, orgId: string) {
    try {
      await verifyAddonPurchase(reference, orgId);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Payment went through but the seat could not be confirmed. Try inviting again.'));
      setRetryingOrgId(null);
      return;
    }
    await completeInviteForOrg(orgId);
  }

  // There's only ever one retry in flight at a time (tracked by retryingOrgId), so it's
  // safe for this top-level callback to close over that state rather than needing a
  // per-call ref - by the time Hubtel's dialog resolves, retryingOrgId still holds the
  // account this specific checkout was opened for.
  const hubtelCheckout = useHubtelCheckout({
    onSuccess: (reference) => retryingOrgId && onSeatPurchaseConfirmed(reference, retryingOrgId),
    onCancel: () => {
      setRetryingOrgId(null);
      toast('Payment cancelled.');
    },
  });

  // Same purchase-then-invite shape as the single-account flow, but scoped to
  // one account from the results list and via the single-account invite
  // endpoint - retrying the whole batch would re-attempt accounts that already
  // succeeded.
  async function retrySeatPurchase(orgId: string) {
    setRetryingOrgId(orgId);

    try {
      const purchase = await initializeAddonPurchase('extra_team_seat', orgId);

      if (purchase.mode === 'stub') {
        await completeInviteForOrg(orgId);
        return;
      }

      if (purchase.authorization_url) {
        hubtelCheckout.open({
          reference: purchase.reference,
          url: purchase.authorization_url,
          displayMode: purchase.checkoutDisplay ?? 'redirect',
        });
        return;
      }

      await openPaystackPopup({
        email: purchase.email!,
        amountGHS: purchase.amountGHS,
        reference: purchase.reference,
        subaccountCode: purchase.subaccountCode,
        metadata: { organizationId: purchase.organizationId, addonKey: purchase.addonKey, kind: 'addon' },
        onSuccess: (reference) => onSeatPurchaseConfirmed(reference, orgId),
        onClose: () => {
          setRetryingOrgId(null);
          toast('Payment cancelled.');
        },
      });
      return;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : apiErrorMessage(err, 'Could not open checkout.'));
      setRetryingOrgId(null);
    }
  }

  function handleSubmit() {
    if (!name.trim() || !email.trim() || !phone.trim()) {
      toast.error('Fill in name, email, and phone.');
      return;
    }
    if (normalizePhone(phone).length < 9) {
      toast.error('Enter a complete phone number.');
      return;
    }
    if (selectedOrgIds.length === 0) {
      toast.error('Choose at least one account.');
      return;
    }
    submit.mutate();
  }

  if (results) {
    return (
      <>
        <div className="space-y-2">
          {results.map((r) => (
            <div
              key={r.organizationId}
              className="flex items-center justify-between gap-3 rounded-lg border border-border bg-secondary/30 px-3.5 py-2.5"
            >
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">{churchNameFor(r.organizationId, r.churchName)}</div>
                {r.status === 'failed' && <div className="text-xs text-destructive">{r.error}</div>}
              </div>
              {r.status === 'invited' ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
              ) : r.reason === 'seat_unavailable' ? (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() => retrySeatPurchase(r.organizationId)}
                >
                  {retryingOrgId === r.organizationId ? 'Processing…' : 'Buy seat & invite'}
                </Button>
              ) : (
                <XCircle className="h-4 w-4 shrink-0 text-destructive" />
              )}
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button disabled={busy} onClick={onDone}>
            Done
          </Button>
        </DialogFooter>
        {hubtelCheckout.node}
      </>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {adminAccounts.length > 1 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Accounts</Label>
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                title="Refresh accounts"
                disabled={accounts.isFetching}
                onClick={() => accounts.refetch()}
              >
                <RefreshCw className={`h-3.5 w-3.5 ${accounts.isFetching ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            <div className="max-h-56 space-y-1 overflow-y-auto rounded-lg border border-border p-2">
              {adminAccounts.map((a) => (
                <label
                  key={a.organizationId}
                  className="flex cursor-pointer items-center gap-2.5 rounded-md px-1.5 py-1.5 text-sm hover:bg-secondary/50"
                >
                  <Checkbox
                    checked={selectedOrgIds.includes(a.organizationId)}
                    onCheckedChange={(checked) => toggleOrg(a.organizationId, checked === true)}
                  />
                  <span className="truncate">
                    {a.churchName || 'Untitled account'}
                    {a.isActive ? ' (current)' : ''}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="invite-multi-name">Full name</Label>
          <Input id="invite-multi-name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="invite-multi-email">Email</Label>
          <Input id="invite-multi-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="invite-multi-phone">Phone number</Label>
          <Input
            id="invite-multi-phone"
            placeholder="024 xxx xxxx"
            inputMode="numeric"
            value={phone}
            onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
          />
        </div>
        <RoleField role={role} onChange={setRole} />
      </div>
      <DialogFooter>
        <Button variant="outline" disabled={busy} onClick={onDone}>
          Cancel
        </Button>
        <Button disabled={busy} onClick={handleSubmit}>
          {submit.isPending ? 'Sending invites…' : `Send invite${selectedOrgIds.length > 1 ? 's' : ''}`}
        </Button>
      </DialogFooter>
    </>
  );
}
