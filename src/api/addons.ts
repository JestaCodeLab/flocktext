import { api } from '@/api/client';

export interface AddonCatalogItem {
  key: string;
  name: string;
  description: string;
  ghs: number;
}

export interface AddonEntitlements {
  birthdayUnlocked: boolean;
  purchasedSeats: number;
}

export interface AddonsOverview extends AddonEntitlements {
  addons: AddonCatalogItem[];
}

// Seats and addons are billed per organization, so every call can name one.
// Omitting it targets whichever account the caller is switched into; passing
// one targets another of their accounts (they must be an admin of it to buy).
function addonPath(organizationId?: string) {
  return organizationId ? `/memberships/${organizationId}/addons` : '/addons';
}

export async function fetchAddons(organizationId?: string) {
  const { data } = await api.get<AddonsOverview>(addonPath(organizationId));
  return data;
}

export type InitializeAddonPurchaseResult =
  | ({ mode: 'stub' } & AddonEntitlements)
  | {
      mode: 'checkout';
      reference: string;
      amountGHS: number;
      // Only set for the Paystack Inline path - omitted when `authorization_url` is
      // present instead (see below).
      email?: string;
      organizationId: string;
      addonKey: string;
      subaccountCode?: string;
      // Present when the frontend should redirect/embed a checkout page rather than open
      // Paystack Inline - either a caller-requested Paystack redirect (`redirect: true`)
      // or, when the API's PAYMENT_PROVIDER is set to Hubtel, every checkout (Hubtel has
      // no Inline-popup equivalent). `checkoutDisplay` only matters in the latter case -
      // see lib/hubtelCheckout.tsx for how both are consumed.
      authorization_url?: string;
      checkoutDisplay?: 'iframe' | 'redirect';
    };

export async function initializeAddonPurchase(key: string, organizationId?: string) {
  // returnPath only matters if the API is configured for Hubtel's 'redirect' display
  // mode - it's where the browser lands back after a full-page checkout redirect.
  const { data } = await api.post<InitializeAddonPurchaseResult>(`${addonPath(organizationId)}/${key}/purchase/initialize`, {
    returnPath: window.location.pathname,
  });
  return data;
}

export async function verifyAddonPurchase(reference: string, organizationId?: string) {
  const { data } = await api.get<AddonEntitlements>(
    `${addonPath(organizationId)}/purchase/verify/${encodeURIComponent(reference)}`
  );
  return data;
}
