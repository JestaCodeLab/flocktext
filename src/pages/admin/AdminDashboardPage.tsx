import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Building2, Send, BadgeCheck, Radio, Receipt, BarChart3 } from 'lucide-react';
import { fetchAdminDashboardSummary, fetchAdminDashboardChart } from '@/api/adminDashboard';
import { fetchBmsCredit } from '@/api/adminPackages';
import { StatCard } from '@/components/admin/StatCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DateRangeFilter } from '@/components/filters/DateRangeFilter';
import { rangeLabel, type DateRangeParams } from '@/lib/dateRange';
import { MobileList, MobileListCard, MobileListEmpty, MobileListRow } from '@/components/admin/MobileRecordList';

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
  // Drives the stat cards and the "Top organizations" chart/table below.
  const [range, setRange] = useState<DateRangeParams>({ preset: 'this_month' });
  // Independent of `range` - the Platform SMS volume chart filters on its own,
  // since it's plotting a time series rather than a point-in-time leaderboard.
  const [volumeRange, setVolumeRange] = useState<DateRangeParams>({ preset: 'this_month' });

  const summary = useQuery({ queryKey: ['admin-dashboard-summary', range], queryFn: () => fetchAdminDashboardSummary(range) });
  const bmsCredit = useQuery({ queryKey: ['admin-bms-credit'], queryFn: fetchBmsCredit });
  const chart = useQuery({ queryKey: ['admin-dashboard-chart', volumeRange], queryFn: () => fetchAdminDashboardChart(volumeRange) });
  const d = summary.data;
  const buckets = chart.data?.buckets ?? [];
  const topOrgs = d?.topOrganizations ?? [];

  const hasTopOrgsData = topOrgs.length > 0;
  const hasVolumeData = buckets.some((b) => b.messagesSent > 0 || b.creditsUsed > 0);

  return (
    <div>
      <div className="mb-6">
        <div className="mb-1 text-[26px] font-extrabold">Platform Overview</div>
        <div className="text-sm text-muted-foreground">Growth and usage across every organization on FlockText.</div>
      </div>

      {summary.isLoading ? (
        <div className="mb-6 grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-[104px] rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="mb-6 grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard
            icon={Radio}
            label="BMS credit balance"
            value={bmsCredit.data?.balance != null ? bmsCredit.data.balance.toLocaleString() : '—'}
            tone={bmsCredit.data?.balance == null ? 'warning' : 'default'}
          />
          <StatCard icon={Receipt} label="Total transactions" value={(d?.totalTransactions ?? 0).toLocaleString()} sub={rangeLabel(range)} />
          <StatCard icon={Building2} label="Total organizations" value={d?.totalOrganizations ?? 0} accent="blue" />
          <StatCard icon={Send} label="Messages sent" value={(d?.messagesSent ?? 0).toLocaleString()} sub={rangeLabel(range)} accent="violet" />
          <StatCard icon={BadgeCheck} label="Sender IDs awaiting review" value={d?.pendingSenderIdCount ?? 0} tone={d?.pendingSenderIdCount ? 'warning' : 'default'} />
        </div>
      )}

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-2.5">
            <div>
              <div className="text-[16px] font-bold">Top 10 organizations</div>
              <div className="text-[13px] text-muted-foreground">By messages sent</div>
            </div>
            <DateRangeFilter range={range} onChange={setRange} size="sm" />
          </div>
          {summary.isLoading ? (
            <Skeleton className="h-[320px] w-full rounded-lg" />
          ) : !hasTopOrgsData ? (
            <ChartEmptyState />
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(220, topOrgs.length * 32)}>
              <BarChart data={topOrgs} layout="vertical" barGap={4} margin={{ left: 8 }}>
                <CartesianGrid horizontal={false} stroke="var(--color-border)" />
                <XAxis type="number" tickLine={false} axisLine={false} tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }} allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="churchName"
                  width={140}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }}
                  tickFormatter={(value: string) => (value.length > 16 ? `${value.slice(0, 16)}…` : value)}
                />
                <Tooltip cursor={{ fill: 'var(--color-muted)' }} content={<ChartTooltip />} />
                <Bar dataKey="messagesSent" name="Messages sent" fill="var(--color-chart-1)" radius={[0, 4, 4, 0]} maxBarSize={18} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-2.5">
            <div>
              <div className="text-[16px] font-bold">Platform SMS volume</div>
              <div className="text-[13px] text-muted-foreground">Messages sent and credits used</div>
            </div>
            <DateRangeFilter range={volumeRange} onChange={setVolumeRange} size="sm" />
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
      {summary.isLoading && (
        <div className="space-y-2 rounded-2xl border border-border bg-card p-5">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      )}
      {!summary.isLoading && (
        <>
          <MobileList>
            {topOrgs.map((org, i) => (
              <MobileListCard key={org.id} to={`/admin/organizations/${org.id}`}>
                <div className="mb-2 flex items-center gap-2.5">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                    {i + 1}
                  </div>
                  <span className="font-semibold">{org.churchName}</span>
                </div>
                <MobileListRow label="Messages sent" value={org.messagesSent.toLocaleString()} />
                <MobileListRow label="Wallet credits" value={org.walletBalanceCredits.toLocaleString()} />
              </MobileListCard>
            ))}
          </MobileList>
          {topOrgs.length === 0 && <MobileListEmpty>No messages sent yet in this period.</MobileListEmpty>}

          <div className="hidden overflow-hidden rounded-2xl border border-border bg-card md:block">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary hover:bg-secondary">
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead className="text-right">Messages sent</TableHead>
                  <TableHead className="text-right">Wallet credits</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topOrgs.map((org, i) => (
                  <TableRow key={org.id}>
                    <TableCell>
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                        {i + 1}
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">
                      <Link to={`/admin/organizations/${org.id}`} className="hover:underline">
                        {org.churchName}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">{org.messagesSent.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{org.walletBalanceCredits.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
                {topOrgs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                      No messages sent yet in this period.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
