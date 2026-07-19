import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BarChart3,
  Download,
  RotateCcw,
  Eye,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  CalendarClock,
  Repeat,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DateRangeFilter } from '@/components/filters/DateRangeFilter';
import {
  fetchMessageRecipients,
  fetchRecipientsByStatus,
  resendFailedMessage,
  fetchScheduledMessages,
  cancelScheduledMessage,
  type RecipientListRow,
  type ScheduledMessage,
} from '@/api/messages';
import { apiErrorMessage } from '@/api/client';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';
import type { DateRangeParams } from '@/lib/dateRange';

function statusBadgeVariant(status: 'pending' | 'delivered' | 'failed') {
  if (status === 'delivered') return 'success' as const;
  if (status === 'failed') return 'destructive' as const;
  return 'secondary' as const;
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function ordinal(n: number) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function recurringSummary(m: ScheduledMessage) {
  if (m.recurringFreq === 'daily') return `Daily at ${m.recurringTime}`;
  if (m.recurringFreq === 'weekly') return `Weekly on ${WEEKDAYS[m.recurringDayOfWeek ?? 0]} at ${m.recurringTime}`;
  return `Monthly on the ${ordinal(m.recurringDayOfMonth ?? 1)} at ${m.recurringTime}`;
}

function recipientSummary(m: ScheduledMessage) {
  if (m.recipientType === 'single') return m.recipientName ? `${m.recipientName} (${m.phone})` : m.phone || '—';
  if (m.recipientType === 'all') return 'All contacts';
  if (m.recipientType === 'selection') return `${m.contactCount} selected contact${m.contactCount === 1 ? '' : 's'}`;
  return m.groups.map((g) => g.name).join(', ') || '—';
}

function ScheduledDateTime({ date }: { date: string }) {
  return (
    <>
      <div className="font-medium text-foreground">
        {new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
      </div>
      <div className="text-xs text-muted-foreground">
        {new Date(date).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true })}
      </div>
    </>
  );
}

