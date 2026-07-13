import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { fetchPublicOrg, submitPublicContact } from '@/api/public';
import { apiErrorMessage } from '@/api/client';
import { formatPhoneInput } from '@/lib/phone';

export function JoinPage() {
  const { token } = useParams<{ token: string }>();
  const org = useQuery({ queryKey: ['public-org', token], queryFn: () => fetchPublicOrg(token!), enabled: !!token });
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '', dateOfBirth: '' });
  const [submitted, setSubmitted] = useState(false);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const submit = useMutation({
    mutationFn: () => submitPublicContact(token!, { ...form, dateOfBirth: form.dateOfBirth || undefined }),
    onSuccess: () => setSubmitted(true),
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not submit — please try again.')),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim() || !form.phone.trim()) {
      toast.error('Fill in your name and phone number.');
      return;
    }
    submit.mutate();
  }

  if (org.isLoading) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Loading…</div>;
  }

  if (org.isError || !org.data) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="text-center text-sm text-muted-foreground">This sign-up link is no longer valid.</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-4 sm:p-8">
      <div className="w-full max-w-[420px] rounded-[28px] border border-border bg-card p-8 shadow-xl sm:p-10">
        {submitted ? (
          <div>
            <div className="mb-5 flex h-[52px] w-[52px] items-center justify-center rounded-full bg-success/15 text-success">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div className="mb-1.5 text-[22px] font-bold">You're all set</div>
            <div className="text-sm leading-relaxed text-muted-foreground">
              Thanks for joining {org.data.churchName || 'the church'}'s contact list.
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-1.5 text-[22px] font-bold">Join {org.data.churchName || 'the church'}</div>
            <div className="mb-7 text-sm leading-relaxed text-muted-foreground">
              Add your details to stay in the loop with announcements and reminders.
            </div>

            <div className="mb-3.5 grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="join-first">First name</Label>
                <Input id="join-first" value={form.firstName} onChange={(e) => update('firstName', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="join-last">Last name</Label>
                <Input id="join-last" value={form.lastName} onChange={(e) => update('lastName', e.target.value)} />
              </div>
            </div>

            <div className="mb-3.5 space-y-1.5">
              <Label htmlFor="join-phone">Phone number</Label>
              <Input
                id="join-phone"
                placeholder="024 123 4567"
                inputMode="numeric"
                value={form.phone}
                onChange={(e) => update('phone', formatPhoneInput(e.target.value))}
              />
            </div>

            <div className="mb-7 space-y-1.5">
              <Label htmlFor="join-dob">Date of birth (optional)</Label>
              <Input id="join-dob" type="date" value={form.dateOfBirth} onChange={(e) => update('dateOfBirth', e.target.value)} />
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={submit.isPending}>
              {submit.isPending ? 'Submitting…' : 'Join'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
