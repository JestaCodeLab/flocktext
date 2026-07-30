import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { inviteTeamMember } from '@/api/team';
import { initializeAddonPurchase, verifyAddonPurchase } from '@/api/addons';
import { apiErrorMessage } from '@/api/client';
import { openPaystackPopup } from '@/lib/paystack';
import { addonsQueryKey } from '@/lib/addons';
import { formatPhoneInput, normalizePhone } from '@/lib/phone';
import { useEntityLabels } from '@/lib/terminology';

export function InviteTeamMemberDialog({
  open,
  onOpenChange,
  // Omitted for the account the user is currently switched into. Passed when
  // inviting into one of their other accounts from Settings, which also decides
  // which cached roster and entitlements get invalidated afterwards.
  organizationId,
  // True when the account has no free seat left, so this invite has to buy one.
  // The price is shown on the submit button and charged on submit - the form is
  // always reachable, rather than payment gating access to it.
  needsSeat = false,
  seatPriceGhs = 0,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId?: string;
  needsSeat?: boolean;
  seatPriceGhs?: number;
}) {
  const queryClient = useQueryClient();
  const entity = useEntityLabels();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'admin' | 'user'>('user');
  const [payingForSeat, setPayingForSeat] = useState(false);

  function reset() {
    setName('');
    setEmail('');
    setPhone('');
    setRole('user');
  }

  const invite = useMutation({
    mutationFn: () => inviteTeamMember({ name, email, phone: normalizePhone(phone), role }, organizationId),
    onSuccess: () => {
      toast.success(`Invited ${name} — they'll get an email with login instructions.`);
      queryClient.invalidateQueries({ queryKey: ['team', organizationId ?? 'active'] });
      queryClient.invalidateQueries({ queryKey: addonsQueryKey(organizationId) });
      onOpenChange(false);
      reset();
    },
    // Deliberately leaves the dialog open with the form still filled. If this
    // fired after a seat purchase, the seat is already on the account - the
    // person just needs to fix whatever the server rejected and submit again,
    // and the retry won't charge a second time because a seat is now free.
    onError: (err) => toast.error(apiErrorMessage(err)),
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

      await openPaystackPopup({
        email: purchase.email,
        amountGHS: purchase.amountGHS,
        reference: purchase.reference,
        subaccountCode: purchase.subaccountCode,
        metadata: { organizationId: purchase.organizationId, addonKey: purchase.addonKey, kind: 'addon' },
        onSuccess: async (reference) => {
          try {
            await verifyAddonPurchase(reference, organizationId);
            queryClient.invalidateQueries({ queryKey: addonsQueryKey(organizationId) });
            invite.mutate();
          } catch (err) {
            toast.error(apiErrorMessage(err, 'Payment went through but the seat could not be confirmed. Try inviting again.'));
          } finally {
            setPayingForSeat(false);
          }
        },
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

  const busy = invite.isPending || payingForSeat;
  const submitLabel = payingForSeat
    ? 'Opening checkout…'
    : invite.isPending
      ? 'Sending invite…'
      : needsSeat
        ? `Invite User — GHS ${seatPriceGhs}`
        : 'Send invite';

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (busy) return;
        onOpenChange(next);
        if (!next) reset();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite team member</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {needsSeat && (
            <div className="rounded-lg border border-border bg-secondary/40 px-3.5 py-2.5 text-xs text-muted-foreground">
              This account has no free seats left, so inviting adds one for{' '}
              <b className="font-semibold text-foreground">GHS {seatPriceGhs}</b>. You'll be charged when you submit —
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
          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as 'admin' | 'user')}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin — full access, including billing, team management, and the activity log</SelectItem>
                <SelectItem value="user">User — can manage {entity.plural}, sends, and settings, but can't view the activity log</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" disabled={busy} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={busy} onClick={handleSubmit}>
            {submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
