import { Fragment } from 'react';
import { Check, Flag, Send, Zap, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MessageDetail } from '@/api/messages';

interface Milestone {
  key: string;
  icon: LucideIcon;
  label: string;
  done: boolean;
  at: string | null;
  sub: string;
}

function formatStamp(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function earliest<T extends { at: string }>(items: T[]) {
  return items.reduce((a, b) => (new Date(a.at) < new Date(b.at) ? a : b));
}

// Milestones for the whole message, purely derived from existing recipient timestamps
// (escalatedAt, updatedAt, deliveredAt) - no separate event-log model to maintain, same
// approach OrgProgressTimeline.tsx already uses for org-level progress. "Escalated" only
// appears if services/deliveryEscalation.js actually touched this message. The terminal
// step always renders (unlike Escalated) - "Delivered" once resolved, or a not-yet
// "Pending" placeholder while it's still in flight, so the timeline never reads as just
// a single dangling "Sent" step.
function computeMilestones(detail: MessageDetail): Milestone[] {
  const milestones: Milestone[] = [
    {
      key: 'sent',
      icon: Send,
      label: 'Sent',
      done: true,
      at: detail.date,
      sub: `${detail.stats.total} recipient${detail.stats.total === 1 ? '' : 's'}`,
    },
  ];

  const escalated = detail.recipients.filter((r) => r.escalatedAt).map((r) => ({ at: r.escalatedAt! }));
  if (escalated.length) {
    milestones.push({
      key: 'escalated',
      icon: Zap,
      label: 'Escalated to Hubtel',
      done: true,
      at: earliest(escalated).at,
      sub: `${escalated.length} resent via backup`,
    });
  }

  const isResolved = detail.stats.total > 0 && detail.stats.pending === 0;
  if (isResolved) {
    const resolvedTimes = detail.recipients
      .map((r) => r.updatedAt || r.deliveredAt)
      .filter((t): t is string => Boolean(t))
      .map((at) => ({ at }));
    milestones.push({
      key: 'terminal',
      icon: Flag,
      label: 'Delivered',
      done: true,
      at: resolvedTimes.length ? resolvedTimes.reduce((a, b) => (new Date(a.at) > new Date(b.at) ? a : b)).at : detail.date,
      sub: `${detail.stats.delivered} delivered, ${detail.stats.failed} failed`,
    });
  } else {
    milestones.push({
      key: 'terminal',
      icon: Flag,
      label: 'Delivered',
      done: false,
      at: null,
      sub: `${detail.stats.pending} pending`,
    });
  }

  return milestones;
}

export function DeliveryTimeline({ detail }: { detail: MessageDetail }) {
  const milestones = computeMilestones(detail);

  return (
    <div className="mb-5 rounded-xl border border-border bg-card p-4">
      <div className="mb-4 text-[13px] font-bold text-foreground/80">Delivery timeline</div>
      <div className="flex flex-wrap items-center gap-x-1 gap-y-3">
        {milestones.map((m, i) => (
          <Fragment key={m.key}>
            <div className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-3">
              <span
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors',
                  m.done ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                )}
              >
                {m.done ? <Check className="h-4 w-4" /> : <m.icon className="h-[15px] w-[15px]" />}
              </span>
              <div className="leading-tight">
                <div className={cn('text-[13px] font-semibold', m.done ? 'text-foreground' : 'text-muted-foreground')}>{m.label}</div>
                <div className="text-xs text-muted-foreground">
                  {m.at ? formatStamp(m.at) : 'Not yet'} <span className="text-muted-foreground/60">·</span> {m.sub}
                </div>
              </div>
            </div>
            {i < milestones.length - 1 && (
              <div className={cn('h-0.5 w-6 shrink-0 rounded-full sm:w-10', m.done ? 'bg-primary/40' : 'bg-border')} />
            )}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
