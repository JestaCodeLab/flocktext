import { useQuery } from '@tanstack/react-query';
import { Navigate } from 'react-router-dom';
import { History } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { fetchActivityLog } from '@/api/activityLog';
import { useAuthStore } from '@/store/authStore';

export function ActivityLogPage() {
  const currentUser = useAuthStore((s) => s.session?.user);
  const log = useQuery({ queryKey: ['activity-log'], queryFn: fetchActivityLog, enabled: currentUser?.role === 'admin' });

  // Backend already 403s non-admins - this is just UX, no need to flash the page first.
  if (currentUser && currentUser.role !== 'admin') return <Navigate to="/app/dashboard" replace />;

  return (
    <div>
      <div className="mb-6 text-[26px] font-bold">Activity Log</div>

      {log.isLoading && (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      )}

      {!log.isLoading && log.data?.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-10 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <History className="h-5 w-5" />
          </div>
          <div className="text-sm text-muted-foreground">No activity recorded yet.</div>
        </div>
      )}

      {!!log.data?.length && (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date &amp; time</TableHead>
                <TableHead>Member</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {log.data.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>
                    <div className="font-medium text-foreground">
                      {new Date(entry.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(entry.date).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true })}
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold">{entry.actorName}</TableCell>
                  <TableCell className="text-muted-foreground">{entry.description}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
