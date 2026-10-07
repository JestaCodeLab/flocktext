import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowDown, ArrowUp, Pencil, Play, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MobileListEmpty } from '@/components/admin/MobileRecordList';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { VideoPlayerDialog, formatDuration, PLATFORM_LABEL } from '@/components/howto/VideoPlayerDialog';
import {
  fetchAdminHowToVideos,
  uploadHowToVideoFile,
  createHowToVideo,
  updateHowToVideo,
  deleteHowToVideo,
} from '@/api/adminHowToVideos';
import { apiErrorMessage } from '@/api/client';
import type { HowToVideo, HowToVideoPlatform } from '@/types/admin';

const MAX_FILE_MB = 50;
const PLATFORM_ITEMS = [
  { value: 'mobile', label: PLATFORM_LABEL.mobile },
  { value: 'web', label: PLATFORM_LABEL.web },
];

function PlatformSelect({ value, onChange }: { value: HowToVideoPlatform | ''; onChange: (v: HowToVideoPlatform) => void }) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as HowToVideoPlatform)} items={PLATFORM_ITEMS}>
      <SelectTrigger>
        <SelectValue placeholder="Choose platform" />
      </SelectTrigger>
      <SelectContent>
        {PLATFORM_ITEMS.map((p) => (
          <SelectItem key={p.value} className="cursor-pointer" value={p.value}>
            {p.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function AdminHowToVideosPage() {
  const queryClient = useQueryClient();
  const videos = useQuery({ queryKey: ['admin-how-to-videos'], queryFn: fetchAdminHowToVideos });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin-how-to-videos'] });

  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [platform, setPlatform] = useState<HowToVideoPlatform | ''>('');
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);

  const [editing, setEditing] = useState<HowToVideo | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPlatform, setEditPlatform] = useState<HowToVideoPlatform>('web');

  const [previewing, setPreviewing] = useState<HowToVideo | null>(null);
  const [deleting, setDeleting] = useState<HowToVideo | null>(null);

  function openCreate() {
    setTitle('');
    setDescription('');
    setPlatform('');
    setFile(null);
    setProgress(0);
    setShowCreate(true);
  }

  function pickFile(f: File | undefined) {
    if (!f) return;
    if (!f.type.startsWith('video/')) return toast.error('Choose a video file.');
    if (f.size > MAX_FILE_MB * 1024 * 1024) return toast.error(`Video must be under ${MAX_FILE_MB} MB.`);
    setFile(f);
  }

  const create = useMutation({
    mutationFn: async () => {
      const uploaded = await uploadHowToVideoFile(file!, setProgress);
      return createHowToVideo({ ...uploaded, title, description, platform: platform as HowToVideoPlatform, published: true });
    },
    onSuccess: (v) => {
      toast.success(`"${v.title}" uploaded.`);
      setShowCreate(false);
      refresh();
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const update = useMutation({
    mutationFn: updateHowToVideo,
    onSuccess: () => {
      setEditing(null);
      refresh();
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteHowToVideo(id),
    onSuccess: () => {
      toast.success('Video deleted.');
      setDeleting(null);
      refresh();
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const list = videos.data ?? [];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="text-[24px] font-extrabold">How-to videos</div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Upload video
        </Button>
      </div>
      <div className="mb-5 text-sm text-muted-foreground">
        Short videos on using the platform. Published videos appear on every organization's "How-to videos" page, in the
        order shown here.
      </div>

      {list.length === 0 && !videos.isLoading && <MobileListEmpty>No videos yet.</MobileListEmpty>}

      <div className="space-y-3">
        {list.map((v, i) => (
          <div key={v.id} className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={() => setPreviewing(v)}
              className="group relative aspect-video w-full shrink-0 cursor-pointer overflow-hidden rounded-lg bg-black sm:w-44"
            >
              <img src={v.thumbnailUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
              <span className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-90 transition-opacity group-hover:opacity-100">
                <Play className="h-8 w-8 fill-white text-white" />
              </span>
              {v.duration > 0 && (
                <span className="absolute bottom-1 right-1 rounded bg-black/70 px-1.5 py-0.5 text-[11px] font-semibold text-white">
                  {formatDuration(v.duration)}
                </span>
              )}
            </button>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate font-semibold">{v.title}</span>
                <Badge variant={v.published ? 'default' : 'secondary'}>{v.published ? 'published' : 'draft'}</Badge>
                <Badge variant="outline">{PLATFORM_LABEL[v.platform]}</Badge>
              </div>
              {v.description && <div className="mt-1 line-clamp-2 text-sm text-muted-foreground">{v.description}</div>}
            </div>

            <div className="flex items-center gap-1 self-end sm:self-auto">
              <Button size="icon-sm" variant="ghost" title="Move up" disabled={i === 0 || update.isPending} onClick={() => update.mutate({ id: v.id, move: 'up' })}>
                <ArrowUp className="h-4 w-4" />
              </Button>
              <Button size="icon-sm" variant="ghost" title="Move down" disabled={i === list.length - 1 || update.isPending} onClick={() => update.mutate({ id: v.id, move: 'down' })}>
                <ArrowDown className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={update.isPending}
                onClick={() => update.mutate({ id: v.id, published: !v.published })}
              >
                {v.published ? 'Unpublish' : 'Publish'}
              </Button>
              <Button
                size="icon-sm"
                variant="ghost"
                title="Edit"
                onClick={() => {
                  setEditing(v);
                  setEditTitle(v.title);
                  setEditDescription(v.description);
                  setEditPlatform(v.platform);
                }}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button size="icon-sm" variant="ghost" title="Delete" onClick={() => setDeleting(v)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <VideoPlayerDialog video={previewing} onClose={() => setPreviewing(null)} />

      <Dialog open={showCreate} onOpenChange={(open) => !create.isPending && setShowCreate(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload how-to video</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="video-title">Title</Label>
              <Input id="video-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. How to send your first SMS" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="video-description">Description</Label>
              <Textarea id="video-description" value={description} maxLength={500} onChange={(e) => setDescription(e.target.value)} placeholder="What this video shows." />
            </div>
            <div className="space-y-1.5">
              <Label>Platform</Label>
              <PlatformSelect value={platform} onChange={setPlatform} />
              <div className="text-xs text-muted-foreground">Users on a phone are shown Mobile videos first; everyone else sees Web / Desktop.</div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="video-file">Video file</Label>
              <Input id="video-file" type="file" accept="video/*" disabled={create.isPending} onChange={(e) => pickFile(e.target.files?.[0])} />
              <div className="text-xs text-muted-foreground">MP4 recommended, up to {MAX_FILE_MB} MB.</div>
            </div>
            {create.isPending && (
              <div className="space-y-1">
                <div className="h-2 overflow-hidden rounded-full bg-secondary">
                  <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                </div>
                <div className="text-xs text-muted-foreground">{progress < 100 ? `Uploading… ${progress}%` : 'Processing…'}</div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" disabled={create.isPending} onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button disabled={create.isPending || !title.trim() || !description.trim() || !platform || !file} onClick={() => create.mutate()}>
              {create.isPending ? 'Uploading…' : 'Upload'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit video</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-video-title">Title</Label>
              <Input id="edit-video-title" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Platform</Label>
              <PlatformSelect value={editPlatform} onChange={setEditPlatform} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-video-description">Description</Label>
              <Textarea id="edit-video-description" value={editDescription} maxLength={500} onChange={(e) => setEditDescription(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button
              disabled={update.isPending || !editTitle.trim() || !editDescription.trim()}
              onClick={() => update.mutate({ id: editing!.id, title: editTitle, description: editDescription, platform: editPlatform })}
            >
              {update.isPending ? 'Saving…' : 'Save changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete "{deleting?.title}"?</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-muted-foreground">
            The video is removed from storage and disappears from every organization's How-to videos page. This can't be undone.
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button variant="destructive" disabled={remove.isPending} onClick={() => remove.mutate(deleting!.id)}>
              {remove.isPending ? 'Deleting…' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
