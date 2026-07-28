import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight } from 'lucide-react';
import { fetchPublicPackages } from '@/api/public';
import { Button } from '@/components/ui/button';

// Piecewise-linear interpolation between real package price points, clamped to
// the cheapest/priciest tier at the ends - same shape as a lookup-table
// calculator, but driven by whatever packages actually exist instead of a
// hardcoded curve that could disagree with real pricing.
function interpolateCredits(points: [number, number][], amount: number) {
  for (let i = 0; i < points.length - 1; i++) {
    const [a1, c1] = points[i];
    const [a2, c2] = points[i + 1];
    if (amount >= a1 && amount <= a2) {
      const t = (amount - a1) / (a2 - a1);
      return c1 + t * (c2 - c1);
    }
  }
  return amount <= points[0][0] ? points[0][1] : points[points.length - 1][1];
}

/** Interactive "how many credits would I get" slider. Interpolates between the
 * real packages fetched below, so it can never show a rate that disagrees with
 * PackageGrid (and checkout) - and stays correct if an admin edits pricing.
 * Shares PackageGrid's query cache (same key), so mounting both on this page
 * costs one network request, not two. */
export function CreditCalculator() {
  const { data: packages } = useQuery({
    queryKey: ['public', 'packages'],
    queryFn: fetchPublicPackages,
    staleTime: 60_000,
  });

  const points = useMemo<[number, number][]>(
    () => (packages ?? []).map((p) => [p.ghs, p.credits] as [number, number]).sort((a, b) => a[0] - b[0]),
    [packages]
  );

  const [amount, setAmount] = useState<number | null>(null);

  // Defaults to the "Most popular" package once packages load - only runs
  // while amount is still unset, so it never clobbers the user's own drag.
  useEffect(() => {
    if (amount !== null || points.length < 2) return;
    const popular = packages?.find((p) => p.badge === 'Most popular');
    setAmount(popular?.ghs ?? points[Math.floor(points.length / 2)][0]);
  }, [points, packages, amount]);

  // Fewer than two price points can't be interpolated between - hide rather
  // than show a broken/flat slider.
  if (points.length < 2 || amount === null) return null;

  const min = points[0][0];
  const max = points[points.length - 1][0];
  const credits = Math.round(interpolateCredits(points, amount));
  const rate = amount / credits;

  return (
    <div className="mx-auto w-full max-w-xl rounded-2xl bg-card p-5 ring-1 ring-foreground/10 sm:p-7">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <span className="text-sm font-medium text-muted-foreground">You spend</span>
        <span className="text-2xl font-bold tracking-tight text-foreground">GHS {amount.toLocaleString()}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={10}
        value={amount}
        onChange={(e) => setAmount(Number(e.target.value))}
        aria-label="SMS credit amount in GHS"
        className="mt-2 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-secondary accent-primary"
      />
      <div className="mt-1.5 flex justify-between text-xs text-muted-foreground">
        <span>GHS {min.toLocaleString()}</span>
        <span>GHS {max.toLocaleString()}</span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2.5">
        <div className="min-w-0 rounded-xl bg-background p-3.5">
          <div className="text-xs text-muted-foreground">You get</div>
          <div className="mt-1 truncate text-lg font-bold text-foreground">{credits.toLocaleString()} credits</div>
        </div>
        <div className="min-w-0 rounded-xl bg-background p-3.5">
          <div className="text-xs text-muted-foreground">Rate per credit</div>
          <div className="mt-1 truncate text-lg font-bold text-foreground">GHS {rate.toFixed(3)}</div>
        </div>
      </div>

      <Button
        size="lg"
        className="mt-5 h-12 w-full rounded-full bg-foreground text-base text-background hover:bg-foreground/85"
        render={<Link to="/signup" />}
      >
        Get started
        <ArrowRight data-icon="inline-end" className="size-4" />
      </Button>
    </div>
  );
}
