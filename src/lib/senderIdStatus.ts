export type SenderIdStatusValue = 'pending_review' | 'processing' | 'approved' | 'rejected' | 'deleted';

export const senderIdStatusLabel: Record<SenderIdStatusValue, string> = {
  pending_review: 'Pending review',
  processing: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  deleted: 'Deleted',
};

export const senderIdStatusVariant: Record<SenderIdStatusValue, 'default' | 'secondary' | 'destructive'> = {
  pending_review: 'secondary',
  processing: 'secondary',
  approved: 'default',
  rejected: 'destructive',
  deleted: 'destructive',
};
