import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

export type Tint = 'primary' | 'blue' | 'violet' | 'gold' | 'teal' | 'green' | 'neutral';

const TINT_CLASS: Record<Tint, string> = {
  primary: 'bg-primary/15 text-primary',
  blue: 'bg-chart-3/15 text-chart-3',
  violet: 'bg-chart-4/15 text-chart-4',
  gold: 'bg-chart-1/15 text-chart-1',
  teal: 'bg-chart-5/15 text-chart-5',
  green: 'bg-chart-2/15 text-chart-2',
  neutral: 'bg-muted text-muted-foreground',
};

export function SettingsCard({
  icon: Icon,
  title,
  description,
  action,
  tint = 'primary',
  className,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  tint?: Tint;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn('rounded-2xl border border-border bg-card p-6', className)}>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', TINT_CLASS[tint])}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[16px] font-bold">{title}</div>
            <div className="mt-0.5 text-[13px] text-muted-foreground">{description}</div>
          </div>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}
