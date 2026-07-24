import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type StatCardAccent = 'blue' | 'violet' | 'green' | 'gold' | 'teal';

const ACCENT_CLASS: Record<StatCardAccent, string> = {
  blue: 'bg-chart-3/15 text-chart-3',
  violet: 'bg-chart-4/15 text-chart-4',
  green: 'bg-chart-2/15 text-chart-2',
  gold: 'bg-chart-1/15 text-chart-1',
  teal: 'bg-chart-5/15 text-chart-5',
};

export function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  tone = 'default',
  accent,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  sub?: string;
  tone?: 'default' | 'warning';
  accent?: StatCardAccent;
}) {
  const iconClass =
    tone === 'warning'
      ? 'bg-warning-foreground/15 text-warning-foreground'
      : accent
        ? ACCENT_CLASS[accent]
        : 'bg-accent text-accent-foreground';

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className={cn('mb-3 flex h-9 w-9 items-center justify-center rounded-lg', iconClass)}>
        <Icon className="h-[18px] w-[18px]" />
      </div>
      <div className="text-2xl font-extrabold">{value}</div>
      <div className="mt-0.5 text-[13px] text-muted-foreground">{label}</div>
      {sub && <div className="mt-0.5 text-[11px] text-muted-foreground/70">{sub}</div>}
    </div>
  );
}
