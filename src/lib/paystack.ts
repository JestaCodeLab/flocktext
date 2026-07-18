interface PaystackSetupOptions {
  key: string;
  email: string;
  amount: number;
  ref: string;
  currency?: string;
  subaccount?: string;
  metadata?: Record<string, unknown>;
  onClose: () => void;
  callback: (response: { reference: string }) => void;
}

interface PaystackPop {
  setup: (options: PaystackSetupOptions) => { openIframe: () => void };
}

declare global {
  interface Window {
    PaystackPop?: PaystackPop;
  }
}

const SCRIPT_SRC = 'https://js.paystack.co/v1/inline.js';
let scriptPromise: Promise<void> | null = null;

function loadPaystackScript() {
  if (window.PaystackPop) return Promise.resolve();
  scriptPromise ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load the Paystack checkout script.'));
    document.body.appendChild(script);
  });
  return scriptPromise;
}

// Opens Paystack's Inline checkout as an in-page overlay instead of redirecting
// away to Paystack's hosted page. Talks to Paystack directly from the browser
// using the public key - the backend only needs to have minted `reference`
// beforehand (see addonController.initializePurchase) so it can verify /
// webhook against the same identifier afterward.
export async function openPaystackPopup(options: {
  email: string;
  amountGHS: number;
  reference: string;
  subaccountCode?: string;
  metadata?: Record<string, unknown>;
  onSuccess: (reference: string) => void;
  onClose?: () => void;
}) {
  const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
  if (!publicKey) throw new Error('Payments are not configured on this device. Missing Paystack public key.');

  await loadPaystackScript();
  if (!window.PaystackPop) throw new Error('Failed to load the Paystack checkout.');

  const handler = window.PaystackPop.setup({
    key: publicKey,
    email: options.email,
    amount: Math.round(options.amountGHS * 100),
    ref: options.reference,
    currency: 'GHS',
    subaccount: options.subaccountCode,
    metadata: options.metadata,
    onClose: () => options.onClose?.(),
    callback: (response) => options.onSuccess(response.reference),
  });
  handler.openIframe();
}
