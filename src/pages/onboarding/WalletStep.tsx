import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { CreditPackageGrid } from '@/components/wallet/CreditPackageGrid';
import { fetchWallet, initializeTopup } from '@/api/wallet';
import { skipOnboardingStep } from '@/api/organization';
import { apiErrorMessage } from '@/api/client';
import { useAuthStore } from '@/store/authStore';
import { OnboardingBackLink } from '@/pages/onboarding/OnboardingBackLink';

export function WalletStep() {
  const navigate = useNavigate();
  const updateOrganization = useAuthStore((s) => s.updateOrganization);
  const wallet = useQuery({ queryKey: ['wallet'], queryFn: fetchWallet });

  const topup = useMutation({
    mutationFn: initializeTopup,
    onSuccess: (data) => {
      if (data.mode === 'redirect') {
        window.location.href = data.authorizationUrl;
        return;
      }
      updateOrganization({ walletBalanceCredits: data.walletBalanceCredits, walletBalanceGHS: data.walletBalanceGHS });
      toast.success('Credit added to your wallet.');
      navigate('/app/dashboard');
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const skip = useMutation({
    mutationFn: () => skipOnboardingStep('wallet'),
    onSuccess: (data) => {
      updateOrganization(data);
      navigate('/app/dashboard');
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  return (
    <div>
      <OnboardingBackLink to="/onboarding/contacts" />
      <div className="mb-1.5 text-[26px] font-bold">Fund your wallet</div>
      <div className="mb-7 text-sm leading-relaxed text-muted-foreground">
        Top up SMS credit now, or skip and do it later from Wallet. Every account starts with 20 free credits.
      </div>

      {wallet.data && (
        <CreditPackageGrid
          packages={wallet.data.packages}
          onBuy={(ghs) => topup.mutate(ghs)}
          buying={topup.isPending}
          variant="compact"
        />
      )}

      <Button
        type="button"
        variant="ghost"
        className="mt-7 h-12 w-full rounded-full"
        size="lg"
        disabled={skip.isPending}
        onClick={() => skip.mutate()}
      >
        Skip for now
      </Button>
    </div>
  );
}
