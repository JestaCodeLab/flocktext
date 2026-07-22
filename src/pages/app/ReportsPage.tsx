import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BarChart3,
  RotateCcw,
  Eye,
  FileText,
  MoreVertical,
  RefreshCw,
  CalendarClock,
  Repeat,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { DateRangeFilter } from '@/components/filters/DateRangeFilter';
import { MessageDetailBody, downloadCsv } from '@/components/messages/MessageDetailBody';
import {
  fetchMessageRecipients,
  fetchMessages,
  resendFailedMessage,
  fetchScheduledMessages,
  cancelScheduledMessage,
  type MessageSummary,
  type MessageStats,
  type ScheduledMessage,
} from '@/api/messages';
import { createTemplate } from '@/api/templates';
import { apiErrorMessage } from '@/api/client';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';
import type { DateRangeParams } from '@/lib/dateRange';

// Delivered/Failed here refer to the whole send, not one recipient - "Failed"
// means at least one recipient failed (matches the tab this row can appear in
// and the set eligible for resend-failed); "Pending" means still resolving.
function messageStatusBadge(stats: MessageStats) {
  if (stats.failed > 0) return { variant: 'destructive' as const, label: `Failed (${stats.failed})` };
  if (stats.pending > 0) return { variant: 'secondary' as const, label: 'Pending' };
  return { variant: 'success' as const, label: 'Delivered' };
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
            <TableHead className="text-[13px]">Next send</TableHead>
            <TableHead className="text-[13px]">Type</TableHead>
            <TableHead className="text-[13px]">Sent to</TableHead>
            <TableHead className="text-[13px]">Message</TableHead>
            <TableHead className="w-0 text-[13px]">Actions</TableHead>
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

function SaveAsTemplateDialog({ messageId, onOpenChange }: { messageId: string | null; onOpenChange: (open: boolean) => void }) {
  const [name, setName] = useState('');
  const queryClient = useQueryClient();

  // Reuses the same query key the detail page fetches with, so if the user already
  // opened this message's detail page, this is served from cache instead of refetching.
  const detail = useQuery({
    queryKey: ['message-recipients', messageId],
    queryFn: () => fetchMessageRecipients(messageId!),
    enabled: !!messageId,
  });

  useEffect(() => {
    if (messageId) setName('');
  }, [messageId]);

  const save = useMutation({
    mutationFn: () => createTemplate({ name: name.trim(), body: detail.data!.body }),
    onSuccess: () => {
      toast.success('Saved as template.');
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      onOpenChange(false);
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  return (
    <Dialog open={!!messageId} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Save as template</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="template-name">Template name</Label>
            <Input id="template-name" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sunday reminder" />
          </div>
          {detail.isLoading && <Skeleton className="h-16 w-full" />}
          {detail.data && (
            <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm text-muted-foreground">{detail.data.body}</div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={!name.trim() || !detail.data || save.isPending} onClick={() => save.mutate()}>
            {save.isPending ? 'Saving…' : 'Save template'}
          </Button>
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

function MessagesTable({
  rows,
  onView,
  onResend,
  onSaveTemplate,
  resendingMessageId,
}: {
  rows: MessageSummary[];
  onView: (row: MessageSummary) => void;
  onResend?: (messageId: string) => void;
  onSaveTemplate: (messageId: string) => void;
  resendingMessageId?: string | null;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-[13px]">Date &amp; time</TableHead>
            <TableHead className="text-[13px]">Type</TableHead>
            <TableHead className="text-[13px]">Message</TableHead>
            <TableHead className="text-[13px]">Sender ID</TableHead>
            <TableHead className="text-[13px]">Status</TableHead>
            <TableHead className="w-0 text-[13px]">Actions</TableHead>
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
                <TableCell>
                  <Badge variant="secondary">{m.stats.total <= 1 ? 'Single' : `Bulk (${m.stats.total})`}</Badge>
                </TableCell>
                <TableCell className="max-w-[240px] truncate text-muted-foreground">{m.preview}</TableCell>
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
                      {onResend && (
                        <DropdownMenuItem
                          className="cursor-pointer"
                          disabled={resendingMessageId === m.id}
                          onClick={() => onResend(m.id)}
                        >
                          <RotateCcw className="h-3 w-3" /> Resend
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem className="cursor-pointer" onClick={() => onSaveTemplate(m.id)}>
                        <FileText className="h-3 w-3" /> Save as template
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
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
  const [templateSourceId, setTemplateSourceId] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
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

  // Jump straight to the Scheduled tab (e.g. from the Dashboard's "View all" link).
  useEffect(() => {
    const state = location.state as { tab?: 'scheduled' | 'delivered' | 'failed' } | null;
    if (state?.tab) setActiveTab(state.tab);
    if (state?.tab) window.history.replaceState({}, '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scheduled = useQuery({
    queryKey: ['scheduled-messages', range, scheduledPage],
    queryFn: () => fetchScheduledMessages(range, { page: scheduledPage, pageSize: PAGE_SIZE }),
  });
  const delivered = useQuery({
    queryKey: ['messages', 'delivered', range, deliveredPage],
    queryFn: () => fetchMessages('delivered', range, { page: deliveredPage, pageSize: PAGE_SIZE }),
  });
  const failed = useQuery({
    queryKey: ['messages', 'failed', range, failedPage],
    queryFn: () => fetchMessages('failed', range, { page: failedPage, pageSize: PAGE_SIZE }),
  });

  const resend = useMutation({
    mutationFn: resendFailedMessage,
    onSuccess: (data) => {
      toast.success(`Resent — ${data.stats.delivered}/${data.stats.total} delivered.`);
      updateOrganization({ walletBalanceCredits: data.walletBalanceCredits });
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  // Each row already carries its own recipient count, so there's no need to fetch
  // anything before deciding where "View details" goes: a single-recipient send
  // opens a quick modal, anything more opens the full detail page.
  function handleView(row: MessageSummary) {
    if (row.stats.total <= 1) {
      setViewingId(row.id);
    } else {
      navigate(`/app/reports/${row.id}`);
    }
  }

  const viewDetail = useQuery({
    queryKey: ['message-recipients', viewingId],
    queryFn: () => fetchMessageRecipients(viewingId!),
    enabled: !!viewingId,
  });

  function exportViewingCsv() {
    if (!viewDetail.data) return;
    const rows = [
      ['Name', 'Phone', 'Status', 'Reason', 'Delivered at'],
      ...viewDetail.data.recipients.map((r) => [r.name, r.phone, r.status, r.reason, r.deliveredAt ? new Date(r.deliveredAt).toLocaleString() : '']),
    ];
    downloadCsv(`message-${viewingId}-recipients.csv`, rows);
  }

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
        <div className="text-sm text-muted-foreground">Delivery and failure breakdowns for every send.</div>
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
                <MessagesTable
                  rows={delivered.data.rows}
                  onView={handleView}
                  onSaveTemplate={setTemplateSourceId}
                />
                <PaginationControls page={deliveredPage} pageSize={PAGE_SIZE} total={delivered.data.total} onPageChange={setDeliveredPage} />
              </>
            ) : (
              <EmptyState message="No delivered messages yet." />
            ))}

          {activeTab === 'failed' &&
            (failed.data?.rows.length ? (
              <>
                <MessagesTable
                  rows={failed.data.rows}
                  onView={handleView}
                  onResend={(messageId) => resend.mutate(messageId)}
                  onSaveTemplate={setTemplateSourceId}
                  resendingMessageId={resend.isPending ? (resend.variables ?? null) : null}
                />
                <PaginationControls page={failedPage} pageSize={PAGE_SIZE} total={failed.data.total} onPageChange={setFailedPage} />
              </>
            ) : (
              <EmptyState message="No failed messages — everything's delivering cleanly." />
            ))}
        </>
      )}

      <SaveAsTemplateDialog messageId={templateSourceId} onOpenChange={(open) => !open && setTemplateSourceId(null)} />
      <Dialog open={!!viewingId} onOpenChange={(open) => !open && setViewingId(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Delivery Details</DialogTitle>
          </DialogHeader>
          {viewDetail.isLoading && (
            <div className="space-y-2.5">
              <Skeleton className="h-[60px] rounded-xl" />
              <Skeleton className="h-[100px] rounded-xl" />
            </div>
          )}
          {viewDetail.data && (
            <MessageDetailBody
              detail={viewDetail.data}
              onExportCsv={exportViewingCsv}
              onResend={() => resend.mutate(viewingId!)}
              resending={resend.isPending && resend.variables === viewingId}
            />
          )}
        </DialogContent>
      </Dialog>
      <ScheduledDetailDialog
        message={scheduled.data?.rows.find((m) => m.id === selectedScheduledId) ?? null}
        onOpenChange={(open) => !open && setSelectedScheduledId(null)}
        onCancel={(id) => cancelScheduled.mutate(id)}
        isCancelling={cancelScheduled.isPending}
      />
    </div>
  );
}
