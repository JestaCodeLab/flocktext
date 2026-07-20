import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Church, Briefcase, Landmark } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { updateOrganizationProfile } from '@/api/organization';
import { apiErrorMessage } from '@/api/client';
import { useAuthStore } from '@/store/authStore';
import { OnboardingBackLink } from '@/pages/onboarding/OnboardingBackLink';
import { cn } from '@/lib/utils';
import type { OrganizationType } from '@/lib/terminology';

const CATEGORY_OPTIONS: { value: OrganizationType; label: string; description: string; icon: LucideIcon }[] = [
  { value: 'church', label: 'Church', description: 'Your contacts are called members', icon: Church },
  { value: 'business', label: 'Business', description: 'Your contacts are called customers', icon: Briefcase },
  { value: 'institution', label: 'Institution', description: 'Your contacts are called contacts', icon: Landmark },
];

export function OrganizationStep() {
  const navigate = useNavigate();
  const updateOrganization = useAuthStore((s) => s.updateOrganization);
  const organization = useAuthStore((s) => s.session?.organization);
  const [organizationType, setOrganizationType] = useState<OrganizationType | null>(organization?.organizationType ?? null);
  const [churchName, setChurchName] = useState(organization?.churchName ?? '');
  const [address, setAddress] = useState(organization?.address ?? '');

  const save = useMutation({
    mutationFn: () => updateOrganizationProfile({ churchName, address, organizationType: organizationType! }),
    onSuccess: (data) => {
      updateOrganization(data);
      navigate('/onboarding/sender-id');
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!organizationType) {
      toast.error('Choose a category to continue.');
      return;
    }
    if (!churchName.trim() || !address.trim()) {
      toast.error('Enter your organization name and address to continue.');
      return;
    }
    save.mutate();
  }

  return (
    <form onSubmit={handleSubmit}>
      <OnboardingBackLink to="/onboarding/welcome" />
      <div className="mb-1.5 text-[26px] font-bold">Your organization</div>
      <div className="mb-7 text-sm leading-relaxed text-muted-foreground">
        This is how your organization shows up across FlockText.
      </div>

      <div className="mb-4 space-y-1.5">
        <Label>What best describes you?</Label>
        <div className="grid grid-cols-3 gap-2.5">
          {CATEGORY_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setOrganizationType(option.value)}
              className={cn(
                'flex flex-col items-center gap-1.5 rounded-2xl border px-3 py-4 text-center transition-colors',
                organizationType === option.value
                  ? 'border-primary bg-accent/40 text-foreground'
                  : 'border-border text-muted-foreground hover:text-foreground'
              )}
            >
              <option.icon className="h-5 w-5" />
              <span className="text-sm font-semibold">{option.label}</span>
              <span className="text-xs leading-snug">{option.description}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4 space-y-1.5">
        <Label htmlFor="org-name">Organization name</Label>
        <Input
          id="org-name"
          className="h-12 rounded-full px-5"
          placeholder="Acme Ventures"
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
