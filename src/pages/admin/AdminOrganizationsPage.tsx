import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  RefreshCw,
  Search,
  Building2,
  KeyRound,
  Rocket,
  MessageSquareOff,
  CheckCircle2,
  Flame,
  AlertTriangle,
  Moon,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { StatCard, type StatCardAccent } from '@/components/admin/StatCard';
import { MobileList, MobileListCard, MobileListEmpty, MobileListRow } from '@/components/admin/MobileRecordList';
import { DateRangeFilter } from '@/components/filters/DateRangeFilter';
import { fetchAdminOrganizations, fetchAdminOrgFunnelSummary, manuallyVerifyUser, sendVerificationReminder } from '@/api/adminOrganizations';
import { apiErrorMessage } from '@/api/client';
import { cn } from '@/lib/utils';
import type { DateRangeParams } from '@/lib/dateRange';
import type { OrgStage, OrgSubStage } from '@/types/admin';

const ONBOARDING_STEP_LABEL: Record<number, string> = {
  1: 'Organization details',
  2: 'Organization details',
  3: 'Sender ID',
  4: 'Contacts',
};

function timeSince(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days <= 0) return 'today';
  if (days === 1) return '1 day ago';
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? '1 month ago' : `${months} months ago`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

// Wraps StatCard in a clickable/active-ring button rather than adding onClick to the
// shared component - it's only used elsewhere (the Dashboard) without click behavior,
// so this keeps that usage untouched.
function StageCard({
  active,
  onClick,
  ...statCardProps
}: { active: boolean; onClick: () => void } & Parameters<typeof StatCard>[0]) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full rounded-xl border-0 bg-transparent p-0 text-left transition-shadow',
        active ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : 'hover:shadow-sm'
      )}
    >
      <StatCard {...statCardProps} />
    </button>
  );
}

