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

// bmsStatus is free text straight from BMS's own API (see
// smsProvider.checkSenderIdStatus), separate from our own `status` enum - a
// sender ID can still be sitting at status: 'processing' here while BMS has
// already rejected it on their side (an admin has to "Check BMS status" to
// even see that, since it never auto-updates `status`). Used to hide the
// Approve action once that's true, so an admin can't approve something BMS
// has already turned down.
export function isBmsRejected(bmsStatus: string | null | undefined): boolean {
  return (bmsStatus ?? '').trim().toLowerCase() === 'rejected';
}
