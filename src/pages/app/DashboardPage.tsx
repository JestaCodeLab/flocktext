import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import {
  Users,
  Send,
  TrendingUp,
  TrendingDown,
  Inbox,
  SendIcon,
  CircleCheck,
  Trash2,
  RefreshCw,
  CalendarClock,
  Repeat,
  ChevronRight,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  Search,
  MoreVertical,
  X,
  Plus,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { DateRangeFilter } from '@/components/filters/DateRangeFilter';
import { AddSenderIdDialog } from '@/components/organization/AddSenderIdDialog';
import { fetchDashboardSummary, fetchRecentActivity, fetchDashboardChart } from '@/api/dashboard';
import { fetchScheduledMessages, cancelScheduledMessage, type ScheduledMessage } from '@/api/messages';
import { fetchMe } from '@/api/auth';
import { setPrimarySenderId, deleteSenderId } from '@/api/organization';
import { apiErrorMessage } from '@/api/client';
import { useAuthStore } from '@/store/authStore';
import { senderIdStatusLabel, senderIdStatusVariant } from '@/lib/senderIdStatus';
import { cn } from '@/lib/utils';
import { useEntityLabels } from '@/lib/terminology';
import { rangeLabel, type DateRangeParams } from '@/lib/dateRange';

type Accent = 'blue' | 'violet' | 'green' | 'gold';

const ACCENT_CHIP: Record<Accent, string> = {
  blue: 'bg-chart-3/15 text-chart-3',
  violet: 'bg-chart-4/15 text-chart-4',
  green: 'bg-chart-2/15 text-chart-2',
  gold: 'bg-chart-1/15 text-chart-1',
};

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
  highlight,
  onIconClick,
  iconTitle,
}: {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
  sub?: string;
  accent?: Accent;
  highlight?: boolean;
  onIconClick?: () => void;
  iconTitle?: string;
}) {
  const iconClassName = cn(
    'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
    highlight ? 'bg-stat-highlight-foreground/15 text-stat-highlight-foreground' : accent && ACCENT_CHIP[accent]
  );

  return (
    <div
      className={cn(
        'rounded-2xl border p-5',
        highlight ? 'border-transparent bg-stat-highlight text-stat-highlight-foreground' : 'border-border bg-card'
      )}
    >
      <div className="mb-4 flex items-start justify-between">
        <div className={cn('text-[13px]', highlight ? 'text-stat-highlight-foreground/75' : 'text-muted-foreground')}>{label}</div>
        {onIconClick ? (
          <button type="button" onClick={onIconClick} title={iconTitle} className={cn(iconClassName, 'transition-opacity hover:opacity-80')}>
            <Icon className="h-[18px] w-[18px]" />
          </button>
        ) : (
          <div className={iconClassName}>
            <Icon className="h-[18px] w-[18px]" />
          </div>
        )}
      </div>
      <div className="text-[26px] font-bold">{value}</div>
      {sub && <div className={cn('mt-0.5 text-[13px]', highlight ? 'text-stat-highlight-foreground/75' : 'text-muted-foreground')}>{sub}</div>}
    </div>
  );
}

