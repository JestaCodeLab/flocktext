import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LifeBuoy, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { UpdateTicketStatusDialog } from '@/components/admin/UpdateTicketStatusDialog';
import { apiErrorMessage } from '@/api/client';
import { fetchAdminTickets, updateAdminTicketStatus, type AdminTicket } from '@/api/adminTickets';
import type { TicketCategory, TicketStatus } from '@/api/support';
import { TicketStatusBadge, ticketCategoryLabel } from '@/lib/ticketStatus';

const PAGE_SIZE = 20;

export function AdminTicketsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<TicketStatus | 'all'>('all');
  const [category, setCategory] = useState<TicketCategory | 'all'>('all');
  const [page, setPage] = useState(1);
  const [target, setTarget] = useState<AdminTicket | null>(null);

  const queryClient = useQueryClient();

  const tickets = useQuery({
    queryKey: ['admin-tickets', search, status, category, page],
    queryFn: () =>
      fetchAdminTickets({
        search: search || undefined,
        status: status === 'all' ? undefined : status,
        category: category === 'all' ? undefined : category,
        page,
        pageSize: PAGE_SIZE,
      }),
  });

  const updateStatus = useMutation({
    mutationFn: (payload: { status: TicketStatus; resolutionNote?: string }) => updateAdminTicketStatus(target!.id, payload),
    onSuccess: () => {
      toast.success('Ticket updated.');
      setTarget(null);
      queryClient.invalidateQueries({ queryKey: ['admin-tickets'] });
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  return (
    <div>
      <div className="mb-5">
        <div className="text-[26px] font-extrabold">Support Tickets</div>
        <div className="mt-0.5 text-sm text-muted-foreground">Issues and feature requests submitted across all organizations.</div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2.5">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by organization…"
            className="pl-10"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <Select
          value={status}
          onValueChange={(v) => {
            setStatus(v as TicketStatus | 'all');
            setPage(1);
          }}
          items={[
            { value: 'all', label: 'All statuses' },
            { value: 'open', label: ticketStatusLabel.open },
            { value: 'in_progress', label: ticketStatusLabel.in_progress },
            { value: 'resolved', label: ticketStatusLabel.resolved },
            { value: 'closed', label: ticketStatusLabel.closed },
          ]}
        >
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="open">{ticketStatusLabel.open}</SelectItem>
            <SelectItem value="in_progress">{ticketStatusLabel.in_progress}</SelectItem>
            <SelectItem value="resolved">{ticketStatusLabel.resolved}</SelectItem>
            <SelectItem value="closed">{ticketStatusLabel.closed}</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={category}
          onValueChange={(v) => {
            setCategory(v as TicketCategory | 'all');
            setPage(1);
          }}
          items={[
            { value: 'all', label: 'All types' },
            { value: 'issue', label: ticketCategoryLabel.issue },
            { value: 'feature', label: ticketCategoryLabel.feature },
          ]}
        >
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="issue">{ticketCategoryLabel.issue}</SelectItem>
            <SelectItem value="feature">{ticketCategoryLabel.feature}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary hover:bg-secondary">
              <TableHead>Date</TableHead>
              <TableHead>Organization</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.isLoading &&
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={5}>
                    <Skeleton className="h-5 w-full" />
                  </TableCell>
                </TableRow>
              ))}
            {tickets.data?.rows.map((t) => (
              <TableRow key={t.id} className="cursor-pointer" onClick={() => setTarget(t)}>
                <TableCell>
                  <div className="font-medium text-foreground">
                    {new Date(t.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(t.createdAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true })}
                  </div>
                </TableCell>
                <TableCell className="font-semibold">
                  {t.orgId ? (
                    <Link
                      to={`/admin/organizations/${t.orgId}`}
                      onClick={(e) => e.stopPropagation()}
                      className="hover:underline"
                    >
                      {t.churchName}
                    </Link>
                  ) : (
                    t.churchName
                  )}
                </TableCell>
                <TableCell className="max-w-[280px] truncate">{t.subject}</TableCell>
                <TableCell className="text-muted-foreground">{ticketCategoryLabel[t.category]}</TableCell>
                <TableCell>
                  <TicketStatusBadge status={t.status} />
                </TableCell>
              </TableRow>
            ))}
            {tickets.data?.rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <LifeBuoy className="h-5 w-5 text-muted-foreground" />
                    No tickets found.
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {tickets.data && (
        <PaginationControls page={page} total={tickets.data.total} pageSize={PAGE_SIZE} onPageChange={setPage} />
      )}

      <UpdateTicketStatusDialog
        target={target}
        onOpenChange={(open) => !open && setTarget(null)}
        onConfirm={(payload) => updateStatus.mutate(payload)}
        isPending={updateStatus.isPending}
      />
    </div>
  );
}
