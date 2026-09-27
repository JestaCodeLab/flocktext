import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageDetailBody, downloadCsv } from '@/components/messages/MessageDetailBody';
import { DeleteRecipientDialog } from '@/components/messages/DeleteRecipientDialog';
import { DeliveryTimeline } from '@/components/admin/DeliveryTimeline';
import {
  fetchAdminOrgMessageRecipients,
  resendFailedMessage,
  resendPendingMessage,
  resendSkippedMessage,
  resendOneRecipient,
  deleteMessageRecipient,
  type AdminOrgMessageStats,
} from '@/api/adminOrgMessages';
import { fetchAdminOrganizationDetail } from '@/api/adminOrganizations';
import { apiErrorMessage } from '@/api/client';

// Mirrors messageStatusBadge's label logic in AdminOrgDeliveryReportPage.tsx - any
// confirmed success wins first, regardless of other recipients failing/rejected/
// skipped (see adminOrgMessagesController.applyStatusFilter's comment) - duplicating
// the small label instead of exporting the full badge-variant helper.
function statusLabel(stats: AdminOrgMessageStats) {
  if (stats.delivered > 0 || stats.submitted > 0) return 'Delivered';
  if (stats.pending > 0) return 'Pending';
  if (stats.failed > 0) return `Failed (${stats.failed})`;
  if (stats.rejected > 0) return `Rejected (${stats.rejected})`;
  if (stats.skipped > 0) return `Skipped (${stats.skipped})`;
  return 'Delivered';
}

