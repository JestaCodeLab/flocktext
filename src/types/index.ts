export type Role = 'admin' | 'user';

export interface SessionUser {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: Role;
}

export interface SenderIdRequest {
  id: string;
  senderId: string;
  purpose: string;
  status: 'pending_review' | 'pending_bms' | 'approved' | 'rejected';
  rejectionReason: string;
  bmsStatus: string;
  isPrimary: boolean;
}

export interface NotifPrefs {
  lowBalance: boolean;
  scheduleConfirm: boolean;
  deliverySummary: boolean;
}

export interface SessionOrganization {
  id: string;
  churchName: string;
  address: string;
  organizationType: 'church' | 'business' | 'institution';
  contactEmail: string;
  notifPrefs: NotifPrefs;
  walletBalanceCredits: number;
  senderIds: SenderIdRequest[];
  onboardingStep: number;
  contactsStatus: 'pending' | 'done' | 'skipped';
  walletStatus: 'pending' | 'done' | 'skipped';
  onboardingCompletedAt: string | null;
}

export interface Session {
  user: SessionUser;
  organization: SessionOrganization;
}
