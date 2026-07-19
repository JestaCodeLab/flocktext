import {
  BarChart3,
  Cake,
  CircleCheck,
  FileText,
  MessageSquareText,
  Send,
  Users,
  Wallet,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { icon: BarChart3, label: 'Dashboard', active: true },
  { icon: Users, label: 'Contacts', active: false },
  { icon: MessageSquareText, label: 'Compose', active: false },
  { icon: FileText, label: 'Templates', active: false },
  { icon: Send, label: 'Reports', active: false },
  { icon: Wallet, label: 'Wallet', active: false },
];

const stats = [
  { icon: Users, label: 'Contacts', value: '1,248', chip: 'bg-chart-3/15 text-chart-3' },
  { icon: Send, label: 'Sent this month', value: '8,432', chip: 'bg-chart-2/15 text-chart-2' },
  { icon: CircleCheck, label: 'Delivery rate', value: '98.6%', chip: 'bg-chart-1/15 text-chart-1' },
];

const bars = [34, 52, 44, 70, 58, 82, 64, 90, 74, 60, 84, 96];

/** Decorative, non-interactive mock of the real FlockText dashboard shell. */
export function DashboardPreview({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none overflow-hidden rounded-2xl bg-card text-left shadow-2xl shadow-foreground/15 ring-1 ring-foreground/10 select-none',
        className
      )}
    >
      <div className="flex items-center gap-1.5 border-b border-border bg-secondary/60 px-4 py-2.5">
        <span className="size-2.5 rounded-full bg-destructive/40" />
        <span className="size-2.5 rounded-full bg-warning/40" />
        <span className="size-2.5 rounded-full bg-success/40" />
        <span className="ml-3 h-4 w-40 rounded-full bg-muted" />
      </div>

      <div className="flex">
        <div className="hidden w-36 shrink-0 flex-col gap-0.5 bg-sidebar p-2.5 sm:flex">
          <div className="mb-3 flex items-center gap-1.5 px-1.5">
            <span className="flex size-5 items-center justify-center rounded-md bg-primary text-[9px] font-extrabold text-white">
              F
            </span>
            <span className="text-[11px] font-extrabold text-sidebar-foreground">FlockText</span>
          </div>
          {navItems.map((item) => (
            <span
              key={item.label}
              className={cn(
                'flex items-center gap-2 rounded-md px-2 py-1.5 text-[10px] font-medium',
                item.active
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/60'
              )}
            >
              <item.icon className="size-3" />
              {item.label}
            </span>
          ))}
        </div>

        <div className="min-w-0 flex-1 p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-foreground">Dashboard</span>
            <span className="flex items-center gap-1 rounded-full border border-border bg-secondary px-2 py-0.5 text-[10px] font-bold text-foreground">
              <Wallet className="size-2.5 text-primary" />
              2,140 credits
            </span>
          </div>

          <div className="mb-3 grid grid-cols-3 gap-2">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-lg bg-background p-2 ring-1 ring-foreground/5">
                <span className={cn('mb-1.5 flex size-5 items-center justify-center rounded-md', stat.chip)}>
                  <stat.icon className="size-2.5" />
                </span>
                <div className="text-[11px] font-bold text-foreground">{stat.value}</div>
                <div className="text-[9px] text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="rounded-lg bg-background p-3 ring-1 ring-foreground/5">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10px] font-bold text-foreground">Messages sent</span>
              <span className="text-[9px] text-muted-foreground">Last 12 weeks</span>
            </div>
            <div className="flex h-16 items-end gap-1.5">
              {bars.map((height, i) => (
                <span
                  key={i}
                  className={cn('flex-1 rounded-sm', i === bars.length - 1 ? 'bg-primary' : 'bg-primary/25')}
                  style={{ height: `${height}%` }}
                />
              ))}
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2 rounded-lg bg-accent/60 p-2 ring-1 ring-foreground/5">
            <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-chart-1/20 text-chart-1">
              <Cake className="size-2.5" />
            </span>
            <span className="truncate text-[9px] text-accent-foreground">
              3 birthday messages scheduled for today — sending automatically at 9:00 AM
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
