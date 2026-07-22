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

export async function fetchAddons() {
  const { data } = await api.get<AddonsOverview>('/addons');
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

export async function initializeAddonPurchase(key: string) {
  const { data } = await api.post<InitializeAddonPurchaseResult>(`/addons/${key}/purchase/initialize`);
  return data;
}

export async function verifyAddonPurchase(reference: string) {
  const { data } = await api.get<AddonEntitlements>(`/addons/purchase/verify/${encodeURIComponent(reference)}`);
  return data;
}
