import { useEffect, useMemo, useState } from 'react';
import type { CreditPackage } from '@/api/wallet';
import { Button } from '@/components/ui/button';

/** Same visual pattern as the marketing site's CreditCalculator (drag to see
 * "you spend / you get"), but for an authenticated buyer: the slider snaps to
 * real package price points (index-based, not interpolated) so the Buy button
 * always maps to an exact package the backend can charge, and it triggers a
 * real purchase instead of linking to /signup. */
export function CreditSlider({
  packages,
  onBuy,
  buying,
}: {
  packages: CreditPackage[];
  onBuy: (ghs: number) => void;
  buying: boolean;
}) {
  const sorted = useMemo(() => [...packages].sort((a, b) => a.ghs - b.ghs), [packages]);
  const [index, setIndex] = useState<number | null>(null);

  // Defaults to the "Most popular" package once packages load - only runs
  // while index is still unset, so it never clobbers the user's own drag.
  useEffect(() => {
    if (index !== null || sorted.length === 0) return;
    const popularIndex = sorted.findIndex((p) => p.badge === 'Most popular');
    setIndex(popularIndex >= 0 ? popularIndex : Math.floor(sorted.length / 2));
  }, [sorted, index]);

  if (sorted.length === 0 || index === null) return null;

  const selected = sorted[index];
  const rate = selected.ghs / selected.credits;

  return (
    <div className="w-full rounded-2xl bg-card p-5 ring-1 ring-border sm:p-7">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <span className="text-sm font-medium text-muted-foreground">You spend</span>
        <span className="text-2xl font-bold tracking-tight text-foreground">GHS {selected.ghs.toLocaleString()}</span>
      </div>
      <input
        type="range"
        min={0}
        max={sorted.length - 1}
        step={1}
        value={index}
        onChange={(e) => setIndex(Number(e.target.value))}
        aria-label="SMS credit package"
        className="mt-2 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-secondary accent-primary"
      />
      <div className="mt-1.5 flex justify-between text-xs text-muted-foreground">
        <span>GHS {sorted[0].ghs.toLocaleString()}</span>
        <span>GHS {sorted[sorted.length - 1].ghs.toLocaleString()}</span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2.5">
        <div className="min-w-0 rounded-xl bg-background p-3.5">
          <div className="text-xs text-muted-foreground">You get</div>
          <div className="mt-1 truncate text-lg font-bold text-foreground">{selected.credits.toLocaleString()} credits</div>
        </div>
        <div className="min-w-0 rounded-xl bg-background p-3.5">
          <div className="text-xs text-muted-foreground">Rate per credit</div>
          <div className="mt-1 truncate text-lg font-bold text-foreground">GHS {rate.toFixed(3)}</div>
        </div>
      </div>

      <Button
        size="lg"
        className="mt-5 h-12 w-full rounded-full bg-foreground text-base text-background hover:bg-foreground/85"
        disabled={buying}
        onClick={() => onBuy(selected.ghs)}
      >
        {buying ? 'Redirecting…' : `Buy ${selected.label}`}
      </Button>
    </div>
  );
}
