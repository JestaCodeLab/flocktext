import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Building2, Send, BadgeCheck, Radio, BarChart3 } from 'lucide-react';
import { fetchAdminDashboardSummary, fetchAdminDashboardChart } from '@/api/adminDashboard';
import { fetchBmsCredit } from '@/api/adminPackages';
import { StatCard } from '@/components/admin/StatCard';
import { Skeleton } from '@/components/ui/skeleton';
import { DateRangeFilter } from '@/components/filters/DateRangeFilter';
import { rangeLabel, type DateRangeParams } from '@/lib/dateRange';

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
      <div className="mb-1 font-semibold text-popover-foreground">{label}</div>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-1.5 text-muted-foreground">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
          {entry.name}: <span className="font-semibold text-popover-foreground">{entry.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

function ChartEmptyState() {
  return (
    <div className="flex h-[260px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border text-center">
      <BarChart3 className="h-5 w-5 text-muted-foreground" />
      <div className="text-sm text-muted-foreground">No data yet for this period.</div>
    </div>
  );
}

export function AdminDashboardPage() {
  const [range, setRange] = useState<DateRangeParams>({ preset: 'this_month' });
  const summary = useQuery({ queryKey: ['admin-dashboard-summary', range], queryFn: () => fetchAdminDashboardSummary(range) });
  const bmsCredit = useQuery({ queryKey: ['admin-bms-credit'], queryFn: fetchBmsCredit });
  const chart = useQuery({ queryKey: ['admin-dashboard-chart'], queryFn: fetchAdminDashboardChart });
  const d = summary.data;
  const buckets = chart.data?.buckets ?? [];
  const topOrgs = d?.topOrganizations ?? [];

  const hasGrowthData = buckets.some((b) => b.newOrganizations > 0);
  const hasVolumeData = buckets.some((b) => b.messagesSent > 0 || b.creditsUsed > 0);

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <div className="mb-1 text-[26px] font-extrabold">Platform overview</div>
          <div className="text-sm text-muted-foreground">Growth and usage across every organization on FlockText.</div>
        </div>
        <DateRangeFilter range={range} onChange={setRange} />
      </div>

      {summary.isLoading ? (
        <div className="mb-6 grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[104px] rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="mb-6 grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-4">
          <StatCard
            icon={Radio}
            label="BMS credit balance"
            value={bmsCredit.data?.balance != null ? bmsCredit.data.balance.toLocaleString() : '—'}
            tone={bmsCredit.data?.balance == null ? 'warning' : 'default'}
          />
          <StatCard icon={Building2} label="Total organizations" value={d?.totalOrganizations ?? 0} accent="blue" />
          <StatCard icon={Send} label="Messages sent" value={(d?.messagesSent ?? 0).toLocaleString()} sub={rangeLabel(range)} accent="violet" />
          <StatCard icon={BadgeCheck} label="Sender IDs awaiting review" value={d?.pendingSenderIdCount ?? 0} tone={d?.pendingSenderIdCount ? 'warning' : 'default'} />
        </div>
      )}

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-5">
            <div className="text-[16px] font-bold">Organization growth</div>
            <div className="text-[13px] text-muted-foreground">New organizations per month, trailing 12 months</div>
          </div>
          {chart.isLoading ? (
            <Skeleton className="h-[260px] w-full rounded-lg" />
          ) : !hasGrowthData ? (
            <ChartEmptyState />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={buckets} barGap={4}>
                <CartesianGrid vertical={false} stroke="var(--color-border)" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }} />
                <YAxis tickLine={false} axisLine={false} width={28} tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }} allowDecimals={false} />
                <Tooltip cursor={{ fill: 'var(--color-muted)' }} content={<ChartTooltip />} />
                <Bar dataKey="newOrganizations" name="New organizations" fill="var(--color-chart-3)" radius={[4, 4, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-5">
            <div className="text-[16px] font-bold">Platform SMS volume</div>
            <div className="text-[13px] text-muted-foreground">Messages sent and credits used, trailing 12 months</div>
          </div>
          {chart.isLoading ? (
            <Skeleton className="h-[260px] w-full rounded-lg" />
          ) : !hasVolumeData ? (
            <ChartEmptyState />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={buckets} barGap={4}>
                <CartesianGrid vertical={false} stroke="var(--color-border)" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }} />
                <YAxis tickLine={false} axisLine={false} width={28} tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }} allowDecimals={false} />
                <Tooltip cursor={{ fill: 'var(--color-muted)' }} content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" />
                <Bar dataKey="messagesSent" name="SMS sent" fill="var(--color-chart-1)" radius={[4, 4, 0, 0]} maxBarSize={22} />
                <Bar dataKey="creditsUsed" name="Credits used" fill="var(--color-chart-3)" radius={[4, 4, 0, 0]} maxBarSize={22} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="mb-3.5 flex items-baseline justify-between">
        <div className="text-[17px] font-bold">Top organizations</div>
        <div className="text-[13px] text-muted-foreground">{rangeLabel(range)}</div>
      </div>
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {summary.isLoading && (
          <div className="space-y-2 p-5">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        )}
        {!summary.isLoading && topOrgs.length === 0 && (
          <div className="flex flex-col items-center gap-2 p-10 text-center">
            <div className="text-sm text-muted-foreground">No messages sent yet in this period.</div>
          </div>
        )}
        {topOrgs.map((org, i) => (
          <Link
            key={org.id}
            to={`/admin/organizations/${org.id}`}
            className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5 last:border-b-0 hover:bg-secondary/50"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                {i + 1}
              </div>
              <div className="text-sm font-semibold">{org.churchName}</div>
            </div>
            <div className="flex items-center gap-6 text-right">
              <div>
                <div className="text-sm font-bold">{org.messagesSent.toLocaleString()}</div>
                <div className="text-[11px] text-muted-foreground">messages sent</div>
              </div>
              <div>
                <div className="text-sm font-bold">{org.walletBalanceCredits.toLocaleString()}</div>
                <div className="text-[11px] text-muted-foreground">wallet credits</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
