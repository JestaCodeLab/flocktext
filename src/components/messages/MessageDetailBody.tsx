import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Download, RotateCcw, Send, CheckCircle2, XCircle, Clock, CreditCard, Tag, Share2, ChevronLeft, ChevronRight, ArrowRight, TriangleAlert, UserPlus, Trash2, BarChart3, ChevronDown, MessageSquare } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import type { MessageDetail, MessageStats } from '@/api/messages';
import { cn } from '@/lib/utils';
import { STATUS_META, STATUS_ORDER, type MessageRecipientStatus } from '@/lib/messageStatus';
import { StatusInfoButton } from '@/components/messages/StatusInfoButton';

const RECIPIENTS_PAGE_SIZE = 50;

export function statusBadgeVariant(status: MessageRecipientStatus) {
  return STATUS_META[status].badgeVariant;
}

// 'submitted' and 'rejected' have no dedicated Badge variant token, so they're rendered
// with an outline+tint pattern (same one ImportPreviewTable.tsx's "possible duplicate"
// badge already uses) instead of adding a new variant - see lib/messageStatus.ts for the
// single source of truth on label/color that this, the aggregate per-message status
// badges, DeliveryBarChart, and StatusInfoButton all share.
export function StatusBadge({ status }: { status: MessageRecipientStatus }) {
  const meta = STATUS_META[status];
  return (
    <Badge variant={meta.badgeVariant} className={meta.tintClassName}>
      {meta.label}
    </Badge>
  );
}

export function sourceBadge(source: MessageDetail['source']) {
  if (source === 'api') return { variant: 'outline' as const, label: 'API' };
  if (source === 'automation') return { variant: 'secondary' as const, label: 'Automation' };
  return { variant: 'ghost' as const, label: 'Web' };
}