// Full-page delivery detail for a multi-recipient send, reached from
// AdminOrgDeliveryReportPage's "View details" action - single-recipient sends stay in
// that page's compact modal instead. Mirrors app/MessageReportPage.tsx (the org
// self-service equivalent), swapped over to the admin API/query-key conventions already
// used by AdminOrgDeliveryReportPage's dialog (pending-only resend, Provider column).
export function AdminOrgMessageReportPage() {
  const { id, messageId } = useParams<{ id: string; messageId: string }>();
  const orgId = id!;
  const queryClient = useQueryClient();

  const org = useQuery({
    queryKey: ['admin-org-detail', orgId],
    queryFn: () => fetchAdminOrganizationDetail(orgId),
    enabled: !!orgId,
  });

  const detail = useQuery({
    queryKey: ['admin-org-message-recipients', orgId, messageId],
    queryFn: () => fetchAdminOrgMessageRecipients(orgId, messageId!),
    enabled: !!messageId,
    // 'submitted' (BMS-confirmed, still resolving) also counts as unresolved here,
    // same as 'pending' - see lib/messageStatus.ts.
    refetchInterval: (query) =>
      (query.state.data?.stats.pending ?? 0) + (query.state.data?.stats.submitted ?? 0) > 0 ? 3000 : false,
  });

  // Once every recipient resolves, the list pages' cached rows/summary/chart go stale -
  // invalidate them the moment pending crosses from >0 to 0, same as MessageReportPage.
  const prevPendingRef = useRef<number | null>(null);
  useEffect(() => {
    const pendingNow = detail.data ? detail.data.stats.pending + detail.data.stats.submitted : undefined;
    if (pendingNow === undefined) return;
    if (prevPendingRef.current && prevPendingRef.current > 0 && pendingNow === 0) {
      queryClient.invalidateQueries({ queryKey: ['admin-org-messages', orgId] });
      queryClient.invalidateQueries({ queryKey: ['admin-org-messages-summary', orgId] });
      queryClient.invalidateQueries({ queryKey: ['admin-org-messages-chart', orgId] });
    }
    prevPendingRef.current = pendingNow;
  }, [detail.data?.stats.pending, detail.data?.stats.submitted, orgId, queryClient]);

  const resend = useMutation({
    mutationFn: () => resendPendingMessage(orgId, messageId!),
    onSuccess: (data) => {
      toast.success(`Resent — ${data.stats.delivered}/${data.stats.total} delivered.`);
      queryClient.invalidateQueries({ queryKey: ['admin-org-messages', orgId] });
      queryClient.invalidateQueries({ queryKey: ['admin-org-messages-summary', orgId] });
      queryClient.invalidateQueries({ queryKey: ['admin-org-messages-chart', orgId] });
      queryClient.invalidateQueries({ queryKey: ['admin-org-message-recipients', orgId, messageId] });
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const resendSkipped = useMutation({
    mutationFn: () => resendSkippedMessage(orgId, messageId!),
    onSuccess: (data) => {
      toast.success(`Resent — ${data.stats.delivered}/${data.stats.total} delivered.`);
      queryClient.invalidateQueries({ queryKey: ['admin-org-messages', orgId] });
      queryClient.invalidateQueries({ queryKey: ['admin-org-messages-summary', orgId] });
      queryClient.invalidateQueries({ queryKey: ['admin-org-messages-chart', orgId] });
      queryClient.invalidateQueries({ queryKey: ['admin-org-message-recipients', orgId, messageId] });
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  // Mirrors app/MessageReportPage.tsx's own "Resend to N failed" header button -
  // the org self-service equivalent this page is otherwise parity-matched with.
  const resendFailed = useMutation({
    mutationFn: () => resendFailedMessage(orgId, messageId!),
    onSuccess: (data) => {
      toast.success(`Resent — ${data.stats.delivered}/${data.stats.total} delivered.`);
      queryClient.invalidateQueries({ queryKey: ['admin-org-messages', orgId] });
      queryClient.invalidateQueries({ queryKey: ['admin-org-messages-summary', orgId] });
      queryClient.invalidateQueries({ queryKey: ['admin-org-messages-chart', orgId] });
      queryClient.invalidateQueries({ queryKey: ['admin-org-message-recipients', orgId, messageId] });
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const resendOne = useMutation({
    mutationFn: (recipientId: string) => resendOneRecipient(orgId, messageId!, recipientId),
    onSuccess: () => {
      toast.success('Message sent to this contact.');
      queryClient.invalidateQueries({ queryKey: ['admin-org-messages', orgId] });
      queryClient.invalidateQueries({ queryKey: ['admin-org-messages-summary', orgId] });
      queryClient.invalidateQueries({ queryKey: ['admin-org-messages-chart', orgId] });
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const deleteRecipient = useMutation({
    mutationFn: (recipientId: string) => deleteMessageRecipient(orgId, messageId!, recipientId),
    onSuccess: () => {
      toast.success('Contact removed.');
      queryClient.invalidateQueries({ queryKey: ['admin-org-message-recipients', orgId, messageId] });
      queryClient.invalidateQueries({ queryKey: ['admin-org-messages', orgId] });
      queryClient.invalidateQueries({ queryKey: ['admin-org-messages-summary', orgId] });
      setDeleteTarget(null);
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  function exportCsv() {
    if (!detail.data) return;
    const rows = [
      ['Name', 'Phone', 'Status', 'Reason', 'Delivered at', 'Provider'],
      ...detail.data.recipients.map((r) => [
        r.name,
        r.phone,
        r.status,
        r.reason,
        r.deliveredAt ? new Date(r.deliveredAt).toLocaleString() : '',
        r.provider === 'hubtel' ? 'Hubtel (backup)' : 'BMS',
      ]),
    ];
    downloadCsv(`org-${orgId}-message-${messageId}-recipients.csv`, rows);
  }

  const isPending = detail.data ? statusLabel(detail.data.stats) === 'Pending' : false;
  const failedCount = (detail.data?.stats.failed ?? 0) + (detail.data?.stats.rejected ?? 0);

  return (
    <div>
      <Link
        to={`/admin/organizations/${orgId}/delivery-report`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to {org.data?.churchName || 'organization'} delivery report
      </Link>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-1 text-[26px] font-bold">Delivery Details</div>
          <div className="text-sm text-muted-foreground">Per-recipient delivery breakdown for this send.</div>
        </div>
        <div className="flex flex-wrap gap-2">
          {isPending && (
            <Button disabled={resend.isPending} onClick={() => resend.mutate()}>
              <RotateCcw className="h-[15px] w-[15px]" /> {resend.isPending ? 'Resending…' : 'Resend to pending recipients'}
            </Button>
          )}
          {failedCount > 0 && (
            <Button disabled={resendFailed.isPending} onClick={() => resendFailed.mutate()}>
              <RotateCcw className="h-[15px] w-[15px]" /> {resendFailed.isPending ? 'Resending…' : `Resend to ${failedCount} failed`}
            </Button>
          )}
        </div>
      </div>

      {detail.isLoading && (
        <div className="space-y-2.5">
          <Skeleton className="h-[60px] rounded-xl" />
          <Skeleton className="h-[60px] rounded-xl" />
          <Skeleton className="h-[200px] rounded-xl" />
        </div>
      )}

      {detail.data && (
        <>
          <DeliveryTimeline detail={detail.data} />
          <MessageDetailBody
            detail={detail.data}
            variant="page"
            onExportCsv={exportCsv}
            onResendSkipped={() => resendSkipped.mutate()}
            resendingSkipped={resendSkipped.isPending}
            onResendOne={(recipientId) => resendOne.mutate(recipientId)}
            resendingOneId={resendOne.isPending ? resendOne.variables : null}
            onRequestDeleteRecipient={(recipientId, recipientName) => setDeleteTarget({ id: recipientId, name: recipientName })}
            deletingRecipientId={deleteRecipient.isPending ? deleteRecipient.variables : null}
            showProvider
          />
        </>
      )}

      <DeleteRecipientDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        recipientName={deleteTarget?.name}
        isPending={deleteRecipient.isPending}
        onConfirm={() => deleteTarget && deleteRecipient.mutate(deleteTarget.id)}
      />
    </div>
  );
}
