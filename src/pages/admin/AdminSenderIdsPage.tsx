import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Pencil,
  Send,
  X,
  RefreshCw,
  ShieldCheck,
  CircleCheck,
  MoreVertical,
  RotateCcw,
  Trash2,
  ExternalLink,
  Hourglass,
  BadgeCheck,
  XCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { RejectSenderIdDialog } from '@/components/admin/RejectSenderIdDialog';
import { EditSenderIdDialog, type EditSenderIdTarget } from '@/components/admin/EditSenderIdDialog';
import { DeleteSenderIdPermanentlyDialog } from '@/components/admin/DeleteSenderIdPermanentlyDialog';
import { MobileList, MobileListCard, MobileListEmpty, MobileListRow } from '@/components/admin/MobileRecordList';
import {
  fetchAllSenderIds,
  registerSenderId,
  markSenderIdRegistered,
  approveSenderId,
  rejectSenderId,
  editSenderId,
  checkBmsStatus,
  restoreSenderId,
  permanentlyDeleteSenderId,
} from '@/api/adminSenderIds';
import { apiErrorMessage } from '@/api/client';
import { senderIdStatusLabel, senderIdStatusVariant } from '@/lib/senderIdStatus';
import { cn } from '@/lib/utils';
import type { AdminSenderIdRow } from '@/types/admin';

type ReviewTabKey = 'pending' | 'approved' | 'rejected' | 'deleted';

const TRIGGER_CLASS = 'data-active:text-primary data-active:font-bold data-active:after:bg-primary';

