import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Coins, Receipt, Search, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MiniStatCard } from '@/components/messages/MessageDetailBody';
import { DeleteTransactionDialog } from '@/components/admin/DeleteTransactionDialog';
import { apiErrorMessage } from '@/api/client';
import {
  fetchAdminTransactions,
  deleteAdminTransaction,
  type AdminTransaction,
  type AdminTransactionType,
} from '@/api/adminTransactions';

const PAGE_SIZE = 20;

const TYPE_LABEL: Record<AdminTransactionType, string> = {
  sms_package: 'SMS package',
  birthday_automation: 'Birthday automation',
  extra_team_seat: 'Extra team seat',
};

const TYPE_BADGE_VARIANT: Record<AdminTransactionType, 'default' | 'secondary' | 'outline'> = {
  sms_package: 'default',
  birthday_automation: 'secondary',
  extra_team_seat: 'outline',
};

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

export function AdminTransactionsPage() {
  const [search, setSearch] = useState('');
  const [type, setType] = useState<AdminTransactionType | 'all'>('all');
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<AdminTransaction | null>(null);

  const queryClient = useQueryClient();

  const transactions = useQuery({
    queryKey: ['admin-transactions', search, type, page],
    queryFn: () =>
      fetchAdminTransactions({
        search: search || undefined,
        type: type === 'all' ? undefined : type,
        page,
        pageSize: PAGE_SIZE,
      }),
  });

  const remove = useMutation({
    mutationFn: () => deleteAdminTransaction(deleteTarget!.id),
    onSuccess: () => {
      toast.success('Transaction deleted.');
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ['admin-transactions'] });
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  return (
    <div>
      <div className="mb-5">
        <div className="text-[26px] font-extrabold">All Transactions</div>
        <div className="mt-0.5 text-sm text-muted-foreground">
          Every SMS package and addon purchase across all organizations.
        </div>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3.5 sm:max-w-md">
        <MiniStatCard
          icon={Coins}
          label="Total revenue"
          value={`GHS ${(transactions.data?.summary.totalGHS ?? 0).toLocaleString()}`}
          tint="primary"
        />
        <MiniStatCard icon={Receipt} label="Transactions" value={transactions.data?.summary.count ?? 0} tint="muted" />
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
          value={type}
          onValueChange={(v) => {
            setType(v as AdminTransactionType | 'all');
            setPage(1);
          }}
        >
          <SelectTrigger className="w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="sms_package">SMS package</SelectItem>
            <SelectItem value="birthday_automation">Birthday automation</SelectItem>
            <SelectItem value="extra_team_seat">Extra team seat</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary hover:bg-secondary">
              <TableHead>Date</TableHead>
              <TableHead>Organization</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Credits</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.isLoading &&
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={8}>
                    <Skeleton className="h-5 w-full" />
                  </TableCell>
                </TableRow>
              ))}
            {transactions.data?.rows.map((t) => (
              <TableRow key={t.id}>
                <TableCell>
                  <div className="font-medium text-foreground">
                    {new Date(t.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(t.date).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true })}
                  </div>
                </TableCell>
                <TableCell className="font-semibold">
                  {t.orgId ? (
                    <Link to={`/admin/organizations/${t.orgId}`} className="hover:underline">
                      {t.churchName}
                    </Link>
                  ) : (
                    t.churchName
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={TYPE_BADGE_VARIANT[t.type]}>{TYPE_LABEL[t.type]}</Badge>
                </TableCell>
                <TableCell className="max-w-[220px] truncate text-muted-foreground">{t.label}</TableCell>
                <TableCell className="text-right font-semibold">GHS {t.amountGHS.toLocaleString()}</TableCell>
                <TableCell className="text-right text-muted-foreground">{t.credits ? t.credits.toLocaleString() : '—'}</TableCell>
                <TableCell className="max-w-[160px] truncate text-xs text-muted-foreground">{t.paystackReference || '—'}</TableCell>
                <TableCell>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    className="text-destructive"
                    title="Delete"
                    onClick={() => setDeleteTarget(t)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {transactions.data?.rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <Receipt className="h-5 w-5 text-muted-foreground" />
                    No transactions yet.
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {transactions.data && <PaginationControls page={page} total={transactions.data.total} onPageChange={setPage} />}

      <DeleteTransactionDialog
        target={deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={() => remove.mutate()}
        isPending={remove.isPending}
      />
    </div>
  );
}
