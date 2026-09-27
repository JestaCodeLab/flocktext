import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, History, Search, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRangeFilter } from '@/components/filters/DateRangeFilter';
import { MobileList, MobileListCard, MobileListEmpty, MobileListRow } from '@/components/admin/MobileRecordList';
import { fetchAdminActivityLogs } from '@/api/adminActivityLogs';
import { fetchAdminOrganizations } from '@/api/adminOrganizations';
import type { AdminOrgListItem } from '@/types/admin';
import type { DateRangeParams } from '@/lib/dateRange';

const PAGE_SIZE = 20;
const MAX_ORG_RESULTS = 20;

// The handful of actions the admin console specifically surfaces as filter options -
// several of these are more than one raw `action` value (e.g. both login paths, or
// either settings-update endpoint), so the value here is comma-joined and split again
// server-side (see adminActivityLogController.list). Everything else still shows up
// unfiltered under "All activity", labeled via ACTION_LABELS below.
const ACTION_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: 'auth.login,auth.pin_login', label: 'Login' },
  { value: 'message.sent', label: 'Sent SMS' },
  { value: 'message.scheduled', label: 'Scheduled SMS' },
  { value: 'contact.created,contact.bulk_created', label: 'Added contact' },
  { value: 'contact.imported', label: 'Imported contacts' },
  { value: 'group.created', label: 'Created group' },
  { value: 'group.members_added', label: 'Added contacts to group' },
  { value: 'organization.birthday_automation_toggled', label: 'Birthday automation' },
  { value: 'template.created', label: 'Created template' },
  { value: 'organization.profile_updated,organization.notification_prefs_updated', label: 'Settings update' },
  { value: 'account.created', label: 'New account creation' },
];

// Every `action` value services/activityLog.js's call sites are known to write, for
// the badge shown per row. Anything not listed here (a future action type) falls back
// to prettifyAction() below rather than showing a raw dotted string.
const ACTION_LABELS: Record<string, string> = {
  'auth.login': 'Login',
  'auth.pin_login': 'PIN login',
  'auth.logout': 'Logout',
  'account.created': 'Account created',
  'account.deletion_requested': 'Account deletion requested',
  'contact.created': 'Contact added',
  'contact.bulk_created': 'Contacts added',
  'contact.updated': 'Contact updated',
  'contact.deleted': 'Contact deleted',
  'contact.bulk_deleted': 'Contacts deleted',
  'contact.imported': 'Contacts imported',
  'group.created': 'Group created',
  'group.members_added': 'Added to group',
  'template.created': 'Template created',
  'team.invite': 'Team invite',
  'team.role_change': 'Role changed',
  'team.revoke': 'Access revoked',
  'team.restore': 'Access restored',
  'team.remove': 'Team member removed',
  'organization.sender_id_added': 'Sender ID submitted',
  'organization.sender_id_primary_changed': 'Primary sender ID changed',
  'organization.sender_id_removed': 'Sender ID removed',
  'organization.birthday_automation_toggled': 'Birthday automation toggled',
  'organization.profile_updated': 'Profile updated',
  'organization.notification_prefs_updated': 'Notification settings updated',
  'message.sent': 'SMS sent',
  'message.scheduled': 'SMS scheduled',
  'ticket.created': 'Support ticket created',
  'addon.purchase': 'Addon purchased',
};

