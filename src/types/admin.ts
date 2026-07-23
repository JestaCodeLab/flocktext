export interface AdminSessionAdmin {
  id: string;
  name: string;
  email: string;
}

export interface AdminSession {
  admin: AdminSessionAdmin;
}

export interface AdminOrgListItem {
  id: string;
  churchName: string;
  status: 'active' | 'suspended';
  walletBalanceCredits: number;
  memberCount: number;
  messageCount: number;
  createdAt: string;
}

export interface AdminOrgUser {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: 'admin' | 'user';
  isVerified: boolean;
  lastLoginAt: string | null;
}

export type SenderIdStatus = 'pending_review' | 'processing' | 'approved' | 'rejected' | 'deleted';

export interface AdminSenderId {
  senderId: string;
  purpose: string;
  status: SenderIdStatus;
  rejectionReason: string;
  bmsStatus: string;
  isPrimary: boolean;
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

export interface AdminAnnouncement {
  id: string;
  title: string;
  message: string;
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

export interface AdminDashboardSummary {
  totalOrganizations: number;
  activeOrganizations: number;
  suspendedOrganizations: number;
  sentThisMonth: number;
  deliveredThisMonth: number;
  totalWalletCredits: number;
  pendingSenderIdCount: number;
}
