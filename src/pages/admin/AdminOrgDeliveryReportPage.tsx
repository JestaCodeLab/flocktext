import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  MoreVertical,
  RefreshCw,
  RotateCcw,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  CreditCard,
  TrendingUp,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { DateRangeFilter } from '@/components/filters/DateRangeFilter';
import { MessageDetailBody, MiniStatCard, downloadCsv } from '@/components/messages/MessageDetailBody';
import { ResendPendingDialog } from '@/components/admin/ResendPendingDialog';
import {
  fetchAdminOrgMessagesSummary,
  fetchAdminOrgMessagesChart,
  fetchAdminOrgMessages,
  fetchAdminOrgMessageRecipients,
  fetchAdminOrgMessagesExport,
  resendPendingMessage,
  type AdminOrgMessageStatus,
  type AdminOrgMessageSummary,
} from '@/api/adminOrgMessages';
import { fetchAdminOrganizationDetail } from '@/api/adminOrganizations';
import { apiErrorMessage } from '@/api/client';
import type { DateRangeParams } from '@/lib/dateRange';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 20;

// Matches the row-level badge used throughout the app: "Failed" means at least one
// recipient failed, "Pending" means nothing has failed yet but delivery is still
// resolving, otherwise every recipient resolved cleanly.
function messageStatusBadge(stats: AdminOrgMessageSummary['stats']) {
  if (stats.failed > 0) return { variant: 'destructive' as const, label: `Failed (${stats.failed})` };
  if (stats.pending > 0) return { variant: 'secondary' as const, label: 'Pending' };
  return { variant: 'success' as const, label: 'Delivered' };
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
      <div className="mb-1 font-semibold text-popover-foreground">{label}</div>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-1.5 text-muted-foreground">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
          {entry.name}: <span className="font-semibold text-popover-foreground">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

// Long ranges roll up into weekly chart buckets (see adminOrgMessagesController.chart) -
// skip enough X-axis ticks that labels stay readable instead of overlapping.
function xAxisInterval(bucketCount: number) {
  return bucketCount <= 10 ? 0 : Math.ceil(bucketCount / 8) - 1;
}

function PaginationControls({ page, total, onPageChange }: { page: number; total: number; onPageChange: (page: number) => void }) {
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (totalPages <= 1) return null;

  const start = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const end = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="mt-3 flex items-center justify-between">
      <div className="text-xs text-muted-foreground">
        Showing {start}–{end} of {total}
      </div>
      <div className="flex items-center gap-1.5">
        <Button size="icon-sm" variant="outline" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>
        <div className="px-1 text-xs font-semibold text-muted-foreground">
          Page {page} of {totalPages}
        </div>
        <Button size="icon-sm" variant="outline" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

function MessagesTable({
  rows,
  onView,
  onResendPending,
  resendingId,
}: {
  rows: AdminOrgMessageSummary[];
  onView: (row: AdminOrgMessageSummary) => void;
  onResendPending?: (id: string) => void;
  resendingId?: string | null;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="bg-secondary hover:bg-secondary">
            <TableHead>Date</TableHead>
            <TableHead>Message</TableHead>
            <TableHead>Recipients</TableHead>
            <TableHead className="text-center">Total</TableHead>
            <TableHead>Sender ID</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-0">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((m) => {
            const status = messageStatusBadge(m.stats);
            return (
              <TableRow key={m.id}>
                <TableCell>
                  <div className="font-medium text-foreground">
                    {new Date(m.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(m.date).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true })}
                  </div>
                </TableCell>
                <TableCell className="max-w-[260px] truncate text-muted-foreground">{m.preview}</TableCell>
                <TableCell className="max-w-[180px] truncate text-muted-foreground">{m.recipients}</TableCell>
                <TableCell className="text-center text-muted-foreground">{m.stats.total}</TableCell>
                <TableCell className="text-muted-foreground">{m.senderId}</TableCell>
                <TableCell>
                  <Badge variant={status.variant}>{status.label}</Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button size="icon-sm" variant="ghost" title="Actions">
                          <MoreVertical className="h-3.5 w-3.5" />
                        </Button>
                      }
                    />
                    <DropdownMenuContent align="end" className="w-42">
                      <DropdownMenuItem className="cursor-pointer" onClick={() => onView(m)}>
                        <Eye className="h-3 w-3" /> View details
                      </DropdownMenuItem>
                      {onResendPending && (
                        <DropdownMenuItem
                          className="cursor-pointer"
                          disabled={resendingId === m.id}
                          onClick={() => onResendPending(m.id)}
                        >
                          <RotateCcw className="h-3 w-3" /> Resend
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                <div className="flex flex-col items-center gap-2">
                  <Send className="h-5 w-5 text-muted-foreground" />
                  No messages here.
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export function AdminOrgDeliveryReportPage() {
  const { id } = useParams<{ id: string }>();
  const orgId = id!;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [range, setRange] = useState<DateRangeParams>({ preset: 'this_month' });
  const [activeTab, setActiveTab] = useState<AdminOrgMessageStatus>('delivered');
  const [deliveredPage, setDeliveredPage] = useState(1);
  const [pendingPage, setPendingPage] = useState(1);
  const [failedPage, setFailedPage] = useState(1);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [resendConfirmId, setResendConfirmId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // A new filter changes the result set, so a page number from the old one may no
  // longer exist - snap every tab back to page 1 whenever the range changes.
  useEffect(() => {
    setDeliveredPage(1);
    setPendingPage(1);
    setFailedPage(1);
  }, [range]);

  const org = useQuery({
    queryKey: ['admin-org-detail', orgId],
    queryFn: () => fetchAdminOrganizationDetail(orgId),
    enabled: !!orgId,
  });
  const summary = useQuery({
    queryKey: ['admin-org-messages-summary', orgId, range],
    queryFn: () => fetchAdminOrgMessagesSummary(orgId, range),
  });
  const chart = useQuery({
    queryKey: ['admin-org-messages-chart', orgId, range],
    queryFn: () => fetchAdminOrgMessagesChart(orgId, range),
  });

  const delivered = useQuery({
    queryKey: ['admin-org-messages', orgId, 'delivered', range, deliveredPage],
    queryFn: () => fetchAdminOrgMessages(orgId, 'delivered', range, { page: deliveredPage, pageSize: PAGE_SIZE }),
  });
  const pending = useQuery({
    queryKey: ['admin-org-messages', orgId, 'pending', range, pendingPage],
    queryFn: () => fetchAdminOrgMessages(orgId, 'pending', range, { page: pendingPage, pageSize: PAGE_SIZE }),
  });
  const failed = useQuery({
    queryKey: ['admin-org-messages', orgId, 'failed', range, failedPage],
    queryFn: () => fetchAdminOrgMessages(orgId, 'failed', range, { page: failedPage, pageSize: PAGE_SIZE }),
  });

  const detail = useQuery({
    queryKey: ['admin-org-message-recipients', orgId, viewingId],
    queryFn: () => fetchAdminOrgMessageRecipients(orgId, viewingId!),
    enabled: !!viewingId,
  });

  // A single-recipient send opens the compact modal below; anything more goes to the
  // full delivery detail page - same split as ReportsPage.handleView on the org
  // self-service side.
  function handleView(row: AdminOrgMessageSummary) {
    if (row.stats.total <= 1) {
      setViewingId(row.id);
    } else {
      navigate(`/admin/organizations/${orgId}/delivery-report/${row.id}`);
    }
  }

  function invalidateAll() {
    queryClient.invalidateQueries({ queryKey: ['admin-org-messages', orgId] });
    queryClient.invalidateQueries({ queryKey: ['admin-org-messages-summary', orgId] });
    queryClient.invalidateQueries({ queryKey: ['admin-org-messages-chart', orgId] });
  }

  const resend = useMutation({
    mutationFn: (messageId: string) => resendPendingMessage(orgId, messageId),
    onSuccess: (data) => {
      toast.success(`Resent — ${data.stats.delivered}/${data.stats.total} delivered.`);
      invalidateAll();
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  function exportRecipientsCsv() {
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
    downloadCsv(`org-${orgId}-message-${viewingId}-recipients.csv`, rows);
  }

  async function exportFiltered() {
    setIsExporting(true);
    try {
      const data = await fetchAdminOrgMessagesExport(orgId, activeTab, range);
      const rows = [
        ['Date', 'Message', 'Recipients', 'Sender ID', 'Total', 'Delivered', 'Failed', 'Pending', 'Credit cost'],
        ...data.rows.map((r) => [
          new Date(r.date).toLocaleString(),
          r.body,
          r.recipients,
          r.senderId,
          String(r.total),
          String(r.delivered),
          String(r.failed),
          String(r.pending),
          String(r.creditCost),
        ]),
      ];
      downloadCsv(`org-${orgId}-${activeTab}-messages.csv`, rows);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setIsExporting(false);
    }
  }

  const isFetching = delivered.isFetching || pending.isFetching || failed.isFetching || summary.isFetching || chart.isFetching;
  const buckets = chart.data?.buckets ?? [];
  const detailStatus = detail.data ? messageStatusBadge(detail.data.stats) : null;

  return (
    <div>
      <Link
        to={`/admin/organizations/${orgId}`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to {org.data?.churchName || 'organization'}
      </Link>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-[26px] font-extrabold">Delivery Report</div>
          <div className="mt-0.5 text-sm text-muted-foreground">
            {org.data?.churchName ?? 'Organization'} — messages sent to its own contacts.
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            size="sm"
            variant="outline"
            disabled={isFetching}
            onClick={() => {
              summary.refetch();
              chart.refetch();
              delivered.refetch();
              pending.refetch();
              failed.refetch();
            }}
          >
            <RefreshCw className={cn('h-3.5 w-3.5', isFetching && 'animate-spin')} />
            Refresh
          </Button>
          <DateRangeFilter range={range} onChange={setRange} size="sm" />
        </div>
      </div>

      {summary.isLoading ? (
        <div className="mb-6 grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[68px] rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="mb-6 grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-6">
          <MiniStatCard icon={Send} label="Sent" value={summary.data?.messagesSent ?? 0} tint="muted" />
          <MiniStatCard icon={CheckCircle2} label="Delivered" value={summary.data?.delivered ?? 0} tint="success" />
          <MiniStatCard icon={XCircle} label="Failed" value={summary.data?.failed ?? 0} tint="destructive" />
          <MiniStatCard icon={Clock} label="Pending" value={summary.data?.pending ?? 0} tint="blue" />
          <MiniStatCard icon={TrendingUp} label="Delivery Rate" value={`${summary.data?.deliveryRate ?? 0}%`} tint="primary" />
          <MiniStatCard icon={CreditCard} label="Credits Used" value={(summary.data?.creditsUsed ?? 0).toLocaleString()} tint="muted" />
        </div>
      )}

      <div className="mb-6 rounded-xl border border-border bg-card p-4">
        <div className="mb-4 text-[13px] font-bold text-foreground/80">Delivery over time</div>
        {chart.isLoading ? (
          <Skeleton className="h-[240px] w-full rounded-lg" />
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={buckets} barGap={4}>
              <CartesianGrid vertical={false} stroke="var(--color-border)" />
              <XAxis
                dataKey="label"
                interval={xAxisInterval(buckets.length)}
                tickLine={false}
                axisLine={false}
                tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }}
              />
              <YAxis tickLine={false} axisLine={false} width={28} tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }} allowDecimals={false} />
              <Tooltip cursor={{ fill: 'var(--color-muted)' }} content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" />
              <Bar dataKey="sent" name="Sent" fill="var(--color-chart-3)" radius={[4, 4, 0, 0]} maxBarSize={22} />
              <Bar dataKey="delivered" name="Delivered" fill="var(--color-success)" radius={[4, 4, 0, 0]} maxBarSize={22} />
              <Bar dataKey="failed" name="Failed" fill="var(--color-destructive)" radius={[4, 4, 0, 0]} maxBarSize={22} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex w-fit rounded-lg border border-border p-0.5">
          <button
            type="button"
            onClick={() => setActiveTab('delivered')}
            className={cn(
              'rounded-md px-3.5 py-1.5 text-sm font-semibold transition-colors',
              activeTab === 'delivered' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Delivered ({delivered.data?.total ?? 0})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pending')}
            className={cn(
              'rounded-md px-3.5 py-1.5 text-sm font-semibold transition-colors',
              activeTab === 'pending' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Pending ({pending.data?.total ?? 0})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('failed')}
            className={cn(
              'rounded-md px-3.5 py-1.5 text-sm font-semibold transition-colors',
              activeTab === 'failed' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Failed ({failed.data?.total ?? 0})
          </button>
        </div>

        <Button size="sm" variant="outline" disabled={isExporting} onClick={exportFiltered}>
          <Download className="h-3.5 w-3.5" /> {isExporting ? 'Exporting…' : 'Export'}
        </Button>
      </div>

      {activeTab === 'delivered' &&
        (delivered.isLoading ? (
          <div className="space-y-2.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[52px] rounded-xl" />
            ))}
          </div>
        ) : (
          <>
            <MessagesTable rows={delivered.data?.rows ?? []} onView={handleView} />
            <PaginationControls page={deliveredPage} total={delivered.data?.total ?? 0} onPageChange={setDeliveredPage} />
          </>
        ))}

      {activeTab === 'pending' &&
        (pending.isLoading ? (
          <div className="space-y-2.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[52px] rounded-xl" />
            ))}
          </div>
        ) : (
          <>
            <MessagesTable
              rows={pending.data?.rows ?? []}
              onView={handleView}
              onResendPending={(messageId) => setResendConfirmId(messageId)}
              resendingId={resend.isPending ? (resend.variables ?? null) : null}
            />
            <PaginationControls page={pendingPage} total={pending.data?.total ?? 0} onPageChange={setPendingPage} />
          </>
        ))}

      {activeTab === 'failed' &&
        (failed.isLoading ? (
          <div className="space-y-2.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[52px] rounded-xl" />
            ))}
          </div>
        ) : (
          <>
            <MessagesTable rows={failed.data?.rows ?? []} onView={handleView} />
            <PaginationControls page={failedPage} total={failed.data?.total ?? 0} onPageChange={setFailedPage} />
          </>
        ))}

      <Dialog open={!!viewingId} onOpenChange={(open) => !open && setViewingId(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Delivery details</DialogTitle>
          </DialogHeader>
          {detail.isLoading && (
            <div className="space-y-2.5">
              <Skeleton className="h-[60px] rounded-xl" />
              <Skeleton className="h-[100px] rounded-xl" />
            </div>
          )}
          {detail.data && (
            <>
              {/* MessageDetailBody's own resend button is failed-recipient-only (hidden
                  whenever failedCount is 0), so a still-pending message's resend action
                  lives here instead, outside that shared component. */}
              {detailStatus?.label === 'Pending' && (
                <div className="mb-4 flex justify-end">
                  <Button size="sm" disabled={resend.isPending} onClick={() => resend.mutate(viewingId!)}>
                    <RotateCcw className="h-3.5 w-3.5" /> {resend.isPending ? 'Resending…' : 'Resend to pending recipients'}
                  </Button>
                </div>
              )}
              <MessageDetailBody detail={detail.data} onExportCsv={exportRecipientsCsv} showProvider />
            </>
          )}
        </DialogContent>
      </Dialog>

      <ResendPendingDialog
        open={!!resendConfirmId}
        onOpenChange={(open) => !open && setResendConfirmId(null)}
        isPending={resend.isPending}
        onConfirm={() => resend.mutate(resendConfirmId!, { onSuccess: () => setResendConfirmId(null) })}
      />
    </div>
  );
}
