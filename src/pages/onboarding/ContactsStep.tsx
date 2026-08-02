import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { ImportContactsPanel } from '@/components/contacts/ImportContactsPanel';
import { ShareLinkPanel } from '@/components/contacts/ShareLinkPanel';
import { completeOnboarding } from '@/api/organization';
import { apiErrorMessage } from '@/api/client';
import { useAuthStore } from '@/store/authStore';
import { OnboardingBackLink } from '@/pages/onboarding/OnboardingBackLink';
import { useEntityLabels } from '@/lib/terminology';
import type { ImportResult } from '@/api/contacts';

export function ContactsStep() {
  const navigate = useNavigate();
  const updateOrganization = useAuthStore((s) => s.updateOrganization);
  const entity = useEntityLabels();

  // Contacts is the last step of the wizard - finishing it ends onboarding,
  // which is what releases the OnboardingGate and sends the one-time welcome message.
  const finish = useMutation({
    mutationFn: completeOnboarding,
    onSuccess: (data) => {
      updateOrganization(data);
      navigate('/app/dashboard');
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  function handleImported(result: ImportResult) {
    if (result.imported > 0) updateOrganization({ contactsStatus: 'done' });
  }

  return (
    <div>
      <OnboardingBackLink to="/onboarding/sender-id" />
      <div className="mb-1.5 text-[26px] font-bold">Add your {entity.plural}</div>
      <div className="mb-7 text-sm leading-relaxed text-muted-foreground">
        Bring your {entity.singular} list in now, or share a link and let people add themselves. You can always do
        this later from {entity.pluralCap}.
      </div>

      <div className="mb-4 space-y-3.5">
        <ImportContactsPanel onImported={handleImported} />
        <ShareLinkPanel />
      </div>

      <Button
        className="mb-3 h-12 w-full rounded-full"
        size="lg"
        disabled={finish.isPending}
        onClick={() => finish.mutate()}
      >
        {finish.isPending ? 'Finishing…' : 'Finish setup'}
      </Button>
    </div>
  );
}