export function AdminSenderIdsPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const all = useQuery({ queryKey: ['admin-sender-ids-all'], queryFn: fetchAllSenderIds });

  const [activeTab, setActiveTab] = useState<ReviewTabKey>('pending');
  const [rejectTarget, setRejectTarget] = useState<AdminSenderIdRow | null>(null);
  const [editTarget, setEditTarget] = useState<(EditSenderIdTarget & { orgId: string }) | null>(null);
  const [permanentDeleteTarget, setPermanentDeleteTarget] = useState<AdminSenderIdRow | null>(null);

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['admin-sender-ids-all'] });
    queryClient.invalidateQueries({ queryKey: ['admin-dashboard-summary'] });
  }

  const register = useMutation({
    mutationFn: (row: AdminSenderIdRow) => registerSenderId(row.orgId, row.senderIdId),
    onSuccess: () => {
      toast.success('Submitted to BMS Africa for registration.');
      invalidate();
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not register this sender ID with BMS Africa.')),
  });

  const markRegistered = useMutation({
    mutationFn: (row: AdminSenderIdRow) => markSenderIdRegistered(row.orgId, row.senderIdId),
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
    mutationFn: (row: AdminSenderIdRow) => checkBmsStatus(row.orgId, row.senderIdId),
    onSuccess: () => invalidate(),
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const approve = useMutation({
    mutationFn: (row: AdminSenderIdRow) => approveSenderId(row.orgId, row.senderIdId),
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

  const restore = useMutation({
    mutationFn: (row: AdminSenderIdRow) => restoreSenderId(row.orgId, row.senderIdId),
    onSuccess: () => {
      toast.success('Sender ID restored — the organization can send with it again.');
      invalidate();
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const permanentlyDelete = useMutation({
    mutationFn: () => permanentlyDeleteSenderId(permanentDeleteTarget!.orgId, permanentDeleteTarget!.senderIdId),
    onSuccess: () => {
      toast.success('Sender ID permanently deleted.');
      setPermanentDeleteTarget(null);
      invalidate();
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  function openEdit(row: AdminSenderIdRow) {
    setEditTarget({ orgId: row.orgId, senderIdId: row.senderIdId, senderId: row.senderId, purpose: row.purpose });
  }

  function renderActions(row: AdminSenderIdRow) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button size="icon-sm" variant="ghost" title="Actions">
              <MoreVertical className="h-3.5 w-3.5" />
            </Button>
          }
        />
        <DropdownMenuContent align="end" className="w-56">
          {row.status === 'pending_review' && (
            <>
              <DropdownMenuItem className="cursor-pointer" disabled={register.isPending} onClick={() => register.mutate(row)}>
                <Send className="h-3.5 w-3.5" /> Register
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer"
                disabled={markRegistered.isPending}
                onClick={() => markRegistered.mutate(row)}
                title="Use if this sender ID was already registered with BMS Africa before this request"
              >
                <CircleCheck className="h-3.5 w-3.5" /> Already registered
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" onClick={() => openEdit(row)}>
                <Pencil className="h-3.5 w-3.5" /> Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" className="cursor-pointer" onClick={() => setRejectTarget(row)}>
                <X className="h-3.5 w-3.5" /> Reject
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
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
              <DropdownMenuSeparator />
            </>
          )}
          {row.status === 'rejected' && (
            <>
              <DropdownMenuItem className="cursor-pointer" onClick={() => openEdit(row)}>
                <Pencil className="h-3.5 w-3.5" /> Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          {row.status === 'deleted' && (
            <>
              <DropdownMenuItem className="cursor-pointer" disabled={restore.isPending} onClick={() => restore.mutate(row)}>
                <RotateCcw className="h-3.5 w-3.5" /> Restore
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" className="cursor-pointer" onClick={() => setPermanentDeleteTarget(row)}>
                <Trash2 className="h-3.5 w-3.5" /> Delete permanently
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem className="cursor-pointer" onClick={() => navigate(`/admin/organizations/${row.orgId}`)}>
            <ExternalLink className="h-3.5 w-3.5" /> View organization
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  const rows = all.data ?? [];
  const pendingRows = rows.filter((r) => r.status === 'pending_review' || r.status === 'processing');
  const approvedRows = rows.filter((r) => r.status === 'approved');
  const rejectedRows = rows.filter((r) => r.status === 'rejected');
  const deletedRows = rows.filter((r) => r.status === 'deleted');

  const TABS: { key: ReviewTabKey; label: string; icon: LucideIcon; rows: AdminSenderIdRow[] }[] = [
    { key: 'pending', label: 'Pending', icon: Hourglass, rows: pendingRows },
    { key: 'approved', label: 'Approved', icon: BadgeCheck, rows: approvedRows },
    { key: 'rejected', label: 'Rejected', icon: XCircle, rows: rejectedRows },
    { key: 'deleted', label: 'Deleted', icon: Trash2, rows: deletedRows },
  ];

  function renderTable(tabRows: AdminSenderIdRow[], emptyLabel: string, showReason: boolean) {
    return (
      <div>
        <MobileList className="mb-7">
          {tabRows.map((row) => (
            <MobileListCard key={row.senderIdId}>
              <div className="mb-2 flex items-start justify-between gap-2">
                <span className="font-semibold">{row.churchName || 'Untitled organization'}</span>
                {renderActions(row)}
              </div>
              <MobileListRow label="Sender ID" value={row.senderId} />
              <MobileListRow label="Purpose" value={row.purpose || '—'} />
              <MobileListRow label="Status" value={<Badge variant={senderIdStatusVariant[row.status]}>{senderIdStatusLabel[row.status]}</Badge>} />
              {showReason && <MobileListRow label="Reason" value={row.rejectionReason || '—'} />}
              {!showReason && <MobileListRow label="BMS status" value={row.bmsStatus || '—'} />}
              <MobileListRow label="Submitted" value={new Date(row.submittedAt).toLocaleDateString()} />
            </MobileListCard>
          ))}
        </MobileList>
        {tabRows.length === 0 && <MobileListEmpty>{emptyLabel}</MobileListEmpty>}

        <div className="hidden overflow-hidden rounded-xl border border-border bg-card md:block">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary hover:bg-secondary">
                <TableHead>Church</TableHead>
                <TableHead>Sender ID</TableHead>
                <TableHead>Purpose</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>{showReason ? 'Reason' : 'BMS status'}</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead className="w-0">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tabRows.map((row) => (
                <TableRow key={row.senderIdId}>
                  <TableCell className="font-semibold">{row.churchName || 'Untitled organization'}</TableCell>
                  <TableCell>{row.senderId}</TableCell>
                  <TableCell className="max-w-[220px] truncate text-muted-foreground">{row.purpose}</TableCell>
                  <TableCell>
                    <Badge variant={senderIdStatusVariant[row.status]}>{senderIdStatusLabel[row.status]}</Badge>
                  </TableCell>
                  <TableCell className="max-w-[220px] truncate text-muted-foreground">
                    {showReason ? row.rejectionReason || '—' : row.bmsStatus || '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{new Date(row.submittedAt).toLocaleDateString()}</TableCell>
                  <TableCell>{renderActions(row)}</TableCell>
                </TableRow>
              ))}
              {tabRows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    {emptyLabel}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 text-[26px] font-extrabold">Sender ID Review</div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ReviewTabKey)}>
        <div className="mb-6 overflow-x-auto border-b">
          <TabsList variant="line" className="group-data-[orientation=horizontal]/tabs:h-auto min-w-0 justify-start gap-6 p-0">
            {TABS.map((tab) => (
              <TabsTrigger key={tab.key} value={tab.key} className={cn('h-auto px-0 py-3', TRIGGER_CLASS)}>
                <tab.icon className="h-3.5 w-3.5" /> {tab.label} ({tab.rows.length})
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="pending">{renderTable(pendingRows, 'Nothing awaiting review.', false)}</TabsContent>
        <TabsContent value="approved">{renderTable(approvedRows, 'No approved sender IDs yet.', false)}</TabsContent>
        <TabsContent value="rejected">{renderTable(rejectedRows, 'No rejected sender IDs.', true)}</TabsContent>
        <TabsContent value="deleted">{renderTable(deletedRows, 'No deleted sender IDs.', false)}</TabsContent>
      </Tabs>

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
      <DeleteSenderIdPermanentlyDialog
        target={permanentDeleteTarget}
        onOpenChange={(open) => !open && setPermanentDeleteTarget(null)}
        onConfirm={() => permanentlyDelete.mutate()}
        isPending={permanentlyDelete.isPending}
      />
    </div>
  );
}
