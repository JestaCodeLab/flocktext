import { useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageDetailBody, downloadCsv } from '@/components/messages/MessageDetailBody';
import { DeliveryTimeline } from '@/components/admin/DeliveryTimeline';
import { fetchAdminOrgMessageRecipients, resendPendingMessage, type AdminOrgMessageStats } from '@/api/adminOrgMessages';
import { fetchAdminOrganizationDetail } from '@/api/adminOrganizations';
import { apiErrorMessage } from '@/api/client';

// Mirrors messageStatusBadge's label logic in AdminOrgDeliveryReportPage.tsx - only the
// "Pending" check is needed here (there's no admin equivalent of "resend failed"), so
// duplicating the small label instead of exporting the full badge-variant helper.
function statusLabel(stats: AdminOrgMessageStats) {
  if (stats.failed > 0) return `Failed (${stats.failed})`;
  if (stats.rejected > 0) return `Rejected (${stats.rejected})`;
  if (stats.pending > 0) return 'Pending';
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
    refetchInterval: (query) => ((query.state.data?.stats.pending ?? 0) > 0 ? 3000 : false),
  });

  // Once every recipient resolves, the list pages' cached rows/summary/chart go stale -
  // invalidate them the moment pending crosses from >0 to 0, same as MessageReportPage.
  const prevPendingRef = useRef<number | null>(null);
  useEffect(() => {
    const pendingNow = detail.data?.stats.pending;
    if (pendingNow === undefined) return;
    if (prevPendingRef.current && prevPendingRef.current > 0 && pendingNow === 0) {
      queryClient.invalidateQueries({ queryKey: ['admin-org-messages', orgId] });
      queryClient.invalidateQueries({ queryKey: ['admin-org-messages-summary', orgId] });
      queryClient.invalidateQueries({ queryKey: ['admin-org-messages-chart', orgId] });
    }
    prevPendingRef.current = pendingNow;
  }, [detail.data?.stats.pending, orgId, queryClient]);

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
        {isPending && (
          <Button disabled={resend.isPending} onClick={() => resend.mutate()}>
            <RotateCcw className="h-[15px] w-[15px]" /> {resend.isPending ? 'Resending…' : 'Resend to pending recipients'}
          </Button>
        )}
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
          <MessageDetailBody detail={detail.data} variant="page" onExportCsv={exportCsv} showProvider />
        </>
      )}
    </div>
  );
}
