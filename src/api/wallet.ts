import { api } from '@/api/client';

export interface CreditPackage {
  ghs: number;
  credits: number;
  label: string;
  badge?: string;
  perSms: string;
}

export type WalletTransactionType = 'topup' | 'debit' | 'free_trial' | 'admin_adjustment';

export interface WalletTransaction {
  id: string;
  type: WalletTransactionType;
  label: string;
  credits: number;
  amountGHS: number;
  date: string;
}

export interface WalletOverview {
  walletBalanceCredits: number;
  creditsUsed: number;
  packages: CreditPackage[];
  transactions: WalletTransaction[];
}

export async function fetchWallet() {
  const { data } = await api.get<WalletOverview>('/wallet');
  return data;
}

export interface TopupResult {
  walletBalanceCredits: number;
}

export type InitializeTopupResult =
  | ({ mode: 'stub' } & TopupResult)
  | {
      mode: 'checkout';
      reference: string;
      amountGHS: number;
      // Only set for the Paystack Inline path - omitted when `authorization_url` is
      // present instead (see below).
      email?: string;
      organizationId: string;
      packageGhs: number;
      subaccountCode?: string;
      // Present when the frontend should redirect/embed a checkout page rather than open
      // Paystack Inline - either a caller-requested Paystack redirect (`redirect: true`)
      // or, when the API's PAYMENT_PROVIDER is set to Hubtel, every checkout (Hubtel has
      // no Inline-popup equivalent). `checkoutDisplay` only matters in the latter case -
      // see lib/hubtelCheckout.tsx for how both are consumed.
      authorization_url?: string;
      checkoutDisplay?: 'iframe' | 'redirect';
    };

export async function initializeTopup(ghs: number) {
  // returnPath only matters if the API is configured for Hubtel's 'redirect' display
  // mode - it's where the browser lands back after a full-page checkout redirect.
  const { data } = await api.post<InitializeTopupResult>('/wallet/topup/initialize', { ghs, returnPath: '/app/wallet' });
  return data;
}

export async function verifyTopup(reference: string) {
  const { data } = await api.get<TopupResult>(`/wallet/topup/verify/${encodeURIComponent(reference)}`);
  return data;
}