// Long ranges roll up into weekly chart buckets (see api/controllers/dashboardController.js) -
// skip enough X-axis ticks that labels stay readable instead of overlapping.
function xAxisInterval(bucketCount: number) {
  return bucketCount <= 10 ? 0 : Math.ceil(bucketCount / 8) - 1;
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

// Integrates with the dashboard's shared date-range filter instead of owning its own
// week/month toggle - the parent passes down the resolved range plus its display label.
function ActivityChartCard({ range, label }: { range: DateRangeParams; label: string }) {
  const chart = useQuery({ queryKey: ['dashboard-chart', range], queryFn: () => fetchDashboardChart(range) });
  const buckets = chart.data?.buckets ?? [];

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <div className="text-[16px] font-bold">SMS Usage</div>
          <div className="text-[13px] text-muted-foreground">{label}</div>
        </div>
      </div>

      {chart.isLoading ? (
        <Skeleton className="h-[260px] w-full rounded-lg" />
      ) : (
        <ResponsiveContainer width="100%" height={260}>
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
            <Bar dataKey="sent" name="SMS sent" fill="var(--color-chart-1)" radius={[4, 4, 0, 0]} maxBarSize={22} />
            <Bar dataKey="creditsUsed" name="Credits used" fill="var(--color-chart-3)" radius={[4, 4, 0, 0]} maxBarSize={22} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

const SENDER_ID_PAGE_SIZE = 5;

function SenderIdCard() {
  const organization = useAuthStore((s) => s.session?.organization);
  const updateOrganization = useAuthStore((s) => s.updateOrganization);
  const updateUser = useAuthStore((s) => s.updateUser);
  const orgSenderIds = organization?.senderIds;
  const allSenderIds = orgSenderIds ?? [];
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showAdd, setShowAdd] = useState(false);

  const senderIds = useMemo(() => {
    const rows = orgSenderIds ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((s) => s.senderId.toLowerCase().includes(q));
  }, [orgSenderIds, search]);

  const totalPages = Math.max(1, Math.ceil(senderIds.length / SENDER_ID_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = senderIds.slice((currentPage - 1) * SENDER_ID_PAGE_SIZE, currentPage * SENDER_ID_PAGE_SIZE);

  function goToPage(next: number) {
    setPage(Math.min(Math.max(next, 1), totalPages));
  }

  const checkStatus = useMutation({
    mutationFn: fetchMe,
    onSuccess: (data) => {
      updateOrganization(data.organization);
      updateUser(data.user);
      toast.success('Sender ID statuses refreshed.');
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const setPrimary = useMutation({
    mutationFn: setPrimarySenderId,
    onSuccess: (data) => {
      updateOrganization(data);
      toast.success('Primary sender ID updated.');
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const remove = useMutation({
    mutationFn: deleteSenderId,
    onSuccess: (data) => {
      updateOrganization(data);
      toast.success('Sender ID removed.');
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  return (
    <div className="flex flex-col rounded-2xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-[16px] font-bold">Sender IDs</div>
        <div className="flex items-center gap-1">
          <Button
            size="icon-sm"
            variant="ghost"
            disabled={checkStatus.isPending}
            onClick={() => checkStatus.mutate()}
            title="Check status"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', checkStatus.isPending && 'animate-spin')} />
          </Button>
          <Button size="sm" className="text-white" onClick={() => setShowAdd(true)}>
            <Plus className="h-[15px] w-[15px]" /> Sender ID
          </Button>
        </div>
      </div>

      {allSenderIds.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border p-6 text-center">
          <div className="text-sm text-muted-foreground">No sender IDs registered yet.</div>
          <Button size="sm" variant="outline" onClick={() => setShowAdd(true)}>
            Add sender ID
          </Button>
        </div>
      ) : (
        <>
          <div className="relative mb-3">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search sender Ids"
              className="pl-10"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          {pageRows.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border p-6 text-center">
              <div className="text-sm text-muted-foreground">No sender IDs match your search.</div>
            </div>
          ) : (
            <div className="flex-1 divide-y divide-border">
              {pageRows.map((s) => (
                <div key={s.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-1.5">
                      <span className="truncate text-sm font-medium">{s.senderId}</span>
                      {s.isPrimary && <CircleCheck className="h-4 w-4 shrink-0 text-primary" />}
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <Badge variant={senderIdStatusVariant[s.status]}>{senderIdStatusLabel[s.status]}</Badge>
                      {(!s.isPrimary || s.status !== 'approved') && (
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button size="icon-sm" variant="ghost" title="Actions">
                                <MoreVertical className="h-3.5 w-3.5" />
                              </Button>
                            }
                          />
                          <DropdownMenuContent align="end">
                            {!s.isPrimary && (
                              <DropdownMenuItem
                                className="text-xs cursor-pointer"
                                disabled={setPrimary.isPending}
                                onClick={() => setPrimary.mutate(s.id)}
                              >
                                <CircleCheck className="h-2 w-2" /> Make primary
                              </DropdownMenuItem>
                            )}
                            {s.status !== 'approved' && (
                              <DropdownMenuItem
                                className="text-xs cursor-pointer text-destructive"
                                variant="destructive"
                                disabled={remove.isPending}
                                onClick={() => remove.mutate(s.id)}
                              >
                                <Trash2 className="h-2 w-2" /> Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-1">
              <Button size="icon-sm" variant="outline" disabled={currentPage <= 1} onClick={() => goToPage(1)} title="First page">
                <ChevronsLeft className="h-3.5 w-3.5" />
              </Button>
              <Button size="icon-sm" variant="outline" disabled={currentPage <= 1} onClick={() => goToPage(currentPage - 1)} title="Previous page">
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => goToPage(p)}
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-semibold transition-colors',
                    p === currentPage ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-muted'
                  )}
                >
                  {p}
                </button>
              ))}
              <Button
                size="icon-sm"
                variant="outline"
                disabled={currentPage >= totalPages}
                onClick={() => goToPage(currentPage + 1)}
                title="Next page"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="icon-sm"
                variant="outline"
                disabled={currentPage >= totalPages}
                onClick={() => goToPage(totalPages)}
                title="Last page"
              >
                <ChevronsRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </>
      )}

      <AddSenderIdDialog open={showAdd} onOpenChange={setShowAdd} />
    </div>
  );
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function ordinal(n: number) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function scheduledSummary(m: ScheduledMessage) {
  if (m.sendMode === 'recurring') {
    if (m.recurringFreq === 'daily') return `Daily at ${m.recurringTime}`;
    if (m.recurringFreq === 'weekly') return `Weekly on ${WEEKDAYS[m.recurringDayOfWeek ?? 0]} at ${m.recurringTime}`;
    return `Monthly on the ${ordinal(m.recurringDayOfMonth ?? 1)} at ${m.recurringTime}`;
  }
  return new Date(m.scheduleDate).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function ScheduledSmsCard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const scheduled = useQuery({ queryKey: ['scheduled-messages'], queryFn: () => fetchScheduledMessages() });
  const upcoming = (scheduled.data?.rows ?? []).slice(0, 4);

  const cancel = useMutation({
    mutationFn: cancelScheduledMessage,
    onSuccess: () => {
      toast.success('Scheduled send cancelled.');
      queryClient.invalidateQueries({ queryKey: ['scheduled-messages'] });
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-[16px] font-bold">Scheduled SMS</div>
        <button
          type="button"
          onClick={() => navigate('/app/reports', { state: { tab: 'scheduled' } })}
          className="flex items-center gap-0.5 text-[13px] font-semibold text-primary hover:underline"
        >
          View all <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {scheduled.isLoading && (
        <div className="space-y-2.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      )}

      {!scheduled.isLoading && upcoming.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border p-8 text-center">
          <CalendarClock className="h-5 w-5 text-muted-foreground" />
          <div className="text-sm text-muted-foreground">No scheduled or recurring sends yet.</div>
        </div>
      )}

      <div className="divide-y divide-border">
        {upcoming.map((m) => (
          <div key={m.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
            <div
              className={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                m.sendMode === 'recurring' ? 'bg-chart-4/15 text-chart-4' : 'bg-chart-5/15 text-chart-5'
              )}
            >
              {m.sendMode === 'recurring' ? <Repeat className="h-4 w-4" /> : <CalendarClock className="h-4 w-4" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">{m.body}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">{scheduledSummary(m)}</div>
            </div>
            <Button size="icon-sm" variant="ghost" className="text-destructive" disabled={cancel.isPending} onClick={() => cancel.mutate(m.id)}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardPage() {
  const navigate = useNavigate();
  const entity = useEntityLabels();
  const [range, setRange] = useState<DateRangeParams>({ preset: 'this_month' });
  const summary = useQuery({ queryKey: ['dashboard-summary', range], queryFn: () => fetchDashboardSummary(range) });
  const activity = useQuery({ queryKey: ['recent-activity', range], queryFn: () => fetchRecentActivity(range) });

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="mb-1 text-[26px] font-bold">Dashboard</div>
          <div className="text-sm text-muted-foreground">{summary.data?.churchName ?? <Skeleton className="h-4 w-40" />}</div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button className={"text-white"} onClick={() => navigate('/app/compose')}>
            <SendIcon className="h-[15px] w-[15px]" /> Send SMS
          </Button>
          <Button variant="outline" onClick={() => navigate('/app/contacts')}>
            <Users className="h-[15px] w-[15px]" /> Add {entity.plural}
          </Button>
          <DateRangeFilter range={range} onChange={setRange} />
        </div>
      </div>

      {summary.isLoading ? (
        <div className="mb-6 grid grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-[126px] rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="mb-6 grid grid-cols-5 gap-4">
          <StatCard
            icon={Plus}
            label="Wallet Balance"
            value={(summary.data?.walletBalanceCredits ?? 0).toLocaleString()}
            highlight
            onIconClick={() => navigate('/app/wallet')}
            iconTitle="Buy credit"
            sub='Credits left'
          />
          <StatCard icon={Users} label={`Total ${entity.pluralCap}`} value={summary.data?.contactsCount ?? 0} accent="blue" sub={'Over time'} />
          <StatCard icon={Send} label="Messages Sent" value={summary.data?.messagesSent ?? 0} sub={rangeLabel(range)} accent="violet" />
          <StatCard
            icon={TrendingUp}
            label="Delivery Rate"
            value={`${summary.data?.deliveryRate ?? 0}%`}
            sub={rangeLabel(range)}
            accent="green"
          />
          <StatCard
            icon={TrendingDown}
            label="Credits Used"
            value={(summary.data?.creditsUsed ?? 0).toLocaleString()}
            sub={rangeLabel(range)}
            accent="gold"
          />
        </div>
      )}

      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <ActivityChartCard range={range} label={rangeLabel(range)} />
        </div>
        <SenderIdCard />
      </div>

      <div className="mb-6">
        <ScheduledSmsCard />
      </div>

      <div className="mb-3.5 mt-8 text-[17px] font-bold">Recent activity</div>
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {activity.isLoading && (
          <div className="space-y-2 p-5">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        )}
        {activity.data?.length === 0 && (
          <div className="flex flex-col items-center gap-3 p-10 text-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Inbox className="h-5 w-5" />
            </div>
            <div className="text-sm text-muted-foreground">No activity yet. Send your first message to get started.</div>
          </div>
        )}
        {activity.data?.map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5 last:border-b-0">
            <div>
              <div className="text-sm font-semibold">{item.preview}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                {item.group} · {new Date(item.date).toLocaleString()}
              </div>
            </div>
            <div className="text-[13px] font-bold text-success">{item.deliveredText}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