export function AdminOrganizationsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [range, setRange] = useState<DateRangeParams>({ preset: 'all_time' });
  const [stage, setStage] = useState<OrgStage | undefined>(undefined);
  const [subStage, setSubStage] = useState<OrgSubStage | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [pendingAction, setPendingAction] = useState<{ orgId: string; type: 'resend' | 'verify' } | null>(null);

  useEffect(() => setPage(1), [search, range, stage, subStage]);

  const summary = useQuery({
    queryKey: ['admin-organizations-funnel-summary', range],
    queryFn: () => fetchAdminOrgFunnelSummary(range),
  });

  const orgs = useQuery({
    queryKey: ['admin-organizations', { search, range, stage, subStage, page }],
    queryFn: () => fetchAdminOrganizations({ search: search || undefined, ...range, stage, subStage, page }),
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['admin-organizations'] });
    queryClient.invalidateQueries({ queryKey: ['admin-organizations-funnel-summary'] });
  }

  const resendOtp = useMutation({
    mutationFn: ({ orgId, userId }: { orgId: string; userId: string }) => sendVerificationReminder(orgId, userId),
    onMutate: ({ orgId }) => setPendingAction({ orgId, type: 'resend' }),
    onSuccess: () => toast.success('Verification code resent.'),
    onError: (err) => toast.error(apiErrorMessage(err)),
    onSettled: () => setPendingAction(null),
  });

  const verify = useMutation({
    mutationFn: ({ orgId, userId }: { orgId: string; userId: string }) => manuallyVerifyUser(orgId, userId),
    onMutate: ({ orgId }) => setPendingAction({ orgId, type: 'verify' }),
    onSuccess: () => {
      toast.success('Marked as verified.');
      invalidate();
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
    onSettled: () => setPendingAction(null),
  });

  function selectStage(next: OrgStage | undefined, nextSub?: OrgSubStage) {
    setStage(next);
    setSubStage(nextSub);
  }

  const isAllSelected = !stage;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[26px] font-extrabold">Organizations</div>
          <div className="mt-0.5 text-sm text-muted-foreground">{summary.data?.total ?? 0} registered</div>
        </div>
        <DateRangeFilter range={range} onChange={setRange} includeAllTime />
      </div>

      <div className="mb-3 grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-5">
        <StageCard
          active={isAllSelected}
          onClick={() => selectStage(undefined)}
          icon={Building2}
          label="Registered"
          value={summary.data?.total ?? 0}
          accent={'blue' as StatCardAccent}
        />
        <StageCard
          active={stage === 'otp_pending'}
          onClick={() => selectStage('otp_pending')}
          icon={KeyRound}
          label="OTP Verification Pending"
          value={summary.data?.otpPending ?? 0}
          tone="warning"
        />
        <StageCard
          active={stage === 'onboarding_incomplete'}
          onClick={() => selectStage('onboarding_incomplete')}
          icon={Rocket}
          label="Onboarding Incomplete"
          value={summary.data?.onboardingIncomplete ?? 0}
          accent={'violet' as StatCardAccent}
        />
        <StageCard
          active={stage === 'onboarded_no_sms'}
          onClick={() => selectStage('onboarded_no_sms')}
          icon={MessageSquareOff}
          label="Onboarded — No SMS Sent"
          value={summary.data?.onboardedNoSms ?? 0}
          tone="warning"
        />
        <StageCard
          active={stage === 'activated' && !subStage}
          onClick={() => selectStage('activated')}
          icon={CheckCircle2}
          label="Activated"
          value={summary.data?.activated.total ?? 0}
          accent={'green' as StatCardAccent}
        />
      </div>

      <div className="mb-4 grid grid-cols-3 gap-3.5">
        <StageCard
          active={stage === 'activated' && subStage === 'engaged'}
          onClick={() => selectStage('activated', 'engaged')}
          icon={Flame}
          label="Engaged"
          value={summary.data?.activated.engaged ?? 0}
          sub="Sent within 14 days"
          accent={'teal' as StatCardAccent}
        />
        <StageCard
          active={stage === 'activated' && subStage === 'at_risk'}
          onClick={() => selectStage('activated', 'at_risk')}
          icon={AlertTriangle}
          label="At Risk"
          value={summary.data?.activated.atRisk ?? 0}
          sub="15–30 days since last send"
          tone="warning"
        />
        <StageCard
          active={stage === 'activated' && subStage === 'dormant'}
          onClick={() => selectStage('activated', 'dormant')}
          icon={Moon}
          label="Dormant"
          value={summary.data?.activated.dormant ?? 0}
          sub="30+ days since last send"
          accent={'gold' as StatCardAccent}
        />
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="relative min-w-[220px] max-w-sm flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by church name…"
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" disabled={orgs.isFetching} onClick={() => orgs.refetch()}>
          <RefreshCw className={`h-4 w-4 ${orgs.isFetching ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

      {orgs.isLoading && (
        <div className="flex flex-col gap-2.5 md:hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[110px] rounded-xl" />
          ))}
        </div>
      )}
      <MobileList>
        {orgs.data?.organizations.map((org) => (
          <MobileListCard key={org.id} to={`/admin/organizations/${org.id}`}>
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="font-semibold">{org.churchName || 'Untitled organization'}</span>
              <Badge variant={org.status === 'active' ? 'default' : 'destructive'}>{org.status}</Badge>
            </div>
            <MobileListRow label="Members" value={org.memberCount} />
            <MobileListRow label="Messages" value={org.messageCount} />
            <MobileListRow label="Wallet" value={`${org.walletBalanceCredits.toLocaleString()} credits`} />
            <MobileListRow label="Joined" value={formatDate(org.createdAt)} />
            {org.stage === 'otp_pending' && (
              <>
                <MobileListRow label="Contact" value={org.founderEmail || org.founderPhone || '—'} />
                <MobileListRow label="Pending" value={timeSince(org.createdAt)} />
                <div className="mt-2 flex gap-2" onClick={(e) => e.stopPropagation()}>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!org.founderUserId || (pendingAction?.orgId === org.id)}
                    onClick={() => org.founderUserId && resendOtp.mutate({ orgId: org.id, userId: org.founderUserId })}
                  >
                    {pendingAction?.orgId === org.id && pendingAction.type === 'resend' ? 'Sending…' : 'Resend OTP'}
                  </Button>
                  <Button
                    size="sm"
                    disabled={!org.founderUserId || (pendingAction?.orgId === org.id)}
                    onClick={() => org.founderUserId && verify.mutate({ orgId: org.id, userId: org.founderUserId })}
                  >
                    {pendingAction?.orgId === org.id && pendingAction.type === 'verify' ? 'Verifying…' : 'Verify'}
                  </Button>
                </div>
              </>
            )}
            {org.stage === 'onboarding_incomplete' && (
              <>
                <MobileListRow label="Step" value={ONBOARDING_STEP_LABEL[org.onboardingCurrentStep] ?? `Step ${org.onboardingCurrentStep}`} />
                <MobileListRow label="Verified" value={org.founderVerifiedAt ? formatDate(org.founderVerifiedAt) : '—'} />
              </>
            )}
            {org.stage === 'onboarded_no_sms' && (
              <>
                <MobileListRow label="Onboarded" value={org.onboardingCompletedAt ? formatDate(org.onboardingCompletedAt) : '—'} />
                <MobileListRow label="Sender ID" value={org.senderIdStatus ?? 'none'} />
              </>
            )}
            {org.stage === 'activated' && (
              <>
                <MobileListRow label="First sent" value={org.firstSentAt ? formatDate(org.firstSentAt) : '—'} />
                <MobileListRow label="Last sent" value={org.lastSentAt ? timeSince(org.lastSentAt) : '—'} />
              </>
            )}
          </MobileListCard>
        ))}
      </MobileList>
      {!orgs.isLoading && orgs.data?.organizations.length === 0 && <MobileListEmpty>No organizations match this filter.</MobileListEmpty>}

      <div className="hidden overflow-hidden rounded-xl border border-border bg-card md:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary hover:bg-secondary">
              <TableHead>Church</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Members</TableHead>
              <TableHead>Messages</TableHead>
              <TableHead>Wallet</TableHead>
              <TableHead>Joined</TableHead>
              {stage === 'otp_pending' && (
                <>
                  <TableHead>Contact</TableHead>
                  <TableHead>Pending</TableHead>
                  <TableHead>Actions</TableHead>
                </>
              )}
              {stage === 'onboarding_incomplete' && (
                <>
                  <TableHead>Verified</TableHead>
                  <TableHead>Stuck on</TableHead>
                </>
              )}
              {stage === 'onboarded_no_sms' && (
                <>
                  <TableHead>Onboarded</TableHead>
                  <TableHead>Sender ID</TableHead>
                </>
              )}
              {stage === 'activated' && (
                <>
                  <TableHead>First sent</TableHead>
                  <TableHead>Last sent</TableHead>
                </>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {orgs.isLoading &&
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={9}>
                    <Skeleton className="h-5 w-full" />
                  </TableCell>
                </TableRow>
              ))}
            {orgs.data?.organizations.map((org) => (
              <TableRow key={org.id}>
                <TableCell className="font-semibold">
                  <Link to={`/admin/organizations/${org.id}`} className="hover:underline">
                    {org.churchName || 'Untitled organization'}
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge variant={org.status === 'active' ? 'default' : 'destructive'}>{org.status}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{org.memberCount}</TableCell>
                <TableCell className="text-muted-foreground">{org.messageCount}</TableCell>
                <TableCell className="text-muted-foreground">{org.walletBalanceCredits.toLocaleString()} credits</TableCell>
                <TableCell className="text-muted-foreground">
                  <div className="font-medium text-foreground">{formatDate(org.createdAt)}</div>
                </TableCell>
                {stage === 'otp_pending' && (
                  <>
                    <TableCell className="text-muted-foreground">{org.founderEmail || org.founderPhone || '—'}</TableCell>
                    <TableCell className="text-muted-foreground">{timeSince(org.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={!org.founderUserId || pendingAction?.orgId === org.id}
                          onClick={() => org.founderUserId && resendOtp.mutate({ orgId: org.id, userId: org.founderUserId })}
                        >
                          {pendingAction?.orgId === org.id && pendingAction.type === 'resend' ? 'Sending…' : 'Resend OTP'}
                        </Button>
                        <Button
                          size="sm"
                          disabled={!org.founderUserId || pendingAction?.orgId === org.id}
                          onClick={() => org.founderUserId && verify.mutate({ orgId: org.id, userId: org.founderUserId })}
                        >
                          {pendingAction?.orgId === org.id && pendingAction.type === 'verify' ? 'Verifying…' : 'Verify'}
                        </Button>
                      </div>
                    </TableCell>
                  </>
                )}
                {stage === 'onboarding_incomplete' && (
                  <>
                    <TableCell className="text-muted-foreground">{org.founderVerifiedAt ? formatDate(org.founderVerifiedAt) : '—'}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {ONBOARDING_STEP_LABEL[org.onboardingCurrentStep] ?? `Step ${org.onboardingCurrentStep}`}
                    </TableCell>
                  </>
                )}
                {stage === 'onboarded_no_sms' && (
                  <>
                    <TableCell className="text-muted-foreground">{org.onboardingCompletedAt ? formatDate(org.onboardingCompletedAt) : '—'}</TableCell>
                    <TableCell className="text-muted-foreground">{org.senderIdStatus ?? 'none'}</TableCell>
                  </>
                )}
                {stage === 'activated' && (
                  <>
                    <TableCell className="text-muted-foreground">{org.firstSentAt ? formatDate(org.firstSentAt) : '—'}</TableCell>
                    <TableCell className="text-muted-foreground">{org.lastSentAt ? timeSince(org.lastSentAt) : '—'}</TableCell>
                  </>
                )}
              </TableRow>
            ))}
            {orgs.data?.organizations.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="py-10 text-center text-muted-foreground">
                  No organizations match this filter.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {orgs.data && (
        <PaginationControls page={orgs.data.page} total={orgs.data.total} pageSize={orgs.data.pageSize} onPageChange={setPage} />
      )}
    </div>
  );
}
