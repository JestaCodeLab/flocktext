import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Building2, UserRound } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { updateOrganizationProfile } from '@/api/organization';
import { updateMe } from '@/api/auth';
import { apiErrorMessage } from '@/api/client';
import { useAuthStore } from '@/store/authStore';
import { useEntityLabels } from '@/lib/terminology';
import { AccountsCard } from './AccountsCard';
import { SettingsCard } from './SettingsCard';

export function AccountSection() {
  const organization = useAuthStore((s) => s.session?.organization);
  const updateOrganization = useAuthStore((s) => s.updateOrganization);
  const user = useAuthStore((s) => s.session?.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const entity = useEntityLabels();

  const [churchName, setChurchName] = useState(organization?.churchName ?? '');
  const [address, setAddress] = useState(organization?.address ?? '');
  const [description, setDescription] = useState(organization?.description ?? '');
  const [contactEmail, setContactEmail] = useState(organization?.contactEmail ?? '');

  const saveOrg = useMutation({
    mutationFn: () =>
      updateOrganizationProfile({
        churchName,
        address,
        description,
        contactEmail,
        organizationType: organization?.organizationType ?? 'institution',
      }),
    onSuccess: (data) => {
      updateOrganization(data);
      toast.success('Organization profile updated.');
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  function handleSaveOrg() {
    // Description is optional here (unlike onboarding) so orgs that onboarded before
    // this field existed aren't blocked from saving unrelated changes - but if they DO
    // type something, it must meet the same 20-250 bound the backend enforces.
    const trimmedDescription = description.trim();
    if (trimmedDescription && trimmedDescription.length < 20) {
      toast.error('Describe your business in at least 20 characters, or leave it blank.');
      return;
    }
    saveOrg.mutate();
  }

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
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <SettingsCard
        icon={Building2}
        title="Organization profile"
        description={`Shown across FlockText and to your ${entity.plural}.`}
        tint="primary"
      >
        <div className="space-y-3.5">
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
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
            <Label htmlFor="settings-description">Describe your business</Label>
            <Textarea
              id="settings-description"
              placeholder="What does your organization do, and who do you send messages to?"
              rows={3}
              maxLength={250}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <div className="text-right text-xs text-muted-foreground">{description.length}/250</div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="settings-contact-email">Contact email</Label>
            <Input id="settings-contact-email" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
          </div>
          <Button disabled={saveOrg.isPending} onClick={handleSaveOrg}>
            {saveOrg.isPending ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </SettingsCard>

      <SettingsCard icon={UserRound} title="Your details" description="Your personal name and email on this account." tint="blue">
        <div className="space-y-3.5">
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
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

      <AccountsCard />
    </div>
  );
}
