import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Plus,
  X,
  Eye,
  Pencil,
  Trash2,
  Megaphone,
  MessageSquareText,
  Sparkles,
  FileText,
  Send,
  Users,
  Clock,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MobileList, MobileListCard, MobileListEmpty, MobileListRow } from '@/components/admin/MobileRecordList';
import { MiniStatCard } from '@/components/messages/MessageDetailBody';
import { FeatureAnnouncementModal } from '@/components/announcements/FeatureAnnouncementModal';
import {
  fetchAdminAnnouncements,
  createAnnouncement,
  type CreateFeatureAnnouncementPayload,
  type CreateSmsAnnouncementPayload,
} from '@/api/adminAnnouncements';
import { fetchAdminOrganizations } from '@/api/adminOrganizations';
import {
  fetchAdminTemplates,
  createAdminTemplate,
  updateAdminTemplate,
  deleteAdminTemplate,
} from '@/api/adminTemplates';
import { apiErrorMessage } from '@/api/client';
import { cn } from '@/lib/utils';
import type { AdminTemplate, AnnouncementLinkItem, AnnouncementMediaItem, AnnouncementStatus, AnnouncementType } from '@/types/admin';

type PageTabKey = AnnouncementType | 'templates';

const PAGE_TABS: { key: PageTabKey; label: string; icon: LucideIcon }[] = [
  { key: 'sms', label: 'SMS', icon: MessageSquareText },
  { key: 'feature', label: 'Feature', icon: Sparkles },
  { key: 'templates', label: 'Templates', icon: FileText },
];

const TRIGGER_CLASS = 'data-active:text-primary data-active:font-bold data-active:after:bg-primary';

const STATUS_BADGE: Record<AnnouncementStatus, { label: string; variant: 'secondary' | 'success' | 'destructive' }> = {
  queued: { label: 'Queued', variant: 'secondary' },
  sending: { label: 'Sending', variant: 'secondary' },
  sent: { label: 'Sent', variant: 'success' },
  failed: { label: 'Failed', variant: 'destructive' },
};

const emptySmsForm: Omit<CreateSmsAnnouncementPayload, 'type'> = { title: '', message: '' };
const emptyFeatureForm: Omit<CreateFeatureAnnouncementPayload, 'type'> = { title: '', subtext: '', media: [], links: [] };

function SectionCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-6 rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4.5 w-4.5" />
        </div>
        <div>
          <div className="text-[15px] font-bold">{title}</div>
          <div className="mt-0.5 text-sm text-muted-foreground">{description}</div>
        </div>
      </div>
      {children}
    </div>
  );
}

