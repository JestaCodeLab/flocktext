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
  walletBalanceGHS: number;
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
  walletBalanceGHS: number;
  walletStatus: 'pending' | 'done' | 'skipped';
  onboardingCompletedAt: string | null;
}

export type InitializeTopupResult = ({ mode: 'stub' } & TopupResult) | { mode: 'redirect'; authorizationUrl: string; reference: string };

export async function initializeTopup(ghs: number) {
  const { data } = await api.post<InitializeTopupResult>('/wallet/topup/initialize', { ghs });
  return data;
}

export async function verifyTopup(reference: string) {
  const { data } = await api.get<TopupResult>(`/wallet/topup/verify/${encodeURIComponent(reference)}`);
  return data;
}
