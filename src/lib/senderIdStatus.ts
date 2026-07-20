export type SenderIdStatusValue = 'pending_review' | 'pending_bms' | 'approved' | 'rejected' | 'deleted';

export const senderIdStatusLabel: Record<SenderIdStatusValue, string> = {
  pending_review: 'Pending review',
  pending_bms: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  deleted: 'Deleted',
};

export const senderIdStatusVariant: Record<SenderIdStatusValue, 'default' | 'secondary' | 'destructive'> = {
  pending_review: 'secondary',
  pending_bms: 'secondary',
  approved: 'default',
  rejected: 'destructive',
  deleted: 'destructive',
};
