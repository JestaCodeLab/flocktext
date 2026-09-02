import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Download, Eye, RefreshCw, Search, Send, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DeleteAdminMessageDialog } from '@/components/admin/DeleteAdminMessageDialog';
import { MobileList, MobileListCard, MobileListEmpty, MobileListRow } from '@/components/admin/MobileRecordList';
import { StatusBadge, providerBadge, downloadCsv } from '@/components/messages/MessageDetailBody';
import {
  deleteAdminMessage,
  fetchAdminMessages,
  fetchAdminMessageRecipients,
  type AdminMessageStats,
  type AdminMessageSummary,
} from '@/api/adminMessages';
import { apiErrorMessage } from '@/api/client';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 20;

// Matches messageController.listMessages' semantics on the org side: "delivered"
// means nothing has failed or been rejected yet (stats.failed === 0 &&
// stats.rejected === 0 - includes still-pending rows), "failed"/"rejected" each mean
// at least one recipient landed in that outcome.
function messageStatusBadge(stats: AdminMessageStats) {
  if (stats.failed > 0) return { variant: 'destructive' as const, label: `Failed (${stats.failed})`, className: '' };
  if (stats.rejected > 0) return { variant: 'outline' as const, label: `Rejected (${stats.rejected})`, className: 'border-warning/30 bg-warning/10 text-warning' };
  if (stats.pending > 0) return { variant: 'secondary' as const, label: 'Pending', className: '' };
  return { variant: 'success' as const, label: 'Delivered', className: '' };
}

