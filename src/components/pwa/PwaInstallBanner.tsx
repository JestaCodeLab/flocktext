import { Download, Share, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePwaInstall } from '@/hooks/usePwaInstall';

export function PwaInstallBanner() {
  const { canShow, canPrompt, install, dismiss } = usePwaInstall();
  if (!canShow) return null;

  return (
    <div className="mb-4 flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4">
      <img src="/favicon/android-chrome-192x192.png" alt="" className="h-10 w-10 shrink-0 rounded-xl" />
      <div className="min-w-0 flex-1">
        <div className="text-[14px] font-bold">Install the FlockText app</div>
        <div className="text-[13px] text-muted-foreground">
          {canPrompt ? (
            'Get one-tap access from your home screen or desktop.'
          ) : (
            <>
              Tap <Share className="mx-0.5 inline h-3.5 w-3.5 -translate-y-px" /> then &ldquo;Add to Home Screen&rdquo;.
            </>
          )}
        </div>
      </div>
      {canPrompt && (
        <Button className="text-white" onClick={install}>
          <Download className="h-[15px] w-[15px]" /> Install
        </Button>
      )}
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
