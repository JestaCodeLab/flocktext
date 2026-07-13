import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { updateOrganizationProfile } from '@/api/organization';
import { apiErrorMessage } from '@/api/client';
import { useAuthStore } from '@/store/authStore';
import { OnboardingBackLink } from '@/pages/onboarding/OnboardingBackLink';

export function OrganizationStep() {
  const navigate = useNavigate();
  const updateOrganization = useAuthStore((s) => s.updateOrganization);
  const organization = useAuthStore((s) => s.session?.organization);
  const [churchName, setChurchName] = useState(organization?.churchName ?? '');
  const [address, setAddress] = useState(organization?.address ?? '');

  const save = useMutation({
    mutationFn: () => updateOrganizationProfile({ churchName, address }),
    onSuccess: (data) => {
      updateOrganization(data);
      navigate('/onboarding/sender-id');
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!churchName.trim() || !address.trim()) {
      toast.error('Enter your church name and address to continue.');
      return;
    }
    save.mutate();
  }

  return (
    <form onSubmit={handleSubmit}>
      <OnboardingBackLink to="/onboarding/welcome" />
      <div className="mb-1.5 text-[26px] font-bold">Your organization</div>
      <div className="mb-7 text-sm leading-relaxed text-muted-foreground">
        This is how your church shows up across FlockText.
      </div>

      <div className="mb-4 space-y-1.5">
        <Label htmlFor="org-name">Church name</Label>
        <Input
          id="org-name"
          className="h-12 rounded-full px-5"
          placeholder="Grace Chapel Accra"
          value={churchName}
          onChange={(e) => setChurchName(e.target.value)}
        />
      </div>

      <div className="mb-7 space-y-1.5">
        <Label htmlFor="org-address">Address</Label>
        <Input
          id="org-address"
          className="h-12 rounded-full px-5"
          placeholder="12 Ring Road, Accra"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
      </div>

      <Button type="submit" className="h-12 w-full rounded-full" size="lg" disabled={save.isPending}>
        {save.isPending ? 'Saving…' : 'Continue'}
      </Button>
    </form>
  );
}