// Admin-only column (see `showProvider` below) - 'hubtel' means BMS Africa left this
// recipient stuck pending 5+ minutes and services/deliveryEscalation.js resent it
// through the backup provider.
export function providerBadge(provider: 'bms' | 'hubtel' | undefined) {
  if (provider === 'hubtel') return { variant: 'secondary' as const, label: 'Hubtel (backup)' };
  return { variant: 'outline' as const, label: 'BMS' };
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
  description,
  tint,
}: {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
  // Small muted line under the value (e.g. "Total recipients", "From your balance") -
  // optional so existing callers (AdminTransactionsPage, etc.) are unaffected.
  description?: string;
  // 'blue' (chart-3) stays available since it's the same hue as the 'submitted'
  // status elsewhere (STATUS_META) - a deliberate, meaningful reuse, not decorative.
  // 'purple'/'gold' round out the platform's own chart palette (chart-4/chart-1) for
  // purely decorative stat cards that need a distinct color without reaching for an
  // arbitrary blue that means nothing elsewhere in the app.
  tint: 'primary' | 'blue' | 'success' | 'destructive' | 'warning' | 'muted' | 'purple' | 'gold';
}) {
  const tintClass = {
    primary: 'bg-primary/10 text-primary',
    blue: 'bg-chart-3/15 text-chart-3',
    success: 'bg-success/10 text-success',
    destructive: 'bg-destructive/10 text-destructive',
    warning: 'bg-warning/10 text-warning',
    muted: 'bg-muted text-muted-foreground',
    purple: 'bg-chart-4/15 text-chart-4',
    gold: 'bg-chart-1/15 text-chart-1',
  }[tint];

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3.5">
      <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', tintClass)}>
        <Icon className="h-[16px] w-[16px]" />
      </div>
      <div className="min-w-0">
        <div className="truncate text-[13px] text-muted-foreground">{label}</div>
        <div className="text-md font-medium leading-tight text-foreground">{value}</div>
        {description && <div className="mt-0.5 truncate text-[11px] text-muted-foreground">{description}</div>}
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

// Bar colors/order come straight from lib/messageStatus.ts's STATUS_META/STATUS_ORDER,
// the same source the recipient table's StatusBadge and StatusInfoButton's legend use,
// so a color always means the same status everywhere in the delivery report.
function DeliveryBarChart({ stats }: { stats: Pick<MessageStats, 'delivered' | 'submitted' | 'pending' | 'rejected' | 'failed'> }) {
  const data = [{ label: 'Delivery', ...stats }];
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[15px] font-semibold text-foreground/80">
          <BarChart3 className="h-4 w-4 text-muted-foreground" /> Delivery Breakdown
        </div>
        {/* Decorative only - every send only ever has one breakdown to show (by status),
            so there's nothing else to switch this to yet. */}
        <div className="flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground">
          By status <ChevronDown className="h-3 w-3" />
        </div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} barGap={8}>
          <CartesianGrid vertical={false} stroke="var(--color-border)" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }} />
          <YAxis tickLine={false} axisLine={false} width={28} tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }} allowDecimals={false} />
          <Tooltip cursor={{ fill: 'var(--color-muted)' }} content={<ChartTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" />
          {STATUS_ORDER.map((status) => (
            <Bar
              key={status}
              dataKey={status}
              name={STATUS_META[status].label}
              fill={`var(--color-${STATUS_META[status].chartColorVar})`}
              radius={[4, 4, 0, 0]}
              maxBarSize={56}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// `showCredits` inlines the credit cost right before the date/time, in place of
// the modal variant's separate Credit stat card (removed - redundant once it's
// shown here). The page variant keeps its own "Credit Used" stat card instead,
// so this stays opt-in rather than always-on.
function MessageCard({ detail, showCredits }: { detail: MessageDetail; showCredits?: boolean }) {
  return (
    <div className="overflow-hidden rounded-xl bg-secondary">
      <div className="flex items-center justify-between gap-3 bg-primary px-3.5 py-2.5 text-[13px] font-bold text-white">
        <p className="text-base font-normal">Message</p>
        <span className="flex shrink-0 items-center gap-1.5 text-[13px] font-medium text-white/70">
          {showCredits && (
            <>
              <span>{detail.creditCost} {detail.creditCost === 1 ? 'credit' : 'credits'}</span>
              <span aria-hidden="true">·</span>
            </>
          )}
          <span>
            {new Date(detail.date).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}
          </span>
        </span>
      </div>
      <div className="max-h-[180px] overflow-y-auto break-words p-3.5 text-base leading-relaxed text-foreground">{detail.body}</div>
    </div>
  );
}

// Page-variant-only sibling of MessageCard above (which stays exactly as-is for the
// 'modal' variant) - matches DeliveryBarChart's bordered-card treatment so the two sit
// side by side as a matched pair, with the message text in its own light inset box
// rather than MessageCard's solid primary header bar.
function MessageDetailPanel({ detail }: { detail: MessageDetail }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[15px] font-semibold text-foreground/80">
          <MessageSquare className="h-4 w-4 text-muted-foreground" /> Message
        </div>
        <span className="shrink-0 text-xs font-medium text-muted-foreground">
          {new Date(detail.date).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}
        </span>
      </div>
      <div className="max-h-[180px] overflow-y-auto whitespace-pre-wrap break-words rounded-lg bg-secondary p-3.5 text-[15px] leading-relaxed text-foreground">
        {detail.body}
      </div>
    </div>
  );
}

function RecipientsPaginationControls({ page, total, onPageChange }: { page: number; total: number; onPageChange: (page: number) => void }) {
  const totalPages = Math.max(1, Math.ceil(total / RECIPIENTS_PAGE_SIZE));
  if (totalPages <= 1) return null;

  const start = total === 0 ? 0 : (page - 1) * RECIPIENTS_PAGE_SIZE + 1;
  const end = Math.min(page * RECIPIENTS_PAGE_SIZE, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-3.5 py-2.5">
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

// A failed/rejected recipient that's since been resent (see resentStatus) shouldn't just
// sit there looking like an unresolved, ignored failure - this renders what actually
// happened on the follow-up send, resolved live server-side rather than a stale snapshot.
function ResentStatusNote({ status }: { status: NonNullable<MessageDetail['recipients'][number]['resentStatus']> }) {
  const label = status === 'failed' ? 'Failed again' : STATUS_META[status].label;
  const className =
    status === 'delivered' ? 'text-success' : status === 'submitted' ? 'text-chart-3' : status === 'pending' ? 'text-muted-foreground' : 'text-destructive';
  return (
    <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
      <ArrowRight className="h-3 w-3 shrink-0" />
      Resent — <span className={className}>{label}</span>
    </div>
  );
}

// Per-row Send/Remove icon buttons - only meaningful on the Skipped tab (see
// `showActions` in the callers below), where each contact was never attempted at all,
// so acting on just one of them (rather than the tab-wide "Resend to N skipped") makes
// sense on its own.
function RecipientRowActions({
  recipientId,
  recipientName,
  onResendOne,
  resendingOneId,
  onRequestDeleteRecipient,
  deletingRecipientId,
}: {
  recipientId: string;
  recipientName: string;
  onResendOne?: (recipientId: string) => void;
  resendingOneId?: string | null;
  onRequestDeleteRecipient?: (recipientId: string, recipientName: string) => void;
  deletingRecipientId?: string | null;
}) {
  const busy = resendingOneId === recipientId || deletingRecipientId === recipientId;
  return (
    <div className="flex items-center justify-end gap-1.5">
      {onResendOne && (
        <Button
          size="icon-sm"
          variant="outline"
          disabled={busy}
          onClick={() => onResendOne(recipientId)}
          title={`Send to ${recipientName}`}
        >
          <Send className="h-3.5 w-3.5" />
        </Button>
      )}
      {onRequestDeleteRecipient && (
        <Button
          size="icon-sm"
          variant="outline"
          disabled={busy}
          onClick={() => onRequestDeleteRecipient(recipientId, recipientName)}
          title={`Remove ${recipientName}`}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}

function RecipientsTable({
  recipients,
  page,
  showProvider,
  showActions,
  onResendOne,
  resendingOneId,
  onRequestDeleteRecipient,
  deletingRecipientId,
}: {
  recipients: MessageDetail['recipients'];
  page: number;
  showProvider?: boolean;
  // Gates the actions column - true only for the Skipped tab (see MessageDetailBody).
  showActions?: boolean;
  onResendOne?: (recipientId: string) => void;
  resendingOneId?: string | null;
  onRequestDeleteRecipient?: (recipientId: string, recipientName: string) => void;
  deletingRecipientId?: string | null;
}) {
  const pageRecipients = recipients.slice((page - 1) * RECIPIENTS_PAGE_SIZE, page * RECIPIENTS_PAGE_SIZE);
  const showActionsColumn = showActions && (onResendOne || onRequestDeleteRecipient);
  return (
    <>
      <div className="hidden sm:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-[13px]">Name</TableHead>
              <TableHead className="text-[13px]">Recipient</TableHead>
              <TableHead className="text-[13px]">Status</TableHead>
              <TableHead className="text-[13px]">Reason</TableHead>
              {showProvider && <TableHead className="text-[13px]">Provider</TableHead>}
              {showActionsColumn && <TableHead className="text-right text-[13px]">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRecipients.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-semibold">{r.name}</TableCell>
                <TableCell className="text-muted-foreground">{r.phone}</TableCell>
                <TableCell>
                  <StatusBadge status={r.status} />
                  {r.resentStatus && <ResentStatusNote status={r.resentStatus} />}
                </TableCell>
                <TableCell className="text-muted-foreground">{(showProvider ? r.reason : r.userReason) || '—'}</TableCell>
                {showProvider && (
                  <TableCell>
                    <Badge variant={providerBadge(r.provider).variant}>{providerBadge(r.provider).label}</Badge>
                  </TableCell>
                )}
                {showActionsColumn && (
                  <TableCell>
                    <RecipientRowActions
                      recipientId={r.id}
                      recipientName={r.name || r.phone}
                      onResendOne={onResendOne}
                      resendingOneId={resendingOneId}
                      onRequestDeleteRecipient={onRequestDeleteRecipient}
                      deletingRecipientId={deletingRecipientId}
                    />
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="divide-y divide-border sm:hidden">
        {pageRecipients.map((r) => {
          const reason = (showProvider ? r.reason : r.userReason) || '—';
          return (
            <div key={r.id} className="px-3.5 py-3">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 truncate text-sm font-semibold text-foreground">{r.name}</div>
                <StatusBadge status={r.status} />
              </div>
              <div className="mt-0.5 text-xs text-muted-foreground">{r.phone}</div>
              <div className="mt-1 text-xs text-muted-foreground">{reason}</div>
              {r.resentStatus && <ResentStatusNote status={r.resentStatus} />}
              {showProvider && (
                <div className="mt-1.5">
                  <Badge variant={providerBadge(r.provider).variant} className="text-[10px]">
                    {providerBadge(r.provider).label}
                  </Badge>
                </div>
              )}
              {showActionsColumn && (
                <div className="mt-2">
                  <RecipientRowActions
                    recipientId={r.id}
                    recipientName={r.name || r.phone}
                    onResendOne={onResendOne}
                    resendingOneId={resendingOneId}
                    onRequestDeleteRecipient={onRequestDeleteRecipient}
                    deletingRecipientId={deletingRecipientId}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
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
// Shown atop the Skipped tab - "resend to N skipped" needs its own cost declared up
// front (unlike "resend failed", which the org already expects to just work) since a
// skip specifically means the wallet ran out last time, so a repeat shortfall is the
// most likely failure mode here.
function SkippedResendNotice({
  count,
  creditsNeeded,
  onResend,
  resending,
}: {
  count: number;
  creditsNeeded: number;
  onResend?: () => void;
  resending?: boolean;
}) {
  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-chart-4/30 bg-chart-4/10 p-3.5 text-sm">
      <div className="flex items-start gap-2 text-chart-4">
        <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          <b>{count}</b> contact{count === 1 ? ' was' : 's were'} never sent to because the wallet ran out. Resending needs{' '}
          <b>{creditsNeeded}</b> credit{creditsNeeded === 1 ? '' : 's'}.
        </div>
      </div>
      {onResend && (
        <Button size="sm" disabled={resending} onClick={onResend}>
          <RotateCcw className="h-[15px] w-[15px]" /> {resending ? 'Resending…' : `Resend to ${count} skipped`}
        </Button>
      )}
    </div>
  );
}

export function MessageDetailBody({
  detail,
  variant = 'modal',
  onExportCsv,
  onResend,
  resending,
  onResendSkipped,
  resendingSkipped,
  onResendOne,
  resendingOneId,
  onRequestDeleteRecipient,
  deletingRecipientId,
  showProvider,
}: {
  detail: MessageDetail;
  variant?: 'page' | 'modal';
  onExportCsv: () => void;
  onResend?: () => void;
  resending?: boolean;
  // Separate from onResend/resending above - skipped contacts were never attempted at
  // all (see MessageRecipientRow.status's 'skipped' case), so resending them is its own
  // distinct action with its own declared credit cost (see SkippedResendNotice).
  onResendSkipped?: () => void;
  resendingSkipped?: boolean;
  // Per-contact actions, shown only on the Skipped tab (see RecipientsTable's
  // `showActions`) - resend to just this one contact, or remove them from the list.
  onResendOne?: (recipientId: string) => void;
  resendingOneId?: string | null;
  onRequestDeleteRecipient?: (recipientId: string, recipientName: string) => void;
  deletingRecipientId?: string | null;
  // Admin-only: shows which SMS provider (BMS vs Hubtel backup) each recipient actually
  // went out through. Omitted on org self-service surfaces, which share this component.
  showProvider?: boolean;
}) {
  const failedCount = detail.recipients.filter((r) => r.status === 'failed' || r.status === 'rejected').length;
  const skippedRecipients = detail.recipients.filter((r) => r.status === 'skipped');
  const creditsNeededForSkipped = detail.segments * skippedRecipients.length;

  // One tab per status actually present in this message (no "All") - ordered via
  // STATUS_ORDER, which already puts 'delivered' first, so it's also the default tab
  // whenever there's at least one delivered recipient. A status with zero recipients
  // gets no tab at all (e.g. a message with no rejections never shows a "Rejected" tab).
  const statusTabs = STATUS_ORDER.filter((status) => detail.stats[status] > 0);
  const defaultStatusTab = statusTabs.includes('delivered') ? 'delivered' : statusTabs[0];

  const [pageByStatus, setPageByStatus] = useState<Partial<Record<MessageRecipientStatus, number>>>({});
  const [activeStatusTab, setActiveStatusTab] = useState<MessageRecipientStatus | undefined>(defaultStatusTab);
  // Only used by the 'modal' variant below, which stays a single flat (untabbed) list.
  const [modalPage, setModalPage] = useState(1);
  useEffect(() => {
    setPageByStatus({});
    setModalPage(1);
    const tabs = STATUS_ORDER.filter((status) => detail.stats[status] > 0);
    setActiveStatusTab(tabs.includes('delivered') ? 'delivered' : tabs[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detail.id]);
  // Self-heals if the active tab's count drops to 0 while it's being viewed (e.g. the
  // last "Pending" recipient resolves to "Delivered" mid-poll) instead of rendering a
  // tab that no longer exists.
  const effectiveStatusTab = activeStatusTab && statusTabs.includes(activeStatusTab) ? activeStatusTab : defaultStatusTab;

  if (variant === 'page') {
    return (
      <>
        <div className="mb-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <MiniStatCard
            icon={Send}
            label="Total"
            value={detail.stats.total}
            description="Total recipients"
            tint="success"
          />
          <MiniStatCard
            icon={CreditCard}
            label="Credit Used"
            value={detail.creditCost}
            description="From your balance"
            tint="primary"
          />
          <MiniStatCard icon={Share2} label="Source" value={detail.source} description="Channel used" tint="purple" />
          <MiniStatCard icon={Tag} label="Sender" value={detail.senderId} description="Sender ID" tint="gold" />
        </div>

        <div className="mb-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
          <DeliveryBarChart stats={detail.stats} />
          <MessageDetailPanel detail={detail} />
        </div>

        <div className="mb-0 flex flex-wrap items-end justify-between gap-3">
          <div className="flex items-center gap-1.5 text-[15px] font-semibold text-foreground/80">
            <UserPlus className="h-4 w-4 text-muted-foreground" /> Recipients ({detail.stats.total})
          </div>
          <div className="flex items-center gap-2.5">
            <StatusInfoButton />
            <Button size="sm" variant="outline" onClick={onExportCsv}>
              <Download className="h-[15px] w-[15px]" /> Export CSV
            </Button>
          </div>
        </div>

        <Tabs
          value={effectiveStatusTab}
          onValueChange={(v) => setActiveStatusTab(v as MessageRecipientStatus)}
          className="mt-2"
        >
          <TabsList variant="line" className="mb-2 group-data-[orientation=horizontal]/tabs:h-auto flex-wrap justify-start gap-6 p-0">
            {statusTabs.map((tabStatus) => (
              <TabsTrigger key={tabStatus} value={tabStatus} className="h-auto px-0 py-2">
                {STATUS_META[tabStatus].label} ({detail.stats[tabStatus]})
              </TabsTrigger>
            ))}
          </TabsList>
          {statusTabs.map((tabStatus) => {
            const tabRecipients = detail.recipients.filter((r) => r.status === tabStatus);
            const tabPage = pageByStatus[tabStatus] ?? 1;
            return (
              <TabsContent key={tabStatus} value={tabStatus}>
                {tabStatus === 'skipped' && (
                  <SkippedResendNotice
                    count={skippedRecipients.length}
                    creditsNeeded={creditsNeededForSkipped}
                    onResend={onResendSkipped}
                    resending={resendingSkipped}
                  />
                )}
                <div className="overflow-hidden rounded-2xl border border-border bg-card">
                  <RecipientsTable
                    recipients={tabRecipients}
                    page={tabPage}
                    showProvider={showProvider}
                    showActions={tabStatus === 'skipped'}
                    onResendOne={onResendOne}
                    resendingOneId={resendingOneId}
                    onRequestDeleteRecipient={onRequestDeleteRecipient}
                    deletingRecipientId={deletingRecipientId}
                  />
                  <RecipientsPaginationControls
                    page={tabPage}
                    total={tabRecipients.length}
                    onPageChange={(p) => setPageByStatus((prev) => ({ ...prev, [tabStatus]: p }))}
                  />
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      </>
    );
  }

  return (
    <>
      <div className="mb-5">
        <MessageCard detail={detail} showCredits />
      </div>

      <div className="mb-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <MiniStatCard icon={Send} label="Total" value={detail.stats.total} tint="muted" />
        <MiniStatCard icon={CheckCircle2} label="Delivered" value={detail.stats.delivered} tint="success" />
        <MiniStatCard icon={Clock} label="Submitted" value={detail.stats.submitted} tint="blue" />
        <MiniStatCard icon={XCircle} label="Failed" value={detail.stats.failed} tint="destructive" />
      </div>

      <div className="mb-0 flex items-end justify-between gap-3">
        <div className="text-[15px] font-semibold text-foreground/80">Showing ({detail.stats.total}) recipients</div>
        <div className="flex items-center gap-2.5">
          <StatusInfoButton />
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
        <RecipientsTable recipients={detail.recipients} page={modalPage} />
        <RecipientsPaginationControls page={modalPage} total={detail.recipients.length} onPageChange={setModalPage} />
      </div>
    </>
  );
}
