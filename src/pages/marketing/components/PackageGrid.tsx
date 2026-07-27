import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight } from 'lucide-react';
import { fetchPublicPackages } from '@/api/public';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

function PackageCardSkeleton() {
  return (
    <div className="flex flex-col rounded-2xl bg-card p-7 ring-1 ring-foreground/10">
      <Skeleton className="h-3.5 w-20" />
      <Skeleton className="mt-4 h-10 w-28" />
      <Skeleton className="mt-4 h-4 w-24" />
      <Skeleton className="mt-2 h-3 w-32" />
      <Skeleton className="mt-7 h-12 w-full rounded-full" />
    </div>
  );
}

/** SMS credit package cards, fetched from the public packages API — shared by the
 * homepage pricing teaser and the full /pricing page so they can't drift apart. */
export function PackageGrid() {
  const { data: packages, isLoading } = useQuery({
    queryKey: ['public', 'packages'],
    queryFn: fetchPublicPackages,
    staleTime: 60_000,
  });

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {isLoading
        ? Array.from({ length: 4 }, (_, i) => <PackageCardSkeleton key={i} />)
        : packages?.map((pkg) => {
            const perCredit = pkg.ghs / pkg.credits;
            const popular = pkg.badge === 'Most popular';
            return (
              <div
                key={pkg.label}
                className={cn(
                  'relative flex flex-col rounded-2xl p-7 transition-all',
                  popular
                    ? 'bg-sidebar text-sidebar-foreground shadow-xl shadow-foreground/10 ring-1 ring-sidebar-border lg:-translate-y-2'
                    : 'bg-card ring-1 ring-foreground/10 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-foreground/5'
                )}
              >
                {pkg.badge ? (
                  <span
                    className={cn(
                      'absolute -top-3 left-7 rounded-full px-3 py-1 text-xs font-bold',
                      popular
                        ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                        : 'bg-secondary text-secondary-foreground ring-1 ring-foreground/10'
                    )}
                  >
                    {pkg.badge}
                  </span>
                ) : null}

                <div className={cn('text-sm font-bold', popular ? 'text-sidebar-primary' : 'text-primary')}>
                  {pkg.label}
                </div>

                <div className="mt-3 flex items-baseline gap-1.5">
                  <span className="text-[40px] leading-none font-medium tracking-tight">
                    GHS {pkg.ghs.toLocaleString()}
                  </span>
                </div>

                <div className={cn('mt-3 text-sm', popular ? 'text-sidebar-foreground/70' : 'text-muted-foreground')}>
                  <span className={cn('font-semibold', popular ? 'text-sidebar-foreground' : 'text-foreground')}>
                    {pkg.credits.toLocaleString()}
                  </span>{' '}
                  SMS credits
                </div>
                <div className={cn('mt-1 text-xs', popular ? 'text-sidebar-foreground/50' : 'text-muted-foreground')}>
                  ≈ GHS {perCredit.toFixed(3)} per credit
                </div>

                <Button
                  size="lg"
                  className={cn(
                    'mt-7 h-12 w-full rounded-full text-base',
                    !popular && 'bg-foreground text-background hover:bg-foreground/85'
                  )}
                  render={<Link to="/signup" />}
                >
                  Get started
                  <ArrowRight data-icon="inline-end" className="size-4" />
                </Button>
              </div>
            );
          })}
    </div>
  );
}