function HistoryTable({
  rows,
  emptyLabel,
}: {
  rows: { id: string; title: string; status: AnnouncementStatus; createdBy: { id: string; name: string } | null; notificationsCreated: number; pushSent: number; pushFailed: number; createdAt: string }[];
  emptyLabel: string;
}) {
  return (
    <div>
      <MobileList>
        {rows.map((a) => (
          <MobileListCard key={a.id}>
            <div className="mb-2 flex items-start justify-between gap-2">
              <span className="font-semibold">{a.title}</span>
              <Badge variant={STATUS_BADGE[a.status].variant} className="shrink-0">
                {STATUS_BADGE[a.status].label}
              </Badge>
            </div>
            <MobileListRow label="Sent by" value={a.createdBy?.name ?? '—'} />
            <MobileListRow label="Orgs notified" value={a.notificationsCreated} />
            <MobileListRow label="Push sent / failed" value={`${a.pushSent} / ${a.pushFailed}`} />
            <MobileListRow label="Date" value={new Date(a.createdAt).toLocaleDateString()} />
          </MobileListCard>
        ))}
      </MobileList>
      {rows.length === 0 && <MobileListEmpty>{emptyLabel}</MobileListEmpty>}

      <div className="hidden overflow-hidden rounded-xl border border-border bg-card md:block">
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
            {rows.map((a) => (
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
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
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

export function AdminAnnouncementsPage() {
  const [activeTab, setActiveTab] = useState<PageTabKey>('sms');

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Megaphone className="h-5 w-5" />
        </div>
        <div>
          <div className="text-[26px] font-extrabold leading-tight">Announcements</div>
          <div className="text-sm text-muted-foreground">Broadcast updates to every organization, and manage reusable message templates.</div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as PageTabKey)}>
        <div className="mb-6 overflow-x-auto border-b">
          <TabsList variant="line" className="group-data-[orientation=horizontal]/tabs:h-auto min-w-0 justify-start gap-6 p-0">
            {PAGE_TABS.map((tab) => (
              <TabsTrigger key={tab.key} value={tab.key} className={cn('h-auto px-0 py-3', TRIGGER_CLASS)}>
                <tab.icon className="h-3.5 w-3.5" /> {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="sms">
          <SmsAnnouncementsTab />
        </TabsContent>
        <TabsContent value="feature">
          <FeatureAnnouncementsTab />
        </TabsContent>
        <TabsContent value="templates">
          <TemplatesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SmsAnnouncementsTab() {
  const queryClient = useQueryClient();
  const announcements = useQuery({
    queryKey: ['admin-announcements', 'sms'],
    queryFn: () => fetchAdminAnnouncements('sms'),
  });
  const activeOrgs = useQuery({
    queryKey: ['admin-organizations-active-count'],
    queryFn: () => fetchAdminOrganizations({ status: 'active' }),
  });

  const [form, setForm] = useState(emptySmsForm);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const send = useMutation({
    mutationFn: () => createAnnouncement({ type: 'sms', ...form }),
    onSuccess: () => {
      toast.success('Announcement sent.');
      setForm(emptySmsForm);
      setConfirmOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] });
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const canSend = form.title.trim().length > 0 && form.message.trim().length > 0;
  const rows = announcements.data?.announcements ?? [];
  const lastSent = rows[0];

  return (
    <div>
      <div className="mb-6 grid grid-cols-2 gap-3.5 sm:grid-cols-3">
        <MiniStatCard icon={Send} label="Announcements sent" value={announcements.data?.total ?? 0} tint="muted" />
        <MiniStatCard icon={Users} label="Orgs on platform" value={activeOrgs.data?.total ?? 0} tint="primary" />
        <MiniStatCard
          icon={Clock}
          label="Last sent"
          value={lastSent ? new Date(lastSent.createdAt).toLocaleDateString() : '—'}
          tint="muted"
        />
      </div>

      <SectionCard
        icon={MessageSquareText}
        title="Broadcast an SMS-style announcement"
        description="A plain-text update to every organization on the platform, delivered to the in-app notification bell and, where registered, as a mobile push notification."
      >
        <div className="max-w-xl space-y-3">
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
      </SectionCard>

      <HistoryTable rows={rows} emptyLabel="No SMS announcements sent yet." />

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

function FeatureAnnouncementsTab() {
  const queryClient = useQueryClient();
  const announcements = useQuery({
    queryKey: ['admin-announcements', 'feature'],
    queryFn: () => fetchAdminAnnouncements('feature'),
  });
  const activeOrgs = useQuery({
    queryKey: ['admin-organizations-active-count'],
    queryFn: () => fetchAdminOrganizations({ status: 'active' }),
  });

  const [form, setForm] = useState(emptyFeatureForm);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const send = useMutation({
    mutationFn: () => createAnnouncement({ type: 'feature', ...form }),
    onSuccess: () => {
      toast.success('Feature announcement sent.');
      setForm(emptyFeatureForm);
      setConfirmOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] });
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const canSend = form.title.trim().length > 0 && form.subtext.trim().length > 0;
  const rows = announcements.data?.announcements ?? [];
  const lastSent = rows[0];

  function updateMedia(index: number, patch: Partial<AnnouncementMediaItem>) {
    setForm((f) => ({ ...f, media: f.media.map((m, i) => (i === index ? { ...m, ...patch } : m)) }));
  }
  function addMedia() {
    setForm((f) => (f.media.length >= 6 ? f : { ...f, media: [...f.media, { kind: 'image', url: '' }] }));
  }
  function removeMedia(index: number) {
    setForm((f) => ({ ...f, media: f.media.filter((_, i) => i !== index) }));
  }

  function updateLink(index: number, patch: Partial<AnnouncementLinkItem>) {
    setForm((f) => ({ ...f, links: f.links.map((l, i) => (i === index ? { ...l, ...patch } : l)) }));
  }
  function addLink() {
    setForm((f) => (f.links.length >= 3 ? f : { ...f, links: [...f.links, { label: '', url: '' }] }));
  }
  function removeLink(index: number) {
    setForm((f) => ({ ...f, links: f.links.filter((_, i) => i !== index) }));
  }

  return (
    <div>
      <div className="mb-6 grid grid-cols-2 gap-3.5 sm:grid-cols-3">
        <MiniStatCard icon={Send} label="Announcements sent" value={announcements.data?.total ?? 0} tint="muted" />
        <MiniStatCard icon={Users} label="Orgs on platform" value={activeOrgs.data?.total ?? 0} tint="primary" />
        <MiniStatCard
          icon={Clock}
          label="Last sent"
          value={lastSent ? new Date(lastSent.createdAt).toLocaleDateString() : '—'}
          tint="muted"
        />
      </div>

      <SectionCard
        icon={Sparkles}
        title="Broadcast a feature announcement"
        description={'A richer "what\'s new" card — an image carousel or video, a title, subtext, and up to a few links — shown to every organization the next time they open the app.'}
      >
        <div className="max-w-xl space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="feature-title">Title</Label>
            <Input
              id="feature-title"
              maxLength={120}
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Introducing recurring sends"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="feature-subtext">Subtext</Label>
            <Textarea
              id="feature-subtext"
              maxLength={500}
              value={form.subtext}
              onChange={(e) => setForm((f) => ({ ...f, subtext: e.target.value }))}
              placeholder="A brief explanation of what changed, and why it matters."
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Media (image carousel or video)</Label>
              <Button type="button" variant="outline" size="sm" disabled={form.media.length >= 6} onClick={addMedia}>
                <Plus className="h-3.5 w-3.5" /> Add media
              </Button>
            </div>
            {form.media.length === 0 && <div className="text-xs text-muted-foreground">No media added - the card will show title and subtext only.</div>}
            {form.media.map((m, i) => (
              <div key={i} className="flex gap-2">
                <Select value={m.kind} onValueChange={(v) => updateMedia(i, { kind: v as 'image' | 'video' })} items={[{ value: 'image', label: 'Image' }, { value: 'video', label: 'Video' }]}>
                  <SelectTrigger className="w-27.5 shrink-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem className="cursor-pointer" value="image">Image</SelectItem>
                    <SelectItem className="cursor-pointer" value="video">Video</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder="https://…"
                  value={m.url}
                  onChange={(e) => updateMedia(i, { url: e.target.value })}
                />
                <Button type="button" variant="ghost" size="icon" className="shrink-0" onClick={() => removeMedia(i)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Links</Label>
              <Button type="button" variant="outline" size="sm" disabled={form.links.length >= 3} onClick={addLink}>
                <Plus className="h-3.5 w-3.5" /> Add link
              </Button>
            </div>
            {form.links.length === 0 && <div className="text-xs text-muted-foreground">No links added - the card will just have a dismiss action.</div>}
            {form.links.map((l, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  className="w-30 shrink-0"
                  placeholder="Label"
                  maxLength={40}
                  value={l.label}
                  onChange={(e) => updateLink(i, { label: e.target.value })}
                />
                <Input
                  placeholder="https://…"
                  value={l.url}
                  onChange={(e) => updateLink(i, { url: e.target.value })}
                />
                <Button type="button" variant="ghost" size="icon" className="shrink-0" onClick={() => removeLink(i)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" disabled={!canSend} onClick={() => setPreviewOpen(true)}>
              <Eye className="h-3.5 w-3.5" /> Preview
            </Button>
            <Button disabled={!canSend} onClick={() => setConfirmOpen(true)}>
              Review &amp; send
            </Button>
          </div>
        </div>
      </SectionCard>

      <HistoryTable rows={rows} emptyLabel="No feature announcements sent yet." />

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send to {activeOrgs.data?.total ?? 0} organizations?</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded-lg border border-border bg-secondary/50 p-3.5">
              <div className="font-semibold">{form.title}</div>
              <div className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{form.subtext}</div>
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

      <FeatureAnnouncementModal
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        title={form.title || 'Title'}
        subtext={form.subtext || 'Subtext'}
        slides={form.media.filter((m) => m.url.trim()).map((m) => ({ kind: m.kind, url: m.url }))}
        links={[
          ...form.links.filter((l) => l.label.trim() && l.url.trim()).map((l) => ({ label: l.label, href: l.url })),
          { label: 'Got it', onClick: () => setPreviewOpen(false) },
        ]}
      />
    </div>
  );
}

const emptyTemplateForm = { name: '', body: '' };

function countSegments(body: string) {
  return Math.max(1, Math.ceil(body.length / 160));
}

function TemplatesTab() {
  const queryClient = useQueryClient();
  const templates = useQuery({ queryKey: ['admin-templates'], queryFn: fetchAdminTemplates });

  const [editing, setEditing] = useState<AdminTemplate | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyTemplateForm);
  const [deleteTarget, setDeleteTarget] = useState<AdminTemplate | null>(null);

  function openCreate() {
    setEditing(null);
    setForm(emptyTemplateForm);
    setShowForm(true);
  }

  function openEdit(template: AdminTemplate) {
    setEditing(template);
    setForm({ name: template.name, body: template.body });
    setShowForm(true);
  }

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['admin-templates'] });
  }

  const save = useMutation({
    mutationFn: () => (editing ? updateAdminTemplate({ id: editing.id, ...form }) : createAdminTemplate(form)),
    onSuccess: () => {
      toast.success(editing ? 'Template updated.' : 'Template created.');
      setShowForm(false);
      invalidate();
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const remove = useMutation({
    mutationFn: () => deleteAdminTemplate(deleteTarget!.id),
    onSuccess: () => {
      toast.success('Template deleted.');
      setDeleteTarget(null);
      invalidate();
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const rows = templates.data ?? [];

  return (
    <div>
      <div className="mb-6 rounded-xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FileText className="h-4.5 w-4.5" />
            </div>
            <div>
              <div className="text-[15px] font-bold">Reusable message templates</div>
              <div className="mt-0.5 text-sm text-muted-foreground">
                For internal ops use only — available in the "Send SMS" dialog on an organization's details page. Not
                visible to organizations in their own compose screen.
              </div>
            </div>
          </div>
          <Button size="sm" className="shrink-0" onClick={openCreate}>
            <Plus className="h-3.5 w-3.5" /> New template
          </Button>
        </div>
      </div>

      <MobileList>
        {rows.map((t) => (
          <MobileListCard key={t.id}>
            <div className="mb-2 flex items-start justify-between gap-2">
              <span className="font-semibold">{t.name}</span>
              <div className="flex shrink-0 items-center gap-1">
                <Button size="icon-sm" variant="ghost" onClick={() => openEdit(t)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button size="icon-sm" variant="ghost" className="text-destructive" onClick={() => setDeleteTarget(t)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            <div className="mb-2 text-sm text-muted-foreground">{t.preview || '—'}</div>
            <MobileListRow
              label="Created"
              value={new Date(t.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            />
          </MobileListCard>
        ))}
      </MobileList>
      {rows.length === 0 && <MobileListEmpty>No templates yet — create one for admins to reuse.</MobileListEmpty>}

      <div className="hidden overflow-hidden rounded-xl border border-border bg-card md:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary hover:bg-secondary">
              <TableHead>Name</TableHead>
              <TableHead>Preview</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-0">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-semibold">{t.name}</TableCell>
                <TableCell className="max-w-md truncate text-muted-foreground">{t.preview || '—'}</TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(t.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button size="icon-sm" variant="ghost" onClick={() => openEdit(t)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon-sm" variant="ghost" className="text-destructive" onClick={() => setDeleteTarget(t)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                  No templates yet — create one for admins to reuse.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? `Edit ${editing.name}` : 'New template'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="template-name">Name</Label>
              <Input
                id="template-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Wallet low balance reminder"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="template-body">Message</Label>
              <Textarea
                id="template-body"
                className="min-h-30 resize-y"
                value={form.body}
                onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                placeholder="Type the reusable message…"
              />
              <div className="text-xs text-muted-foreground">
                {form.body.length}/160 characters — {countSegments(form.body)} SMS segment(s)
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button disabled={save.isPending || !form.name.trim()} onClick={() => save.mutate()}>
              {save.isPending ? 'Saving…' : editing ? 'Save changes' : 'Create template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {deleteTarget?.name}?</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-muted-foreground">
            No longer available to organizations or in the Send SMS dialog. This cannot be undone.
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" disabled={remove.isPending} onClick={() => remove.mutate()}>
              {remove.isPending ? 'Deleting…' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
