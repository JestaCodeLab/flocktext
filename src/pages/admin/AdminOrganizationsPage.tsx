import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
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

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by church name…"
          className="pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
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
                <TableCell className="text-muted-foreground">{new Date(org.createdAt).toLocaleDateString()}</TableCell>
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
