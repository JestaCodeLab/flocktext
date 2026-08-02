export type Role = 'admin' | 'user';

export interface SessionUser {
  id: string;
  name: string;
  phone: string;
  email: string;
}

// Role/isFounder are scoped to the currently active organization, not the
// person - the same user can be admin in one account and a plain member of
// another, so this lives separately from SessionUser.
export interface SessionMembership {
  role: Role;
  isFounder: boolean;
}

export interface Account {
  organizationId: string;
  churchName: string;
  role: Role;
  isFounder: boolean;
  isActive: boolean;
}

export interface SenderIdRequest {
  id: string;
  senderId: string;
  purpose: string;
  status: 'pending_review' | 'processing' | 'approved' | 'rejected' | 'deleted';
  rejectionReason: string;
  bmsStatus: string;
  isPrimary: boolean;
}

export interface NotifPrefs {
  lowBalance: boolean;
  lowBalanceThreshold: number;
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
  onboardingCompletedAt: string | null;
}

export interface Session {
  user: SessionUser;
  organization: SessionOrganization;
  membership: SessionMembership;
}
