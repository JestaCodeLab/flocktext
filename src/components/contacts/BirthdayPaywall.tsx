import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Gift, Check, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { initializeAddonPurchase, verifyAddonPurchase } from '@/api/addons';
import { apiErrorMessage } from '@/api/client';
import { openPaystackPopup } from '@/lib/paystack';

const FEATURE_BADGES = ['Retention', 'Automation'];

export function BirthdayPaywall({ priceGhs }: { priceGhs: number }) {
  const queryClient = useQueryClient();

  const verify = useMutation({
    mutationFn: verifyAddonPurchase,
    onSuccess: () => {
      toast.success('Payment confirmed — Birthday Automation unlocked.');
      queryClient.invalidateQueries({ queryKey: ['addons'] });
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const unlock = useMutation({
    mutationFn: () => initializeAddonPurchase('birthday_automation'),
    onSuccess: async (data) => {
      if (data.mode === 'stub') {
        toast.success('Birthday Automation unlocked.');
        queryClient.invalidateQueries({ queryKey: ['addons'] });
        return;
      }
      try {
        await openPaystackPopup({
          email: data.email,
          amountGHS: data.amountGHS,
          reference: data.reference,
          subaccountCode: data.subaccountCode,
          metadata: { organizationId: data.organizationId, addonKey: data.addonKey, kind: 'addon' },
          onSuccess: (reference) => verify.mutate(reference),
          onClose: () => toast('Payment cancelled.'),
        });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Could not open checkout.');
      }
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const isBusy = unlock.isPending || verify.isPending;

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-[2px]">
      <div className="mx-4 w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-xl">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Gift className="h-7 w-7" />
        </div>
        <div className="mb-2 text-xl font-bold">Unlock Birthday Automation</div>
        <div className="mb-5 text-sm text-muted-foreground">
          Automate personalized greetings and keep your contacts smiling. Enable now to see your upcoming schedule.
        </div>
        <div className="mb-6 flex flex-wrap items-center justify-center gap-2">
          {FEATURE_BADGES.map((label) => (
            <span
              key={label}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary px-3 py-1 text-xs font-semibold text-foreground/80"
            >
              <Check className="h-3 w-3" /> {label}
            </span>
          ))}
        </div>
        <Button className="w-full" size="lg" disabled={isBusy} onClick={() => unlock.mutate()}>
          <Zap className="h-4 w-4" /> {isBusy ? 'Starting checkout…' : `Enable Birthday App — GHS ${priceGhs}`}
        </Button>
        <div className="mt-3 text-xs text-muted-foreground">Standard messaging rates apply.</div>
      </div>
    </div>
  );
}
