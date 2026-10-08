import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { HowToVideo } from '@/types/admin';

export const PLATFORM_LABEL = { mobile: 'Mobile', web: 'Web / Desktop' } as const;

export function formatDuration(seconds: number) {
  if (!seconds) return '';
  const m = Math.floor(seconds / 60);
  const s = String(seconds % 60).padStart(2, '0');
  return `${m}:${s}`;
}

// Shared by the admin portal (preview) and the user portal's How-to videos page.
export function VideoPlayerDialog({ video, onClose }: { video: HowToVideo | null; onClose: () => void }) {
  return (
    <Dialog open={!!video} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{video?.title}</DialogTitle>
        </DialogHeader>
        {video && (
          <div className="space-y-3">
            <video key={video.id} src={video.videoUrl} poster={video.thumbnailUrl} controls autoPlay className="aspect-video w-full rounded-lg bg-black" />
            {video.description && <div className="text-sm text-muted-foreground">{video.description}</div>}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
