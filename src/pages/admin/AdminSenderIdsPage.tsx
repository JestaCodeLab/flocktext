import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Send, X, RefreshCw, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  fetchPendingSenderIds,
  fetchAllSenderIds,
  registerSenderId,
  approveSenderId,
  rejectSenderId,
  checkBmsStatus,
} from '@/api/adminSenderIds';
import { apiErrorMessage } from '@/api/client';
import { senderIdStatusLabel, senderIdStatusVariant } from '@/lib/senderIdStatus';
import type { AdminSenderIdPendingEntry } from '@/types/admin';

export function AdminSenderIdsPage() {
  const queryClient = useQueryClient();
  const pending = useQuery({ queryKey: ['admin-sender-ids-pending'], queryFn: fetchPendingSenderIds });
  const all = useQuery({ queryKey: ['admin-sender-ids-all'], queryFn: fetchAllSenderIds });

  const [rejectTarget, setRejectTarget] = useState<AdminSenderIdPendingEntry | null>(null);
  const [reason, setReason] = useState('');

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['admin-sender-ids-pending'] });
    queryClient.invalidateQueries({ queryKey: ['admin-sender-ids-all'] });
    queryClient.invalidateQueries({ queryKey: ['admin-dashboard-summary'] });
  }

  const register = useMutation({
    mutationFn: (entry: AdminSenderIdPendingEntry) => registerSenderId(entry.orgId, entry.senderIdId),
    onSuccess: () => {
      toast.success('Submitted to BMS Africa for registration.');
      invalidate();
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not register this sender ID with BMS Africa.')),
  });

  const reject = useMutation({
    mutationFn: () => rejectSenderId(rejectTarget!.orgId, rejectTarget!.senderIdId, reason),
    onSuccess: () => {
      toast.success('Rejected.');
      setRejectTarget(null);
      setReason('');
      invalidate();
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const sync = useMutation({
    mutationFn: (row: { orgId: string; senderIdId: string }) => checkBmsStatus(row.orgId, row.senderIdId),
    onSuccess: () => invalidate(),
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const approve = useMutation({
    mutationFn: (row: { orgId: string; senderIdId: string }) => approveSenderId(row.orgId, row.senderIdId),
    onSuccess: () => {
      toast.success('Approved.');
      invalidate();
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  return (
    <div>
      <div className="mb-6 text-[26px] font-extrabold">Sender ID review</div>

      <div className="mb-3 text-[13px] font-bold text-foreground/80">Pending review ({pending.data?.length ?? 0})</div>
      <div className="mb-7 overflow-hidden rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary hover:bg-secondary">
              <TableHead>Church</TableHead>
              <TableHead>Sender ID</TableHead>
              <TableHead>Purpose</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pending.data?.map((entry) => (
              <TableRow key={entry.senderIdId}>
                <TableCell className="font-semibold">{entry.churchName || 'Untitled organization'}</TableCell>
                <TableCell>{entry.senderId}</TableCell>
                <TableCell className="max-w-[280px] text-muted-foreground">{entry.purpose}</TableCell>
                <TableCell className="text-muted-foreground">{new Date(entry.submittedAt).toLocaleDateString()}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <Button size="sm" disabled={register.isPending} onClick={() => register.mutate(entry)}>
                      <Send className="h-4 w-4" /> Register
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => setRejectTarget(entry)}>
                      <X className="h-4 w-4" /> Reject
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {pending.data?.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  Nothing awaiting review.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="mb-3 text-[13px] font-bold text-foreground/80">All sender IDs</div>
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary hover:bg-secondary">
              <TableHead>Church</TableHead>
              <TableHead>Sender ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>BMS status</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {all.data?.map((row) => (
              <TableRow key={row.senderIdId}>
                <TableCell className="font-semibold">{row.churchName || 'Untitled organization'}</TableCell>
                <TableCell>{row.senderId}</TableCell>
                <TableCell>
                  <Badge variant={senderIdStatusVariant[row.status]}>{senderIdStatusLabel[row.status]}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{row.bmsStatus || '—'}</TableCell>
                <TableCell>
                  {row.status === 'pending_bms' && (
                    <div className="flex items-center gap-1.5">
                      <Button size="sm" variant="outline" disabled={sync.isPending} onClick={() => sync.mutate(row)}>
                        <RefreshCw className="h-3.5 w-3.5" /> Check BMS status
                      </Button>
                      <Button size="sm" disabled={approve.isPending} onClick={() => approve.mutate(row)}>
                        <ShieldCheck className="h-3.5 w-3.5" /> Approve
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => setRejectTarget(row)}>
                        <X className="h-3.5 w-3.5" /> Reject
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {all.data?.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  No sender ID requests yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!rejectTarget} onOpenChange={(open) => !open && setRejectTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject sender ID</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="reject-reason">Reason</Label>
            <Input id="reject-reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Not appropriate for church notifications…" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" disabled={reject.isPending || !reason} onClick={() => reject.mutate()}>
              {reject.isPending ? 'Rejecting…' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
