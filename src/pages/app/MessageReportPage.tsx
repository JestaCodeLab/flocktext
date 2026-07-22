import { useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageDetailBody, downloadCsv } from '@/components/messages/MessageDetailBody';
import { fetchMessageRecipients, resendFailedMessage } from '@/api/messages';
import { apiErrorMessage } from '@/api/client';
import { useAuthStore } from '@/store/authStore';

export function MessageReportPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const updateOrganization = useAuthStore((s) => s.updateOrganization);

  const detail = useQuery({
    queryKey: ['message-recipients', id],
    queryFn: () => fetchMessageRecipients(id!),
    enabled: !!id,
    // Keep polling while delivery is still resolving so the breakdown updates live.
    refetchInterval: (query) => ((query.state.data?.stats.pending ?? 0) > 0 ? 3000 : false),
  });

  // The flat Delivered/Failed lists only fetch on mount + manual refresh, so once this
  // message finishes resolving here, nudge them to pick it up on the next visit.
  const prevPendingRef = useRef<number | null>(null);
  useEffect(() => {
    const pending = detail.data?.stats.pending;
    if (pending === undefined) return;
    if (prevPendingRef.current !== null && prevPendingRef.current > 0 && pending === 0) {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    }
    prevPendingRef.current = pending;
  }, [detail.data?.stats.pending, queryClient]);

  const resend = useMutation({
    mutationFn: () => resendFailedMessage(id!),
    onSuccess: (data) => {
      toast.success(`Resent — ${data.stats.delivered}/${data.stats.total} delivered.`);
      updateOrganization({ walletBalanceCredits: data.walletBalanceCredits });
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  function exportCsv() {
    if (!detail.data) return;
    const rows = [
      ['Name', 'Phone', 'Status', 'Reason', 'Delivered at'],
      ...detail.data.recipients.map((r) => [r.name, r.phone, r.status, r.reason, r.deliveredAt ? new Date(r.deliveredAt).toLocaleString() : '']),
    ];
    downloadCsv(`message-${id}-recipients.csv`, rows);
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => navigate('/app/reports')}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Delivery Reports
      </button>

      <div className="mb-6">
        <div className="mb-1 text-[26px] font-bold">Delivery Details</div>
        <div className="text-sm text-muted-foreground">Per-recipient delivery breakdown for this send.</div>
      </div>

      {detail.isLoading && (
        <div className="space-y-2.5">
          <Skeleton className="h-[60px] rounded-xl" />
          <Skeleton className="h-[60px] rounded-xl" />
          <Skeleton className="h-[200px] rounded-xl" />
        </div>
      )}

      {detail.data && (
        <MessageDetailBody detail={detail.data} onExportCsv={exportCsv} onResend={() => resend.mutate()} resending={resend.isPending} />
      )}
    </div>
  );
}
