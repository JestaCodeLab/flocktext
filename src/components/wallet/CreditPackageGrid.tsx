import type { CreditPackage } from '@/api/wallet';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function CreditPackageGrid({
  packages,
  onBuy,
  buying,
  variant = 'default',
}: {
  packages: CreditPackage[];
  onBuy: (ghs: number) => void;
  buying: boolean;
  /** 'compact' fits a narrow container (e.g. the onboarding card) - 2 columns
   * and pill buttons instead of 'default's wide 4-column dashboard layout. */
  variant?: 'default' | 'compact';
}) {
  const compact = variant === 'compact';

  return (
    <div className={cn('grid grid-cols-2 gap-3.5', !compact && 'sm:grid-cols-4')}>
      {packages.map((p) => (
        <div key={p.ghs} className="relative rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary">
          {p.badge && (
            <div className="absolute -top-2.5 left-4 rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-bold text-primary-foreground">
              {p.badge}
            </div>
          )}
          <div className="mb-2.5 text-[13px] font-medium text-foreground/80">{p.label}</div>
          <div className="mb-1 text-2xl font-medium">GHS {p.ghs.toLocaleString()}</div>
          <div className="mb-3 text-sm font-bold text-success">{p.credits.toLocaleString()} credits</div>
          <div className="mb-4 text-xs text-muted-foreground">{p.perSms} / SMS</div>
          <Button
            className={cn('w-full bg-foreground text-background hover:bg-foreground/90', compact && 'h-11 rounded-full')}
            disabled={buying}
            onClick={() => onBuy(p.ghs)}
          >
            Buy package
          </Button>
        </div>
      ))}
    </div>
  );
}
