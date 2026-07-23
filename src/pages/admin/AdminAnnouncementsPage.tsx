import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { fetchAdminAnnouncements, createAnnouncement, type CreateAnnouncementPayload } from '@/api/adminAnnouncements';
import { fetchAdminOrganizations } from '@/api/adminOrganizations';
import { apiErrorMessage } from '@/api/client';
import type { AnnouncementStatus } from '@/types/admin';

const emptyForm: CreateAnnouncementPayload = { title: '', message: '' };

const STATUS_BADGE: Record<AnnouncementStatus, { label: string; variant: 'secondary' | 'success' | 'destructive' }> = {
  queued: { label: 'Queued', variant: 'secondary' },
  sending: { label: 'Sending', variant: 'secondary' },
  sent: { label: 'Sent', variant: 'success' },
  failed: { label: 'Failed', variant: 'destructive' },
};

export function AdminAnnouncementsPage() {
  const queryClient = useQueryClient();
  const announcements = useQuery({ queryKey: ['admin-announcements'], queryFn: () => fetchAdminAnnouncements() });
  const activeOrgs = useQuery({
    queryKey: ['admin-organizations-active-count'],
    queryFn: () => fetchAdminOrganizations({ status: 'active' }),
  });

  const [form, setForm] = useState<CreateAnnouncementPayload>(emptyForm);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const send = useMutation({
    mutationFn: () => createAnnouncement(form),
    onSuccess: () => {
      toast.success('Announcement sent.');
      setForm(emptyForm);
      setConfirmOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] });
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const canSend = form.title.trim().length > 0 && form.message.trim().length > 0;

  return (
    <div>
      <div className="mb-6 text-[26px] font-extrabold">Announcements</div>
      <div className="mb-5 text-sm text-muted-foreground">
        Broadcast an update to every organization on the platform. Delivered to the in-app notification bell for every
        user and, where registered, as a mobile push notification.
      </div>

      <div className="mb-8 max-w-xl space-y-3 rounded-xl border border-border bg-card p-5">
        <div className="space-y-1.5">
          <Label htmlFor="announcement-title">Title</Label>
          <Input
            id="announcement-title"
            maxLength={120}
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="e.g. New feature: scheduled birthday messages"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="announcement-message">Message</Label>
          <Textarea
            id="announcement-message"
            maxLength={1000}
            value={form.message}
            onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
            placeholder="What changed, and why it matters to them."
          />
        </div>
        <div className="flex justify-end">
          <Button disabled={!canSend} onClick={() => setConfirmOpen(true)}>
            Review &amp; send
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary hover:bg-secondary">
              <TableHead>Title</TableHead>
              <TableHead>Sent by</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Orgs notified</TableHead>
              <TableHead>Push sent / failed</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {announcements.data?.announcements.map((a) => (
              <TableRow key={a.id}>
                <TableCell className="max-w-xs font-semibold">{a.title}</TableCell>
                <TableCell className="text-muted-foreground">{a.createdBy?.name ?? '—'}</TableCell>
                <TableCell>
                  <Badge variant={STATUS_BADGE[a.status].variant}>{STATUS_BADGE[a.status].label}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{a.notificationsCreated}</TableCell>
                <TableCell className="text-muted-foreground">
                  {a.pushSent} / {a.pushFailed}
                </TableCell>
                <TableCell className="text-muted-foreground">{new Date(a.createdAt).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send to {activeOrgs.data?.total ?? 0} organizations?</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded-lg border border-border bg-secondary/50 p-3.5">
              <div className="font-semibold">{form.title}</div>
              <div className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{form.message}</div>
            </div>
            <p className="text-sm text-muted-foreground">
              This goes out immediately to every user in every active organization, and can't be recalled once sent.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button disabled={send.isPending} onClick={() => send.mutate()}>
              {send.isPending ? 'Sending…' : `Send to ${activeOrgs.data?.total ?? 0} organizations`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
