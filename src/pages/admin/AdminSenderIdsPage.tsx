import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Send, X, RefreshCw, ShieldCheck, CircleCheck, MoreVertical } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { RejectSenderIdDialog } from '@/components/admin/RejectSenderIdDialog';
import { EditSenderIdDialog, type EditSenderIdTarget } from '@/components/admin/EditSenderIdDialog';
import {
  fetchPendingSenderIds,
  fetchAllSenderIds,
  registerSenderId,
  markSenderIdRegistered,
  approveSenderId,
  rejectSenderId,
  editSenderId,
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
  const [editTarget, setEditTarget] = useState<(EditSenderIdTarget & { orgId: string }) | null>(null);

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

  const markRegistered = useMutation({
    mutationFn: (entry: AdminSenderIdPendingEntry) => markSenderIdRegistered(entry.orgId, entry.senderIdId),
    onSuccess: () => {
      toast.success('Marked as already registered with BMS Africa.');
      invalidate();
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const reject = useMutation({
    mutationFn: (reason: string) => rejectSenderId(rejectTarget!.orgId, rejectTarget!.senderIdId, reason),
    onSuccess: () => {
      toast.success('Rejected.');
      setRejectTarget(null);
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

  const edit = useMutation({
    mutationFn: ({ senderId, purpose }: { senderId: string; purpose: string }) =>
      editSenderId(editTarget!.orgId, editTarget!.senderIdId, { senderId, purpose }),
    onSuccess: () => {
      toast.success('Sender ID updated and resubmitted for review.');
      setEditTarget(null);
      invalidate();
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  return (
    <div>
      <div className="mb-6 text-[26px] font-extrabold">Sender ID Review</div>

      <div className="mb-3 text-[13px] font-bold text-foreground/80">Pending review ({pending.data?.length ?? 0})</div>
      <div className="mb-7 overflow-hidden rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary hover:bg-secondary">
              <TableHead>Church</TableHead>
              <TableHead>Sender ID</TableHead>
              <TableHead>Purpose</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead className="w-0">Actions</TableHead>
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
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button size="icon-sm" variant="ghost" title="Actions">
                          <MoreVertical className="h-3.5 w-3.5" />
                        </Button>
                      }
                    />
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem className="cursor-pointer" disabled={register.isPending} onClick={() => register.mutate(entry)}>
                        <Send className="h-3.5 w-3.5" /> Register
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="cursor-pointer"
                        disabled={markRegistered.isPending}
                        onClick={() => markRegistered.mutate(entry)}
                        title="Use if this sender ID was already registered with BMS Africa before this request"
                      >
                        <CircleCheck className="h-3.5 w-3.5" /> Already registered
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={() => setEditTarget({ orgId: entry.orgId, senderIdId: entry.senderIdId, senderId: entry.senderId, purpose: entry.purpose })}
                      >
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem variant="destructive" className="cursor-pointer" onClick={() => setRejectTarget(entry)}>
                        <X className="h-3.5 w-3.5" /> Reject
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
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
              <TableHead className="w-0">Actions</TableHead>
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
                  {(row.status === 'pending_review' || row.status === 'rejected' || row.status === 'processing') && (
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button size="icon-sm" variant="ghost" title="Actions">
                            <MoreVertical className="h-3.5 w-3.5" />
                          </Button>
                        }
                      />
                      <DropdownMenuContent align="end" className="w-52">
                        {(row.status === 'pending_review' || row.status === 'rejected') && (
                          <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={() => setEditTarget({ orgId: row.orgId, senderIdId: row.senderIdId, senderId: row.senderId, purpose: row.purpose })}
                          >
                            <Pencil className="h-3.5 w-3.5" /> Edit
                          </DropdownMenuItem>
                        )}
                        {row.status === 'processing' && (
                          <>
                            <DropdownMenuItem className="cursor-pointer" disabled={sync.isPending} onClick={() => sync.mutate(row)}>
                              <RefreshCw className="h-3.5 w-3.5" /> Check BMS status
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer" disabled={approve.isPending} onClick={() => approve.mutate(row)}>
                              <ShieldCheck className="h-3.5 w-3.5" /> Approve
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem variant="destructive" className="cursor-pointer" onClick={() => setRejectTarget(row)}>
                              <X className="h-3.5 w-3.5" /> Reject
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
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

      <EditSenderIdDialog
        target={editTarget}
        onOpenChange={(open) => !open && setEditTarget(null)}
        onConfirm={(senderId, purpose) => edit.mutate({ senderId, purpose })}
        isPending={edit.isPending}
      />
      <RejectSenderIdDialog
        target={rejectTarget}
        onOpenChange={(open) => !open && setRejectTarget(null)}
        onConfirm={(reason) => reject.mutate(reason)}
        isPending={reject.isPending}
      />
    </div>
  );
}
