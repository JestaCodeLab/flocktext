import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

// Dedicated chrome-less landing page for Hubtel's returnUrl/cancellationUrl when the
// checkout is embedded in an iframe (see lib/hubtelCheckout.tsx) - Hubtel navigates the
// iframe here once payment finishes, and this page's only job is to relay the outcome
// back to whichever window opened it via postMessage, so that window can close the
// iframe and verify the payment. Never rendered outside an iframe in normal use.
export function HubtelCheckoutCompletePage() {
  const [params] = useSearchParams();

  useEffect(() => {
    const reference = params.get('reference');
    const outcome = params.get('outcome') === 'success' ? 'success' : 'cancelled';
    if (!reference || window.parent === window) return;

    window.parent.postMessage({ source: 'flocktext-hubtel-checkout', reference, outcome }, window.location.origin);
  }, [params]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6 text-center text-sm text-muted-foreground">
      Finishing up your payment…
    </div>
  );
}
