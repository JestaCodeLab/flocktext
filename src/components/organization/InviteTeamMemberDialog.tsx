import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { inviteTeamMember } from '@/api/team';
import { apiErrorMessage } from '@/api/client';
import { formatPhoneInput, normalizePhone } from '@/lib/phone';
import { useEntityLabels } from '@/lib/terminology';

export function InviteTeamMemberDialog({
  open,
  onOpenChange,
  // Omitted for the account the user is currently switched into. Passed when
  // inviting into one of their other accounts from Settings, which also decides
  // which cached roster gets invalidated afterwards.
  organizationId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId?: string;
}) {
  const queryClient = useQueryClient();
  const entity = useEntityLabels();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'admin' | 'user'>('user');

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
      onOpenChange(false);
      reset();
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  function handleSubmit() {
    if (!name.trim() || !email.trim() || !phone.trim()) {
      toast.error('Fill in name, email, and phone.');
      return;
    }
    invite.mutate();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) reset();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite team member</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={invite.isPending} onClick={handleSubmit}>
            {invite.isPending ? 'Sending invite…' : 'Send invite'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
