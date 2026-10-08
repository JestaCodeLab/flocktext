import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Play, PlayCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { VideoPlayerDialog, formatDuration, PLATFORM_LABEL } from '@/components/howto/VideoPlayerDialog';
import { fetchHowToVideos } from '@/api/howToVideos';
import type { HowToVideo, HowToVideoPlatform } from '@/types/admin';

// Phones get the mobile walkthroughs by default (tablets and up get web) - the toggle
// below lets anyone switch, e.g. someone on a laptop who wants to see the phone flow.
function defaultPlatform(): HowToVideoPlatform {
  return typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches ? 'mobile' : 'web';
}

export function HowToVideosPage() {
  const videos = useQuery({ queryKey: ['how-to-videos'], queryFn: fetchHowToVideos });
  const [playing, setPlaying] = useState<HowToVideo | null>(null);
  const [platform, setPlatform] = useState<HowToVideoPlatform>(defaultPlatform);
  const shown = videos.data?.filter((v) => v.platform === platform);

  return (
    <div>
      <div className="mb-1 text-[24px] font-extrabold">How-to videos</div>
      <div className="mb-6 text-sm text-muted-foreground">Short walkthroughs to help you get the most out of FlockText.</div>

      <div className="mb-5 inline-flex rounded-lg border border-border p-1">
        {(['mobile', 'web'] as const).map((p) => (
          <Button key={p} size="sm" variant={platform === p ? 'default' : 'ghost'} onClick={() => setPlatform(p)}>
            {PLATFORM_LABEL[p]}
          </Button>
        ))}
      </div>

      {videos.isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-56 w-full rounded-xl" />
          ))}
        </div>
      )}

      {shown?.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-16 text-center text-muted-foreground">
          <PlayCircle className="h-8 w-8" />
          <div className="text-sm">No {PLATFORM_LABEL[platform]} videos yet - check back soon.</div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {shown?.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => setPlaying(v)}
            className="group cursor-pointer overflow-hidden rounded-xl border border-border bg-card text-left transition-colors hover:border-primary/50"
          >
            <div className="relative aspect-video bg-black">
              <img src={v.thumbnailUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
              <span className="absolute inset-0 flex items-center justify-center bg-black/30">
                <Play className="h-10 w-10 fill-white text-white" />
              </span>
              {v.duration > 0 && (
                <span className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-[11px] font-semibold text-white">
                  {formatDuration(v.duration)}
                </span>
              )}
            </div>
            <div className="p-3">
              <div className="font-semibold">{v.title}</div>
              {v.description && <div className="mt-1 line-clamp-2 text-sm text-muted-foreground">{v.description}</div>}
            </div>
          </button>
        ))}
      </div>

      <VideoPlayerDialog video={playing} onClose={() => setPlaying(null)} />
    </div>
  );
}
