import { Fragment } from 'react';
import { Check, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface OrgProgressStep {
  key: string;
  label: string;
  icon: LucideIcon;
  completedAt: string | null;
}

function formatStamp(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

// A horizontal milestone tracker for the four checkpoints of an org actually
// putting the product to use - registration alone doesn't mean much, this shows
// how far past it they got. Purely derived from existing timestamps (org.createdAt,
// onboarding.completedAt, the earliest senderIds entry, the earliest non-admin
// sent Message) - no separate event-log model to maintain.
export function OrgProgressTimeline({ steps }: { steps: OrgProgressStep[] }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 pt-6">
      {/* <div className="mb-5 text-[13px] font-bold text-foreground/80">Organization progress</div> */}
      <div className="no-scrollbar overflow-x-auto">
        <div className="flex items-start">
          {steps.map((step, i) => {
            const done = Boolean(step.completedAt);
            const lineActive = done && i < steps.length - 1;
            return (
              <Fragment key={step.key}>
                <div className="flex w-20 shrink-0 flex-col items-center text-center sm:w-32">
                  <span
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-4 transition-colors',
                      done ? 'bg-primary text-white ring-primary/15' : 'bg-muted text-muted-foreground ring-transparent'
                    )}
                  >
                    {done ? <Check className="h-4 w-4" /> : <step.icon className="h-[18px] w-[18px]" />}
                  </span>
                  <div className={cn('mt-2.5 text-[13px] font-semibold', done ? 'text-foreground' : 'text-muted-foreground')}>
                    {step.label}
                  </div>
                  <div className={cn('mt-0.5 text-xs', done ? 'text-grey' : 'text-muted-foreground/70')}>
                    {step.completedAt ? formatStamp(step.completedAt) : 'Not yet'}
                  </div>
                </div>
                {i < steps.length - 1 && (
                  <div
                    className={cn(
                      'mt-5 h-0.5 w-8 shrink-0 rounded-full transition-colors sm:w-auto sm:flex-1',
                      lineActive ? 'bg-primary/40' : 'bg-border'
                    )}
                  />
                )}
              </Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