function PaginationControls({
  page,
  total,
  onPageChange,
}: {
  page: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
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
  onDelete,
}: {
  rows: AdminMessageSummary[];
  onView: (id: string) => void;
  onDelete: (row: AdminMessageSummary) => void;
}) {
  return (
    <>
      <MobileList>
        {rows.map((m) => {
          const status = messageStatusBadge(m.stats);
          return (
            <MobileListCard key={m.id}>
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate font-semibold">
                    {m.orgId ? (
                      <Link to={`/admin/organizations/${m.orgId}`} className="hover:underline">
                        {m.churchName}
                      </Link>
                    ) : (
                      m.churchName
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(m.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button size="icon-sm" variant="ghost" title="View details" onClick={() => onView(m.id)}>
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon-sm" variant="ghost" className="text-destructive" title="Delete record" onClick={() => onDelete(m)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <MobileListRow label="Message" value={m.preview} />
              <MobileListRow label="Recipients" value={m.recipientCount} />
              <MobileListRow label="Sender ID" value={m.senderId} />
              <MobileListRow label="Sent by" value={m.sentBy} />
              <MobileListRow label="Status" value={<Badge variant={status.variant} className={status.className}>{status.label}</Badge>} />
            </MobileListCard>
          );
        })}
      </MobileList>
      {rows.length === 0 && <MobileListEmpty>No admin SMS broadcasts here.</MobileListEmpty>}

      <div className="hidden overflow-hidden rounded-xl border border-border bg-card md:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary hover:bg-secondary">
              <TableHead>Date</TableHead>
              <TableHead>Organization</TableHead>
              <TableHead>Message</TableHead>
              <TableHead className="text-center">Recipients</TableHead>
              <TableHead>Sender ID</TableHead>
              <TableHead>Sent by</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-0">Action</TableHead>
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
                  <TableCell className="font-semibold">
                    {m.orgId ? (
                      <Link to={`/admin/organizations/${m.orgId}`} className="hover:underline">
                        {m.churchName}
                      </Link>
                    ) : (
                      m.churchName
                    )}
                  </TableCell>
                  <TableCell className="max-w-[260px] truncate text-muted-foreground">{m.preview}</TableCell>
                  <TableCell className="text-center text-muted-foreground">{m.recipientCount}</TableCell>
                  <TableCell className="text-muted-foreground">{m.senderId}</TableCell>
                  <TableCell className="text-muted-foreground">{m.sentBy}</TableCell>
                  <TableCell>
                    <Badge variant={status.variant} className={status.className}>{status.label}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button size="icon-sm" variant="ghost" title="View details" onClick={() => onView(m.id)}>
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        className="text-destructive"
                        title="Delete record"
                        onClick={() => onDelete(m)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <Send className="h-5 w-5 text-muted-foreground" />
                    No admin SMS broadcasts here.
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

export function AdminDeliveryReportPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'delivered' | 'failed' | 'rejected'>('delivered');
  const [deliveredPage, setDeliveredPage] = useState(1);
  const [failedPage, setFailedPage] = useState(1);
  const [rejectedPage, setRejectedPage] = useState(1);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminMessageSummary | null>(null);

  useEffect(() => {
    setDeliveredPage(1);
    setFailedPage(1);
    setRejectedPage(1);
  }, [search]);

  const deleteMessage = useMutation({
    mutationFn: (id: string) => deleteAdminMessage(id),
    onSuccess: () => {
      toast.success('Record deleted.');
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ['admin-messages'] });
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const delivered = useQuery({
    queryKey: ['admin-messages', 'delivered', search, deliveredPage],
    queryFn: () => fetchAdminMessages({ status: 'delivered', search: search || undefined, page: deliveredPage, pageSize: PAGE_SIZE }),
  });
  const failed = useQuery({
    queryKey: ['admin-messages', 'failed', search, failedPage],
    queryFn: () => fetchAdminMessages({ status: 'failed', search: search || undefined, page: failedPage, pageSize: PAGE_SIZE }),
  });
  const rejected = useQuery({
    queryKey: ['admin-messages', 'rejected', search, rejectedPage],
    queryFn: () => fetchAdminMessages({ status: 'rejected', search: search || undefined, page: rejectedPage, pageSize: PAGE_SIZE }),
  });

  const detail = useQuery({
    queryKey: ['admin-message-recipients', viewingId],
    queryFn: () => fetchAdminMessageRecipients(viewingId!),
    enabled: !!viewingId,
    // Keep polling while delivery is still resolving so the breakdown updates live -
    // same as MessageReportPage/AdminOrgMessageReportPage's single-message detail views.
    refetchInterval: (query) => ((query.state.data?.stats.pending ?? 0) > 0 ? 3000 : false),
  });

  // The row list and this modal are fetched independently, so if delivery status
  // synced in the background between the two requests, the row's badge can lag
  // behind the fresher numbers shown here - refresh the list once we know better.
  useEffect(() => {
    if (detail.data) queryClient.invalidateQueries({ queryKey: ['admin-messages'] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detail.data]);

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
    downloadCsv(`admin-broadcast-${viewingId}-recipients.csv`, rows);
  }

  const isFetching = delivered.isFetching || failed.isFetching || rejected.isFetching;
  const detailStatus = detail.data ? messageStatusBadge(detail.data.stats) : null;

  return (
    <div>
      <div className="mb-5">
        <div className="text-[26px] font-extrabold">Delivery Report</div>
        <div className="mt-0.5 text-sm text-muted-foreground">
          SMS sent from the Admin Console to organizations' admin users, under FlockText's platform sender ID.
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2.5">
        <div className="no-scrollbar flex w-full max-w-full overflow-x-auto rounded-lg border border-border p-0.5 sm:w-fit">
          <button
            type="button"
            onClick={() => setActiveTab('delivered')}
            className={cn(
              'shrink-0 rounded-md px-3.5 py-1.5 text-sm font-semibold transition-colors',
              activeTab === 'delivered' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Delivered ({delivered.data?.total ?? 0})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('failed')}
            className={cn(
              'shrink-0 rounded-md px-3.5 py-1.5 text-sm font-semibold transition-colors',
              activeTab === 'failed' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Failed ({failed.data?.total ?? 0})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('rejected')}
            className={cn(
              'shrink-0 rounded-md px-3.5 py-1.5 text-sm font-semibold transition-colors',
              activeTab === 'rejected' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Rejected ({rejected.data?.total ?? 0})
          </button>
        </div>

        <div className="flex w-full items-center gap-2.5 sm:w-auto">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by organization…"
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button
            size="sm"
            variant="outline"
            className="shrink-0"
            disabled={isFetching}
            onClick={() => {
              delivered.refetch();
              failed.refetch();
              rejected.refetch();
            }}
          >
            <RefreshCw className={cn('h-3.5 w-3.5', isFetching && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </div>

      {activeTab === 'delivered' && delivered.isLoading && (
        <div className="space-y-2.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[52px] rounded-xl" />
          ))}
        </div>
      )}
      {activeTab === 'delivered' && !delivered.isLoading && (
        <>
          <MessagesTable rows={delivered.data?.rows ?? []} onView={setViewingId} onDelete={setDeleteTarget} />
          <PaginationControls page={deliveredPage} total={delivered.data?.total ?? 0} onPageChange={setDeliveredPage} />
        </>
      )}

      {activeTab === 'failed' && failed.isLoading && (
        <div className="space-y-2.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[52px] rounded-xl" />
          ))}
        </div>
      )}
      {activeTab === 'failed' && !failed.isLoading && (
        <>
          <MessagesTable rows={failed.data?.rows ?? []} onView={setViewingId} onDelete={setDeleteTarget} />
          <PaginationControls page={failedPage} total={failed.data?.total ?? 0} onPageChange={setFailedPage} />
        </>
      )}

      {activeTab === 'rejected' && rejected.isLoading && (
        <div className="space-y-2.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[52px] rounded-xl" />
          ))}
        </div>
      )}
      {activeTab === 'rejected' && !rejected.isLoading && (
        <>
          <MessagesTable rows={rejected.data?.rows ?? []} onView={setViewingId} onDelete={setDeleteTarget} />
          <PaginationControls page={rejectedPage} total={rejected.data?.total ?? 0} onPageChange={setRejectedPage} />
        </>
      )}

      <Dialog open={!!viewingId} onOpenChange={(open) => !open && setViewingId(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{detail.data?.churchName ?? 'Delivery details'}</DialogTitle>
          </DialogHeader>
          {detail.isLoading && (
            <div className="space-y-2.5">
              <Skeleton className="h-[60px] rounded-xl" />
              <Skeleton className="h-[100px] rounded-xl" />
            </div>
          )}
          {detail.data && (
            <>
              <div className="overflow-hidden rounded-xl bg-secondary">
                <div className="flex items-center justify-between gap-3 bg-primary px-3.5 py-2.5 text-[13px] font-bold text-white">
                  <p className="text-base font-normal">Message</p>
                  <span className="shrink-0 text-[13px] font-medium text-white/70">
                    {new Date(detail.data.date).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}
                  </span>
                </div>
                <div className="break-words p-3.5 text-base leading-relaxed text-foreground">{detail.data.body}</div>
              </div>

              <div className="my-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Badge variant={detailStatus?.variant} className={detailStatus?.className}>{detailStatus?.label}</Badge>
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                  <div className="rounded-xl border border-border bg-card px-4 py-2.5 text-center">
                    <div className="text-xs text-muted-foreground">Total</div>
                    <div className="mt-1 text-lg font-bold">{detail.data.stats.total}</div>
                  </div>
                  <div className="rounded-xl border border-border bg-card px-4 py-2.5 text-center">
                    <div className="text-xs text-muted-foreground">Delivered</div>
                    <div className="mt-1 text-lg font-bold text-success">{detail.data.stats.delivered}</div>
                  </div>
                  <div className="rounded-xl border border-border bg-card px-4 py-2.5 text-center">
                    <div className="text-xs text-muted-foreground">Rejected</div>
                    <div className="mt-1 text-lg font-bold text-warning">{detail.data.stats.rejected}</div>
                  </div>
                  <div className="rounded-xl border border-border bg-card px-4 py-2.5 text-center">
                    <div className="text-xs text-muted-foreground">Failed</div>
                    <div className="mt-1 text-lg font-bold text-destructive">{detail.data.stats.failed}</div>
                  </div>
                </div>
              </div>

              <div className="mb-2 flex items-center justify-between">
                <div className="text-sm font-semibold text-foreground/80">Recipients</div>
                <Button size="sm" variant="outline" onClick={exportCsv}>
                  <Download className="h-3.5 w-3.5" /> Export CSV
                </Button>
              </div>
              <MobileList>
                {detail.data.recipients.map((r) => (
                  <MobileListCard key={r.id}>
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <span className="font-semibold">{r.name}</span>
                      <StatusBadge status={r.status} />
                    </div>
                    <MobileListRow label="Phone" value={r.phone} />
                    <MobileListRow label="Reason" value={r.reason || '—'} />
                    <MobileListRow
                      label="Provider"
                      value={<Badge variant={providerBadge(r.provider).variant}>{providerBadge(r.provider).label}</Badge>}
                    />
                  </MobileListCard>
                ))}
              </MobileList>

              <div className="hidden overflow-hidden rounded-xl border border-border md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-[13px]">Name</TableHead>
                      <TableHead className="text-[13px]">Phone</TableHead>
                      <TableHead className="text-[13px]">Status</TableHead>
                      <TableHead className="text-[13px]">Reason</TableHead>
                      <TableHead className="text-[13px]">Provider</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detail.data.recipients.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-semibold">{r.name}</TableCell>
                        <TableCell className="text-muted-foreground">{r.phone}</TableCell>
                        <TableCell>
                          <StatusBadge status={r.status} />
                        </TableCell>
                        <TableCell className="text-muted-foreground">{r.reason || '—'}</TableCell>
                        <TableCell>
                          <Badge variant={providerBadge(r.provider).variant}>{providerBadge(r.provider).label}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <DeleteAdminMessageDialog
        target={deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMessage.mutate(deleteTarget.id)}
        isPending={deleteMessage.isPending}
      />
    </div>
  );
}
