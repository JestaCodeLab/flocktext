import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { RefreshCw, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { MobileList, MobileListCard, MobileListEmpty, MobileListRow } from '@/components/admin/MobileRecordList';
import { fetchAdminOrganizations } from '@/api/adminOrganizations';

export function AdminOrganizationsPage() {
  const [search, setSearch] = useState('');
  const orgs = useQuery({
    queryKey: ['admin-organizations', search],
    queryFn: () => fetchAdminOrganizations({ search: search || undefined }),
  });

  return (
    <div>
      <div className="mb-5">
        <div className="text-[26px] font-extrabold">Organizations</div>
        <div className="mt-0.5 text-sm text-muted-foreground">{orgs.data?.total ?? 0} total</div>
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
            <MobileListRow
              label="Joined"
              value={new Date(org.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            />
          </MobileListCard>
        ))}
      </MobileList>
      {!orgs.isLoading && orgs.data?.organizations.length === 0 && <MobileListEmpty>No organizations yet.</MobileListEmpty>}

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
            </TableRow>
          </TableHeader>
          <TableBody>
            {orgs.isLoading &&
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6}>
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
                  <div className="font-medium text-foreground">
                    {new Date(org.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(org.createdAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true })}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {orgs.data?.organizations.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  No organizations yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
