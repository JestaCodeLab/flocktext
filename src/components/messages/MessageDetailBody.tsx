import { Download, RotateCcw, Send, CheckCircle2, XCircle, Clock } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { MessageDetail } from '@/api/messages';
import { cn } from '@/lib/utils';

export function statusBadgeVariant(status: 'pending' | 'delivered' | 'failed') {
  if (status === 'delivered') return 'success' as const;
  if (status === 'failed') return 'destructive' as const;
  return 'secondary' as const;
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

// Shared "guts" of a message's delivery detail - used both by the full detail page
// (MessageReportPage, for multi-recipient sends) and the compact modal (ReportsPage,
// for single-recipient sends) so the two surfaces can't drift apart.
export function MessageDetailBody({
  detail,
  onExportCsv,
  onResend,
  resending,
}: {
  detail: MessageDetail;
  onExportCsv: () => void;
  onResend?: () => void;
  resending?: boolean;
}) {
  const failedCount = detail.recipients.filter((r) => r.status === 'failed').length;

  return (
    <>
      <div className="mb-5 overflow-hidden rounded-xl bg-secondary">
        <div className="flex items-center justify-between gap-3 bg-primary px-3.5 py-2.5 text-[13px] font-bold text-white">
          <span>{detail.senderId}</span>
          <span className="shrink-0 capitalize text-[13px] font-medium text-white/70">
            {detail.creditCost} credit{detail.creditCost === 1 ? '' : 's'} ·{' '}
            {new Date(detail.date).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}
          </span>
        </div>
        <div className="break-words p-3.5 text-sm leading-relaxed text-foreground">{detail.body}</div>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <MiniStatCard icon={Send} label="Total" value={detail.stats.total} tint="muted" />
        <MiniStatCard icon={CheckCircle2} label="Delivered" value={detail.stats.delivered} tint="success" />
        <MiniStatCard icon={XCircle} label="Failed" value={detail.stats.failed} tint="destructive" />
        <MiniStatCard icon={Clock} label="Pending" value={detail.stats.pending} tint="muted" />
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

      <div className=" mt-2 overflow-hidden rounded-2xl border border-border bg-card">
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
            {detail.recipients.map((r) => (
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
  );
}
