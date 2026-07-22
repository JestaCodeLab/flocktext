import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Download, RotateCcw, Send, CheckCircle2, XCircle, CreditCard, Tag, Share2, ChevronLeft, ChevronRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { MessageDetail } from '@/api/messages';
import { cn } from '@/lib/utils';

const RECIPIENTS_PAGE_SIZE = 10;

export function statusBadgeVariant(status: 'pending' | 'delivered' | 'failed') {
  if (status === 'delivered') return 'success' as const;
  if (status === 'failed') return 'destructive' as const;
  return 'secondary' as const;
}

export function sourceBadge(source: MessageDetail['source']) {
  if (source === 'api') return { variant: 'outline' as const, label: 'API' };
  if (source === 'automation') return { variant: 'secondary' as const, label: 'Automation' };
  return { variant: 'ghost' as const, label: 'Web' };
}

export function downloadCsv(filename: string, rows: string[][]) {
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

export function MiniStatCard({
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
      <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', tintClass)}>
        <Icon className="h-[16px] w-[16px]" />
      </div>
      <div className="min-w-0">
        <div className="truncate text-[13px] text-muted-foreground">{label}</div>
        <div className="text-md font-medium leading-tight text-foreground">{value}</div>
      </div>
    </div>
  );
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

function DeliveryBarChart({ delivered, failed }: { delivered: number; failed: number }) {
  const data = [{ label: 'Delivery', delivered, failed }];
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} barGap={8}>
          <CartesianGrid vertical={false} stroke="var(--color-border)" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }} />
          <YAxis tickLine={false} axisLine={false} width={28} tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }} allowDecimals={false} />
          <Tooltip cursor={{ fill: 'var(--color-muted)' }} content={<ChartTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" />
          <Bar dataKey="delivered" name="Delivered" fill="var(--color-success)" radius={[4, 4, 0, 0]} maxBarSize={56} />
          <Bar dataKey="failed" name="Failed" fill="var(--color-destructive)" radius={[4, 4, 0, 0]} maxBarSize={56} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function MessageCard({ detail }: { detail: MessageDetail }) {
  return (
    <div className="overflow-hidden rounded-xl bg-secondary">
      <div className="flex items-center justify-between gap-3 bg-primary px-3.5 py-2.5 text-[13px] font-bold text-white">
        <p className="text-base font-normal">Message</p>
        <span className="shrink-0 text-[13px] font-medium text-white/70">
          {new Date(detail.date).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}
        </span>
      </div>
      <div className="break-words p-3.5 text-base leading-relaxed text-foreground">{detail.body}</div>
    </div>
  );
}

function RecipientsPaginationControls({ page, total, onPageChange }: { page: number; total: number; onPageChange: (page: number) => void }) {
  const totalPages = Math.max(1, Math.ceil(total / RECIPIENTS_PAGE_SIZE));
  if (totalPages <= 1) return null;

  const start = total === 0 ? 0 : (page - 1) * RECIPIENTS_PAGE_SIZE + 1;
  const end = Math.min(page * RECIPIENTS_PAGE_SIZE, total);

  return (
    <div className="flex items-center justify-between border-t border-border px-3.5 py-2.5">
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

function RecipientsTable({ recipients, page }: { recipients: MessageDetail['recipients']; page: number }) {
  const pageRecipients = recipients.slice((page - 1) * RECIPIENTS_PAGE_SIZE, page * RECIPIENTS_PAGE_SIZE);
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-[13px]">Name</TableHead>
          <TableHead className="text-[13px]">Recipient</TableHead>
          <TableHead className="text-[13px]">Status</TableHead>
          <TableHead className="text-[13px]">Reason</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {pageRecipients.map((r) => (
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
  );
}

// Shared "guts" of a message's delivery detail - used both by the full detail page
// (MessageReportPage, for multi-recipient sends) and the compact modal (ReportsPage,
// for single-recipient sends), but the two surfaces intentionally show different
// content: the full page leads with a two-column stats+chart / message layout and
// hosts its own "Resend Failed" button up in the page header, while the modal stays
// compact - message card, four key stats, and the recipient table, with the resend
// action inline. `variant` picks between the two; the recipients table and its
// pagination are the one thing both share.
export function MessageDetailBody({
  detail,
  variant = 'modal',
  onExportCsv,
  onResend,
  resending,
}: {
  detail: MessageDetail;
  variant?: 'page' | 'modal';
  onExportCsv: () => void;
  onResend?: () => void;
  resending?: boolean;
}) {
  const failedCount = detail.recipients.filter((r) => r.status === 'failed').length;

  const [page, setPage] = useState(1);
  useEffect(() => {
    setPage(1);
  }, [detail.id]);

  if (variant === 'page') {
    return (
      <>
        <div className="mb-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="space-y-2.5">
            <div className="grid grid-cols-2 gap-2.5">
              <MiniStatCard icon={Send} label="Total" value={detail.stats.total} tint="muted" />
              <MiniStatCard icon={CreditCard} label="Credit Used" value={detail.creditCost} tint="primary" />
              <MiniStatCard icon={Tag} label="Sender" value={detail.senderId} tint="muted" />
              <MiniStatCard icon={Share2} label="Source" value={detail.source} tint="muted" />
            </div>
            <DeliveryBarChart delivered={detail.stats.delivered} failed={detail.stats.failed} />
          </div>
          <MessageCard detail={detail} />
        </div>

        <div className="mb-0 flex items-end justify-between gap-3">
          <div className="text-[15px] font-semibold text-foreground/80">Showing ({detail.stats.total}) recipients</div>
          <Button size="sm" variant="outline" onClick={onExportCsv}>
            <Download className="h-[15px] w-[15px]" /> Export CSV
          </Button>
        </div>

        <div className="mt-2 overflow-hidden rounded-2xl border border-border bg-card">
          <RecipientsTable recipients={detail.recipients} page={page} />
          <RecipientsPaginationControls page={page} total={detail.recipients.length} onPageChange={setPage} />
        </div>
      </>
    );
  }

  return (
    <>
      <div className="mb-5">
        <MessageCard detail={detail} />
      </div>

      <div className="mb-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <MiniStatCard icon={Send} label="Total" value={detail.stats.total} tint="muted" />
        <MiniStatCard icon={CheckCircle2} label="Delivered" value={detail.stats.delivered} tint="success" />
        <MiniStatCard icon={XCircle} label="Failed" value={detail.stats.failed} tint="destructive" />
        <MiniStatCard icon={CreditCard} label="Credit" value={detail.creditCost} tint="primary" />
      </div>

      <div className="mb-0 flex items-end justify-between gap-3">
        <div className="text-[15px] font-semibold text-foreground/80">Showing ({detail.stats.total}) recipients</div>
        <div className="flex items-center gap-2.5">
          <Button size="sm" variant="outline" onClick={onExportCsv}>
            <Download className="h-[15px] w-[15px]" /> Export CSV
          </Button>
          {onResend && failedCount > 0 && (
            <Button size="sm" disabled={resending} onClick={onResend}>
              <RotateCcw className="h-[15px] w-[15px]" /> {resending ? 'Resending…' : `Resend to ${failedCount} failed`}
            </Button>
          )}
        </div>
      </div>

      <div className="mt-2 overflow-hidden rounded-2xl border border-border bg-card">
        <RecipientsTable recipients={detail.recipients} page={page} />
        <RecipientsPaginationControls page={page} total={detail.recipients.length} onPageChange={setPage} />
      </div>
    </>
  );
}
