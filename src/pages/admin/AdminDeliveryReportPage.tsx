import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Download, Eye, RefreshCw, Search, Send } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { statusBadgeVariant, providerBadge, downloadCsv } from '@/components/messages/MessageDetailBody';
import { fetchAdminMessages, fetchAdminMessageRecipients, type AdminMessageStats, type AdminMessageSummary } from '@/api/adminMessages';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 20;

// Matches messageController.listMessages' semantics on the org side: "delivered"
// means nothing has failed yet (stats.failed === 0 - includes still-pending rows),
// "failed" means at least one recipient failed.
function messageStatusBadge(stats: AdminMessageStats) {
  if (stats.failed > 0) return { variant: 'destructive' as const, label: `Failed (${stats.failed})` };
  if (stats.pending > 0) return { variant: 'secondary' as const, label: 'Pending' };
  return { variant: 'success' as const, label: 'Delivered' };
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

function MessagesTable({ rows, onView }: { rows: AdminMessageSummary[]; onView: (id: string) => void }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
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
                  <Badge variant={status.variant}>{status.label}</Badge>
                </TableCell>
                <TableCell>
                  <Button size="icon-sm" variant="ghost" title="View details" onClick={() => onView(m.id)}>
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
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
  );
}

export function AdminDeliveryReportPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'delivered' | 'failed'>('delivered');
  const [deliveredPage, setDeliveredPage] = useState(1);
  const [failedPage, setFailedPage] = useState(1);
  const [viewingId, setViewingId] = useState<string | null>(null);

  useEffect(() => {
    setDeliveredPage(1);
    setFailedPage(1);
  }, [search]);

  const delivered = useQuery({
    queryKey: ['admin-messages', 'delivered', search, deliveredPage],
    queryFn: () => fetchAdminMessages({ status: 'delivered', search: search || undefined, page: deliveredPage, pageSize: PAGE_SIZE }),
  });
  const failed = useQuery({
    queryKey: ['admin-messages', 'failed', search, failedPage],
    queryFn: () => fetchAdminMessages({ status: 'failed', search: search || undefined, page: failedPage, pageSize: PAGE_SIZE }),
  });

  const detail = useQuery({
    queryKey: ['admin-message-recipients', viewingId],
    queryFn: () => fetchAdminMessageRecipients(viewingId!),
    enabled: !!viewingId,
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

  const isFetching = delivered.isFetching || failed.isFetching;
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
          <div className="relative max-w-sm">
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
            disabled={isFetching}
            onClick={() => {
              delivered.refetch();
              failed.refetch();
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
          <MessagesTable rows={delivered.data?.rows ?? []} onView={setViewingId} />
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
          <MessagesTable rows={failed.data?.rows ?? []} onView={setViewingId} />
          <PaginationControls page={failedPage} total={failed.data?.total ?? 0} onPageChange={setFailedPage} />
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

              <div className="my-4 flex items-center justify-between gap-3">
                <Badge variant={detailStatus?.variant}>{detailStatus?.label}</Badge>
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="rounded-xl border border-border bg-card px-4 py-2.5 text-center">
                    <div className="text-xs text-muted-foreground">Total</div>
                    <div className="mt-1 text-lg font-bold">{detail.data.stats.total}</div>
                  </div>
                  <div className="rounded-xl border border-border bg-card px-4 py-2.5 text-center">
                    <div className="text-xs text-muted-foreground">Delivered</div>
                    <div className="mt-1 text-lg font-bold text-success">{detail.data.stats.delivered}</div>
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
              <div className="overflow-hidden rounded-xl border border-border">
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
                          <Badge variant={statusBadgeVariant(r.status)}>{r.status}</Badge>
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
    </div>
  );
}
