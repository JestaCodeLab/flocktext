import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { registerSenderId, skipOnboardingStep } from '@/api/organization';
import { apiErrorMessage } from '@/api/client';
import { useAuthStore } from '@/store/authStore';
import { OnboardingBackLink } from '@/pages/onboarding/OnboardingBackLink';
import { senderIdStatusLabel, senderIdStatusVariant } from '@/lib/senderIdStatus';

export function SenderIdStep() {
  const navigate = useNavigate();
  const updateOrganization = useAuthStore((s) => s.updateOrganization);
  const organization = useAuthStore((s) => s.session?.organization);
  const [senderId, setSenderId] = useState('');
  const [purpose, setPurpose] = useState('');

  const activeSenderIds = organization?.senderIds.filter((s) => s.status !== 'deleted') ?? [];
  const existing = activeSenderIds.find((s) => s.isPrimary) ?? activeSenderIds[0];
  const showForm = !existing || existing.status === 'rejected';

  const register = useMutation({
    mutationFn: () => registerSenderId(senderId, purpose),
    onSuccess: (data) => {
      updateOrganization(data);
      toast.success('Sender ID submitted for review.');
      navigate('/onboarding/contacts');
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const skip = useMutation({
    mutationFn: () => skipOnboardingStep('sender_id'),
    onSuccess: (data) => {
      updateOrganization(data);
      navigate('/onboarding/contacts');
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!senderId.trim()) {
      toast.error('Enter a sender ID, or skip this step.');
      return;
    }
    if (purpose.trim().length < 5) {
      toast.error('Tell us how this sender ID will be used.');
      return;
    }
    register.mutate();
  }

  return (
    <div>
      <OnboardingBackLink to="/onboarding/organization" />
      <div className="mb-1.5 text-[26px] font-bold">Sender ID</div>
      <div className="mb-7 text-sm leading-relaxed text-muted-foreground">
        Register a name (up to 11 characters) so texts arrive from your organization instead of a random number. FlockText
        reviews each request before it goes out for approval — until then, messages send from FlockText's shared
        sender ID.
      </div>

      {existing && (
        <div className="mb-7 rounded-xl border border-border bg-card p-5">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-lg font-extrabold">{existing.senderId}</div>
            <Badge variant={senderIdStatusVariant[existing.status]}>{senderIdStatusLabel[existing.status]}</Badge>
          </div>
          <div className="text-sm text-muted-foreground">{existing.purpose}</div>
          {existing.status === 'rejected' && existing.rejectionReason && (
            <div className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {existing.rejectionReason} — try a different sender ID below.
            </div>
          )}
        </div>
      )}

      {showForm ? (
        <form onSubmit={handleSubmit}>
          <div className="mb-4 space-y-1.5">
            <Label htmlFor="sender-id">Sender ID</Label>
            <Input
              id="sender-id"
              className="h-12 rounded-full px-5"
              placeholder="GRACECHAPEL"
              maxLength={11}
              value={senderId}
              onChange={(e) => setSenderId(e.target.value.toUpperCase())}
            />
          </div>

          <div className="mb-7 space-y-1.5">
            <Label htmlFor="sender-purpose">Purpose</Label>
            <Textarea
              id="sender-purpose"
              placeholder="Weekly reminders and announcements to our customers."
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
            />
          </div>

          <Button type="submit" className="mb-3 h-12 w-full rounded-full" size="lg" disabled={register.isPending}>
            {register.isPending ? 'Submitting…' : 'Register sender ID'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="h-12 w-full rounded-full"
            size="lg"
            disabled={skip.isPending}
            onClick={() => skip.mutate()}
          >
            Skip for now
          </Button>
        </form>
      ) : (
        <Button className="h-12 w-full rounded-full" size="lg" onClick={() => navigate('/onboarding/contacts')}>
          Continue
        </Button>
      )}
    </div>
  );
}
