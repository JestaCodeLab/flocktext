import type { LucideIcon } from 'lucide-react';

export function StatCard({
  icon: Icon,
  label,
  value,
  tone = 'default',
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  tone?: 'default' | 'warning';
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div
        className={
          tone === 'warning'
            ? 'mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-warning-foreground/15 text-warning-foreground'
            : 'mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-accent-foreground'
        }
      >
        <Icon className="h-[18px] w-[18px]" />
      </div>
      <div className="text-2xl font-extrabold">{value}</div>
      <div className="mt-0.5 text-[13px] text-muted-foreground">{label}</div>
    </div>
  );
}