function ScheduledTable({
  messages,
  onView,
  onCancel,
  cancelingId,
}: {
  messages: ScheduledMessage[];
  onView: (message: ScheduledMessage) => void;
  onCancel: (id: string) => void;
  cancelingId?: string | null;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Next send</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Sent to</TableHead>
            <TableHead>Message</TableHead>
            <TableHead className="w-0">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {messages.map((m) => (
            <TableRow key={m.id}>
              <TableCell>
                <ScheduledDateTime date={m.scheduleDate} />
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className="gap-1">
                  {m.sendMode === 'recurring' ? <Repeat className="h-3 w-3" /> : <CalendarClock className="h-3 w-3" />}
                  {m.sendMode === 'recurring' ? 'Recurring' : 'Scheduled'}
                </Badge>
              </TableCell>
              <TableCell className="max-w-[200px] truncate text-muted-foreground">{recipientSummary(m)}</TableCell>
              <TableCell className="max-w-[280px] truncate text-muted-foreground">{m.body}</TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button size="icon-sm" variant="ghost" onClick={() => onView(m)}>
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    className="text-destructive"
                    disabled={cancelingId === m.id}
                    onClick={() => onCancel(m.id)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function ScheduledDetailDialog({
  message,
  onOpenChange,
  onCancel,
  isCancelling,
}: {
  message: ScheduledMessage | null;
  onOpenChange: (open: boolean) => void;
  onCancel: (id: string) => void;
  isCancelling: boolean;
}) {
  return (
    <Dialog open={!!message} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{message?.sendMode === 'recurring' ? 'Recurring send' : 'Scheduled send'}</DialogTitle>
        </DialogHeader>
        {message && (
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-background p-3.5 text-sm leading-relaxed">{message.body}</div>
            <div className="space-y-2 text-sm">
              <div>
                To: <b className="text-foreground">{recipientSummary(message)}</b>
              </div>
              {message.sendMode === 'recurring' ? (
                <div>
                  Repeats: <b className="text-foreground">{recurringSummary(message)}</b>
                </div>
              ) : (
                <div>
                  Sends: <b className="text-foreground">{new Date(message.scheduleDate).toLocaleString(undefined, { hour12: true })}</b>
                </div>
              )}
            </div>
          </div>
        )}
        <DialogFooter>
          <Button
            variant="outline"
            className="text-destructive"
            disabled={isCancelling}
            onClick={() => message && onCancel(message.id)}
          >
            <X className="h-[15px] w-[15px]" /> {isCancelling ? 'Cancelling…' : 'Cancel send'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MiniStatCard({
  icon: Icon,
  label,
  value,
  tint,
}: {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
  tint: 'primary' | 'blue' | 'success' | 'destructive' | 'muted';
}) {
  const tintClass = {
    primary: 'bg-primary/10 text-primary',
    blue: 'bg-chart-3/15 text-chart-3',
    success: 'bg-success/10 text-success',
    destructive: 'bg-destructive/10 text-destructive',
    muted: 'bg-muted text-muted-foreground',
  }[tint];

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3.5">
      <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', tintClass)}>
        <Icon className="h-[18px] w-[18px]" />
      </div>
      <div className="min-w-0">
        <div className="truncate text-[13px] text-muted-foreground">{label}</div>
        <div className="text-lg font-bold leading-tight text-foreground">{value}</div>
      </div>
    </div>
  );
}

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

function MessageDetailDialog({ messageId, onOpenChange }: { messageId: string | null; onOpenChange: (open: boolean) => void }) {
  const queryClient = useQueryClient();
  const updateOrganization = useAuthStore((s) => s.updateOrganization);
  const detail = useQuery({
    queryKey: ['message-recipients', messageId],
    queryFn: () => fetchMessageRecipients(messageId!),
    enabled: !!messageId,
    // Keep polling while delivery is still resolving so the breakdown updates live.
    refetchInterval: (query) => ((query.state.data?.stats.pending ?? 0) > 0 ? 3000 : false),
  });

  // The flat Delivered/Failed lists only fetch on mount + manual refresh, so once this
  // message finishes resolving here, nudge them to pick it up without a full page reload.
  const prevPendingRef = useRef<number | null>(null);
  useEffect(() => {
    prevPendingRef.current = null;
  }, [messageId]);
  useEffect(() => {
    const pending = detail.data?.stats.pending;
    if (pending === undefined) return;
    if (prevPendingRef.current !== null && prevPendingRef.current > 0 && pending === 0) {
      queryClient.invalidateQueries({ queryKey: ['recipients'] });
    }
    prevPendingRef.current = pending;
  }, [detail.data?.stats.pending, queryClient]);

  const resend = useMutation({
    mutationFn: () => resendFailedMessage(messageId!),
    onSuccess: (data) => {
      toast.success(`Resent — ${data.stats.delivered}/${data.stats.total} delivered.`);
      updateOrganization({ walletBalanceCredits: data.walletBalanceCredits });
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      onOpenChange(false);
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const failedCount = detail.data?.recipients.filter((r) => r.status === 'failed').length ?? 0;

  function exportCsv() {
    if (!detail.data) return;
    const rows = [
      ['Name', 'Phone', 'Status', 'Reason', 'Delivered at'],
      ...detail.data.recipients.map((r) => [r.name, r.phone, r.status, r.reason, r.deliveredAt ? new Date(r.deliveredAt).toLocaleString() : '']),
    ];
    downloadCsv(`message-${messageId}-recipients.csv`, rows);
  }

  return (
    <Dialog open={!!messageId} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Delivery Details</DialogTitle>
        </DialogHeader>
        {detail.isLoading && (
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        )}
        {detail.data && (
          <>
            <div className="mb-4 overflow-hidden rounded-xl bg-secondary">
              <div className="flex items-center justify-between gap-3 bg-primary px-3.5 py-2.5 text-[13px] font-bold text-white">
                <span>{detail.data.senderId}</span>
                <span className="shrink-0 capitalize text-[13px] font-medium text-white/70">
                  {detail.data.creditCost} credit{detail.data.creditCost === 1 ? '' : 's'} ·{' '}
                  {new Date(detail.data.date).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}
                </span>
              </div>
              <div className="break-words p-3.5 text-sm leading-relaxed text-foreground">{detail.data.body}</div>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              <MiniStatCard icon={Send} label="Total" value={detail.data.stats.total} tint="muted" />
              <MiniStatCard icon={CheckCircle2} label="Delivered" value={detail.data.stats.delivered} tint="success" />
              <MiniStatCard icon={XCircle} label="Failed" value={detail.data.stats.failed} tint="destructive" />
              <MiniStatCard icon={Clock} label="Pending" value={detail.data.stats.pending} tint="muted" />
            </div>
            <div className="max-h-[320px] overflow-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detail.data.recipients.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-semibold">{r.name}</TableCell>
                      <TableCell className="text-muted-foreground">{r.phone}</TableCell>
                      <TableCell>
                        <Badge variant={statusBadgeVariant(r.status)}>{r.status}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{r.reason || '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={exportCsv} disabled={!detail.data}>
            <Download className="h-[15px] w-[15px]" /> Export CSV
          </Button>
          {failedCount > 0 && (
            <Button disabled={resend.isPending} onClick={() => resend.mutate()}>
              <RotateCcw className="h-[15px] w-[15px]" /> {resend.isPending ? 'Resending…' : `Resend to ${failedCount} failed`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EmptyState({ message }: { message: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-10 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <BarChart3 className="h-5 w-5" />
      </div>
      <div className="text-sm text-muted-foreground">{message}</div>
    </div>
  );
}

function RecipientsTable({
  rows,
  showReason,
  onView,
  onResend,
  resendingMessageId,
}: {
  rows: RecipientListRow[];
  showReason: boolean;
  onView: (messageId: string) => void;
  onResend?: (messageId: string) => void;
  resendingMessageId?: string | null;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date &amp; time</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Message</TableHead>
            <TableHead>Sender ID</TableHead>
            <TableHead>Status</TableHead>
            {showReason && <TableHead>Reason</TableHead>}
            <TableHead className="w-0">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.id}>
              <TableCell>
                <div className="font-medium text-foreground">
                  {new Date(r.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(r.date).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true })}
                </div>
              </TableCell>
              <TableCell className="font-semibold">{r.phone}</TableCell>
              <TableCell className="max-w-[240px] truncate text-muted-foreground">{r.messagePreview}</TableCell>
              <TableCell className="text-muted-foreground">{r.senderId}</TableCell>
              <TableCell>
                <Badge className='capitalize' variant={statusBadgeVariant(r.status)}>{r.status}</Badge>
              </TableCell>
              {showReason && <TableCell className="text-muted-foreground">{r.reason || '—'}</TableCell>}
              <TableCell>
                <div className="flex gap-1">
                  <Button size="icon-sm" variant="ghost" onClick={() => onView(r.messageId)}>
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                  {onResend && (
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      disabled={resendingMessageId === r.messageId}
                      onClick={() => onResend(r.messageId)}
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

const PAGE_SIZE = 20;

function PaginationControls({
  page,
  pageSize,
  total,
  onPageChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

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

export function ReportsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedScheduledId, setSelectedScheduledId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'scheduled' | 'delivered' | 'failed'>('delivered');
  const [range, setRange] = useState<DateRangeParams>({ preset: 'all_time' });
  const [scheduledPage, setScheduledPage] = useState(1);
  const [deliveredPage, setDeliveredPage] = useState(1);
  const [failedPage, setFailedPage] = useState(1);
  const queryClient = useQueryClient();
  const updateOrganization = useAuthStore((s) => s.updateOrganization);

  // A new filter changes the result set, so a page number from the old one may no
  // longer exist - snap every tab back to page 1 whenever the range changes.
  useEffect(() => {
    setScheduledPage(1);
    setDeliveredPage(1);
    setFailedPage(1);
  }, [range]);

  // Land here right after a send with the just-sent message's breakdown open automatically,
  // or jump straight to the Scheduled tab (e.g. from the Dashboard's "View all" link).
  useEffect(() => {
    const state = location.state as { messageId?: string; tab?: 'scheduled' | 'delivered' | 'failed' } | null;
    if (state?.messageId) setSelectedId(state.messageId);
    if (state?.tab) setActiveTab(state.tab);
    if (state?.messageId || state?.tab) window.history.replaceState({}, '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scheduled = useQuery({
    queryKey: ['scheduled-messages', range, scheduledPage],
    queryFn: () => fetchScheduledMessages(range, { page: scheduledPage, pageSize: PAGE_SIZE }),
  });
  const delivered = useQuery({
    queryKey: ['recipients', 'delivered', range, deliveredPage],
    queryFn: () => fetchRecipientsByStatus('delivered', range, { page: deliveredPage, pageSize: PAGE_SIZE }),
  });
  const failed = useQuery({
    queryKey: ['recipients', 'failed', range, failedPage],
    queryFn: () => fetchRecipientsByStatus('failed', range, { page: failedPage, pageSize: PAGE_SIZE }),
  });

  const resend = useMutation({
    mutationFn: resendFailedMessage,
    onSuccess: (data) => {
      toast.success(`Resent — ${data.stats.delivered}/${data.stats.total} delivered.`);
      updateOrganization({ walletBalanceCredits: data.walletBalanceCredits });
      queryClient.invalidateQueries({ queryKey: ['recipients'] });
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const cancelScheduled = useMutation({
    mutationFn: cancelScheduledMessage,
    onSuccess: () => {
      toast.success('Scheduled send cancelled.');
      queryClient.invalidateQueries({ queryKey: ['scheduled-messages'] });
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const isLoading = scheduled.isLoading || delivered.isLoading || failed.isLoading;
  const isFetching = scheduled.isFetching || delivered.isFetching || failed.isFetching;

  return (
    <div>
      <div className="mb-6">
        <div className="mb-1 text-[26px] font-bold">Delivery Reports</div>
        <div className="text-sm text-muted-foreground">Per-recipient delivery and failure breakdowns for every send.</div>
      </div>

      {isLoading && (
        <div className="space-y-2.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[60px] rounded-xl" />
          ))}
        </div>
      )}

      {!isLoading && (
        <>
          <div className="mb-4 flex items-center justify-between">
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
                onClick={() => setActiveTab('scheduled')}
                className={cn(
                  'rounded-md px-3.5 py-1.5 text-sm font-semibold transition-colors',
                  activeTab === 'scheduled' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Scheduled ({scheduled.data?.total ?? 0})
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

            <div className="flex items-center gap-2.5">
              <Button
                size="sm"
                variant="outline"
                disabled={isFetching}
                onClick={() => {
                  scheduled.refetch();
                  delivered.refetch();
                  failed.refetch();
                }}
              >
                <RefreshCw className={cn('h-3.5 w-3.5', isFetching && 'animate-spin')} />
                Refresh
              </Button>
              <DateRangeFilter range={range} onChange={setRange} includeAllTime size="sm" />
            </div>
          </div>

          {activeTab === 'scheduled' &&
            (scheduled.data?.rows.length ? (
              <>
                <ScheduledTable
                  messages={scheduled.data.rows}
                  onView={(m) => setSelectedScheduledId(m.id)}
                  onCancel={(id) => cancelScheduled.mutate(id)}
                  cancelingId={cancelScheduled.isPending ? (cancelScheduled.variables ?? null) : null}
                />
                <PaginationControls page={scheduledPage} pageSize={PAGE_SIZE} total={scheduled.data.total} onPageChange={setScheduledPage} />
              </>
            ) : (
              <EmptyState
                message={
                  <>
                    No scheduled or recurring sends yet. Set one up from{' '}
                    <button type="button" className="font-semibold text-primary hover:underline" onClick={() => navigate('/app/compose')}>
                      Send SMS
                    </button>
                    .
                  </>
                }
              />
            ))}

          {activeTab === 'delivered' &&
            (delivered.data?.rows.length ? (
              <>
                <RecipientsTable rows={delivered.data.rows} showReason={false} onView={setSelectedId} />
                <PaginationControls page={deliveredPage} pageSize={PAGE_SIZE} total={delivered.data.total} onPageChange={setDeliveredPage} />
              </>
            ) : (
              <EmptyState message="No delivered messages yet." />
            ))}

          {activeTab === 'failed' &&
            (failed.data?.rows.length ? (
              <>
                <RecipientsTable
                  rows={failed.data.rows}
                  showReason
                  onView={setSelectedId}
                  onResend={(messageId) => resend.mutate(messageId)}
                  resendingMessageId={resend.isPending ? (resend.variables ?? null) : null}
                />
                <PaginationControls page={failedPage} pageSize={PAGE_SIZE} total={failed.data.total} onPageChange={setFailedPage} />
              </>
            ) : (
              <EmptyState message="No failed messages — everything's delivering cleanly." />
            ))}
        </>
      )}

      <MessageDetailDialog messageId={selectedId} onOpenChange={(open) => !open && setSelectedId(null)} />
      <ScheduledDetailDialog
        message={scheduled.data?.rows.find((m) => m.id === selectedScheduledId) ?? null}
        onOpenChange={(open) => !open && setSelectedScheduledId(null)}
        onCancel={(id) => cancelScheduled.mutate(id)}
        isCancelling={cancelScheduled.isPending}
      />
    </div>
  );
}