function prettifyAction(action: string) {
  const tail = action.split('.').pop() || action;
  const words = tail.replace(/_/g, ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function actionLabel(action: string) {
  return ACTION_LABELS[action] || prettifyAction(action);
}

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

// Compact inline org search-and-select, replacing the input with a "selected org"
// chip once one is picked (same pattern as RecordTransactionDialog's org picker,
// adapted for a page filter bar instead of a dialog field).
function OrgFilter({ org, onChange }: { org: AdminOrgListItem | null; onChange: (org: AdminOrgListItem | null) => void }) {
  const [input, setInput] = useState('');

  const results = useQuery({
    queryKey: ['admin-organizations-search', input],
    queryFn: () => fetchAdminOrganizations({ search: input, pageSize: MAX_ORG_RESULTS }),
    enabled: input.trim().length > 0 && !org,
  });

  if (org) {
    return (
      <div className="flex items-center gap-1.5 rounded-lg border border-border bg-secondary/40 py-1.5 pl-3 pr-1.5 text-sm">
        <span className="max-w-[180px] truncate font-semibold">{org.churchName}</span>
        <Button size="icon-sm" variant="ghost" onClick={() => onChange(null)}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="relative w-56">
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input placeholder="Filter by organization…" className="pl-10" value={input} onChange={(e) => setInput(e.target.value)} />
      {input.trim().length > 0 && (
        <div className="absolute z-10 mt-1 max-h-[220px] w-full overflow-auto rounded-lg border border-border bg-popover shadow-md">
          {results.isLoading && <div className="p-3 text-sm text-muted-foreground">Searching…</div>}
          {!results.isLoading && (results.data?.organizations.length ?? 0) === 0 && (
            <div className="p-3 text-sm text-muted-foreground">No organizations found.</div>
          )}
          {results.data?.organizations.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => {
                onChange(o);
                setInput('');
              }}
              className="flex w-full items-center justify-between gap-3 border-b border-border px-3 py-2 text-left last:border-b-0 hover:bg-secondary/60"
            >
              <div className="truncate text-sm font-semibold">{o.churchName}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function AdminActivityLogsPage() {
  const [org, setOrg] = useState<AdminOrgListItem | null>(null);
  const [action, setAction] = useState('all');
  const [range, setRange] = useState<DateRangeParams>({ preset: 'this_month' });
  const [page, setPage] = useState(1);

  const logs = useQuery({
    queryKey: ['admin-activity-logs', org?.id, action, range, page],
    queryFn: () =>
      fetchAdminActivityLogs({
        organization: org?.id,
        action: action === 'all' ? undefined : action,
        ...range,
        page,
        pageSize: PAGE_SIZE,
      }),
  });

  return (
    <div>
      <div className="mb-5">
        <div className="text-[24px] font-extrabold">Activity Logs</div>
        <div className="mt-0.5 text-sm text-muted-foreground">
          Logins, sends, and account changes across every organization on the platform.
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2.5">
        <OrgFilter
          org={org}
          onChange={(o) => {
            setOrg(o);
            setPage(1);
          }}
        />
        <Select
          value={action}
          onValueChange={(v) => {
            setAction(v as string);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All activity</SelectItem>
            {ACTION_FILTER_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DateRangeFilter
          range={range}
          onChange={(r) => {
            setRange(r);
            setPage(1);
          }}
          includeAllTime
          size="sm"
        />
      </div>

      {logs.isLoading && (
        <div className="flex flex-col gap-2.5 md:hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[110px] rounded-xl" />
          ))}
        </div>
      )}
      <MobileList>
        {logs.data?.rows.map((entry) => (
          <MobileListCard key={entry.id}>
            <div className="mb-2 flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate font-semibold">
                  {entry.orgId ? (
                    <Link to={`/admin/organizations/${entry.orgId}`} className="hover:underline">
                      {entry.churchName}
                    </Link>
                  ) : (
                    entry.churchName
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(entry.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  {' · '}
                  {new Date(entry.date).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true })}
                </div>
              </div>
              <Badge variant="outline">{actionLabel(entry.action)}</Badge>
            </div>
            <MobileListRow label="Member" value={entry.actorName} />
            <MobileListRow label="Details" value={entry.description} />
          </MobileListCard>
        ))}
      </MobileList>
      {!logs.isLoading && logs.data?.rows.length === 0 && <MobileListEmpty>No activity in this range.</MobileListEmpty>}

      <div className="hidden overflow-hidden rounded-xl border border-border bg-card md:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary hover:bg-secondary">
              <TableHead>Date</TableHead>
              <TableHead>Organization</TableHead>
              <TableHead>Member</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.isLoading &&
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={5}>
                    <Skeleton className="h-5 w-full" />
                  </TableCell>
                </TableRow>
              ))}
            {logs.data?.rows.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell>
                  <div className="font-medium text-foreground">
                    {new Date(entry.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(entry.date).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true })}
                  </div>
                </TableCell>
                <TableCell className="font-semibold">
                  {entry.orgId ? (
                    <Link to={`/admin/organizations/${entry.orgId}`} className="hover:underline">
                      {entry.churchName}
                    </Link>
                  ) : (
                    entry.churchName
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">{entry.actorName}</TableCell>
                <TableCell>
                  <Badge variant="outline">{actionLabel(entry.action)}</Badge>
                </TableCell>
                <TableCell className="max-w-[360px] truncate text-muted-foreground">{entry.description}</TableCell>
              </TableRow>
            ))}
            {!logs.isLoading && logs.data?.rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <History className="h-5 w-5 text-muted-foreground" />
                    No activity in this range.
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {logs.data && <PaginationControls page={page} total={logs.data.total} onPageChange={setPage} />}
    </div>
  );
}
