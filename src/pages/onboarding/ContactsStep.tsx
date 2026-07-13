import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { CsvImportPanel } from '@/components/contacts/CsvImportPanel';
import { ShareLinkPanel } from '@/components/contacts/ShareLinkPanel';
import { skipOnboardingStep } from '@/api/organization';
import { apiErrorMessage } from '@/api/client';
import { useAuthStore } from '@/store/authStore';
import { OnboardingBackLink } from '@/pages/onboarding/OnboardingBackLink';

export function ContactsStep() {
  const navigate = useNavigate();
  const updateOrganization = useAuthStore((s) => s.updateOrganization);

  const skip = useMutation({
    mutationFn: () => skipOnboardingStep('contacts'),
    onSuccess: (data) => {
      updateOrganization(data);
      navigate('/onboarding/wallet');
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  function handleImported() {
    updateOrganization({ contactsStatus: 'done' });
  }

  return (
    <div>
      <OnboardingBackLink to="/onboarding/sender-id" />
      <div className="mb-1.5 text-[26px] font-bold">Add your contacts</div>
      <div className="mb-7 text-sm leading-relaxed text-muted-foreground">
        Bring your member list in now, or share a link and let people add themselves. You can always do this later
        from Contacts.
      </div>

      <div className="mb-4 space-y-3.5">
        <CsvImportPanel onImported={handleImported} />
        <ShareLinkPanel />
      </div>

      <Button className="mb-3 h-12 w-full rounded-full" size="lg" onClick={() => navigate('/onboarding/wallet')}>
        Continue
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
    </div>
  );
}
