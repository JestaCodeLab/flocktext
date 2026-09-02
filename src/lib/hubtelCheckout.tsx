import { useCallback, useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// Counterpart to lib/paystack.ts's openPaystackPopup, for when a checkout response comes
// back with `authorization_url` set (see api/wallet.ts and api/addons.ts) instead of
// Paystack Inline params - in practice this only happens for a Hubtel-provided checkout,
// which has no Inline-popup equivalent. The API already picks the one correct URL for the
// configured display mode, so this just puts it in an iframe (`checkoutDisplay: 'iframe'`)
// or does a full-page redirect (`'redirect'`) instead of embedding a third-party script
// like Paystack's does.
export interface HubtelCheckoutSession {
  reference: string;
  url: string;
  displayMode: 'iframe' | 'redirect';
}

interface HubtelCheckoutMessage {
  source: 'flocktext-hubtel-checkout';
  reference: string;
  outcome: 'success' | 'cancelled';
}

function isHubtelCheckoutMessage(data: unknown): data is HubtelCheckoutMessage {
  return !!data && typeof data === 'object' && (data as Record<string, unknown>).source === 'flocktext-hubtel-checkout';
}

// `open()` starts a checkout session; render the returned `node` once near the top of
// the component (same place you'd otherwise just call openPaystackPopup). In iframe mode,
// the embedded page (pages/public/HubtelCheckoutCompletePage.tsx) posts the outcome back
// here once Hubtel redirects it to returnUrl/cancellationUrl; in redirect mode there's no
// dialog at all - the whole page navigates away, and the caller's own page is expected to
// read `?reference=&outcome=` back off the URL on the next mount instead.
export function useHubtelCheckout({ onSuccess, onCancel }: { onSuccess: (reference: string) => void; onCancel?: () => void }) {
  const [session, setSession] = useState<HubtelCheckoutSession | null>(null);
  const onSuccessRef = useRef(onSuccess);
  const onCancelRef = useRef(onCancel);
  onSuccessRef.current = onSuccess;
  onCancelRef.current = onCancel;

  useEffect(() => {
    if (!session) return;

    function handleMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin || !isHubtelCheckoutMessage(event.data)) return;
      if (event.data.reference !== session?.reference) return;

      setSession(null);
      if (event.data.outcome === 'success') onSuccessRef.current(event.data.reference);
      else onCancelRef.current?.();
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [session]);

  const open = useCallback((next: HubtelCheckoutSession) => {
    if (next.displayMode === 'redirect') {
      window.location.href = next.url;
      return;
    }
    setSession(next);
  }, []);

  const node = (
    <Dialog
      open={!!session}
      onOpenChange={(nextOpen) => {
        if (nextOpen) return;
        setSession(null);
        onCancelRef.current?.();
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Complete your payment</DialogTitle>
        </DialogHeader>
        {session && <iframe src={session.url} title="Hubtel checkout" className="h-140 w-full rounded-lg border border-border" />}
      </DialogContent>
    </Dialog>
  );

  return { open, node };
}
