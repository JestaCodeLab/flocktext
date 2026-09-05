export interface AdminSessionAdmin {
  id: string;
  name: string;
  email: string;
}

export interface AdminSession {
  admin: AdminSessionAdmin;
}

// Product-lifecycle stage - distinct from `status` (account standing: active/suspended).
// See api/services/orgLifecycle.js for the classification rules.
export type OrgStage = 'otp_pending' | 'onboarding_incomplete' | 'onboarded_no_sms' | 'activated';
export type OrgSubStage = 'engaged' | 'at_risk' | 'dormant';

export interface AdminOrgListItem {
  id: string;
  churchName: string;
  status: 'active' | 'suspended';
  walletBalanceCredits: number;
  memberCount: number;
  messageCount: number;
  createdAt: string;
  stage: OrgStage;
  subStage: OrgSubStage | null;
  founderUserId: string | null;
  founderEmail: string | null;
  founderPhone: string | null;
  founderVerifiedAt: string | null;
  onboardingCurrentStep: number;
  onboardingCompletedAt: string | null;
  senderIdStatus: SenderIdStatus | null;
  firstSentAt: string | null;
  lastSentAt: string | null;
}

export interface AdminOrgFunnelSummary {
  total: number;
  otpPending: number;
  onboardingIncomplete: number;
  onboardedNoSms: number;
  activated: { total: number; engaged: number; atRisk: number; dormant: number };
}

export interface AdminOrgUser {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: 'admin' | 'user';
  isVerified: boolean;
  lastLoginAt: string | null;
  registeredVia: 'web' | 'mobile';
}

export type SenderIdStatus = 'pending_review' | 'processing' | 'approved' | 'rejected' | 'deleted';

export interface AdminSenderId {
  id: string;
  senderId: string;
  purpose: string;
  status: SenderIdStatus;
  rejectionReason: string;
  bmsStatus: string;
  isPrimary: boolean;
  createdAt: string;
  // Never includes the secret - just whether this sender ID's backup-provider (Hubtel)
  // credentials have been set.
  hubtelConfigured: boolean;
}

export interface AdminTemplate {
  id: string;
  name: string;
  body: string;
  preview: string;
  createdAt: string;
}

export interface AdminApiKey {
  id: string;
  label: string;
  keyPrefix: string;
  lastUsedAt: string | null;
  createdAt: string;
  revoked: boolean;
}

export interface AdminOrgDetail {
  id: string;
  churchName: string;
  address: string;
  contactEmail: string;
  status: 'active' | 'suspended';
  walletBalanceCredits: number;
  senderIds: AdminSenderId[];
  createdAt: string;
  users: AdminOrgUser[];
  contactsCount: number;
  messagesTotal: number;
  sentThisMonth: number;
  deliveredThisMonth: number;
  onboardingCompletedAt: string | null;
  firstMessageSentAt: string | null;
  apiKeys: AdminApiKey[];
}

export interface AdminPackage {
  id: string;
  ghs: number;
  credits: number;
  label: string;
  badge: string;
  active: boolean;
  sortOrder: number;
}

export interface AdminSenderIdPendingEntry {
  orgId: string;
  churchName: string;
  senderIdId: string;
  senderId: string;
  purpose: string;
  submittedAt: string;
}

export interface AdminSenderIdRow extends AdminSenderIdPendingEntry {
  status: SenderIdStatus;
  rejectionReason: string;
  bmsStatus: string;
  isPrimary: boolean;
}

export interface AdminAddon {
  id: string;
  key: string;
  name: string;
  description: string;
  ghs: number;
  active: boolean;
}

export type AnnouncementStatus = 'queued' | 'sending' | 'sent' | 'failed';
export type AnnouncementType = 'sms' | 'feature';

export interface AnnouncementMediaItem {
  kind: 'image' | 'video';
  url: string;
}

export interface AnnouncementLinkItem {
  label: string;
  url: string;
}

export interface AdminAnnouncement {
  id: string;
  type: AnnouncementType;
  title: string;
  message: string;
  subtext: string;
  media: AnnouncementMediaItem[];
  links: AnnouncementLinkItem[];
  status: AnnouncementStatus;
  createdBy: { id: string; name: string } | null;
  orgsTargeted: number;
  notificationsCreated: number;
  pushTokensTargeted: number;
  pushSent: number;
  pushFailed: number;
  error: string;
  createdAt: string;
  processedAt: string | null;
}

export interface AdminTopOrganization {
  id: string;
  churchName: string;
  messagesSent: number;
  walletBalanceCredits: number;
}

export interface AdminDashboardSummary {
  totalOrganizations: number;
  activeOrganizations: number;
  messagesSent: number;
  messagesDelivered: number;
  pendingSenderIdCount: number;
  totalTransactions: number;
  topOrganizations: AdminTopOrganization[];
}

export interface AdminDashboardChartBucket {
  date: string;
  label: string;
  messagesSent: number;
  creditsUsed: number;
}

export interface AdminDashboardChart {
  buckets: AdminDashboardChartBucket[];
}
