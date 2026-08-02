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
      email: string;
      organizationId: string;
      addonKey: string;
      subaccountCode?: string;
      // Only present when the request passed `redirect: true` - this app uses
      // Paystack Inline instead, so `initializeAddonPurchase` below never sets it.
      authorization_url?: string;
    };

export async function initializeAddonPurchase(key: string, organizationId?: string) {
  const { data } = await api.post<InitializeAddonPurchaseResult>(`${addonPath(organizationId)}/${key}/purchase/initialize`);
  return data;
}

export async function verifyAddonPurchase(reference: string, organizationId?: string) {
  const { data } = await api.get<AddonEntitlements>(
    `${addonPath(organizationId)}/purchase/verify/${encodeURIComponent(reference)}`
  );
  return data;
}
