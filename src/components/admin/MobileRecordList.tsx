import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

// Mobile counterpart to a data <Table>: renders the same rows as a stacked list
// of cards instead of a wide table, hidden at md:+ where the real table takes over.
export function MobileList({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('flex flex-col gap-2.5 md:hidden', className)}>{children}</div>;
}

export function MobileListCard({
  to,
  onClick,
  children,
  className,
}: {
  to?: string;
  onClick?: () => void;
  children: ReactNode;
  className?: string;
}) {
  const cardClass = cn('rounded-xl border border-border bg-card p-3.5', className);
  if (to) {
    return (
      <Link to={to} className={cn(cardClass, 'block')}>
        {children}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cn(cardClass, 'w-full text-left')}>
        {children}
      </button>
    );
  }
  return <div className={cardClass}>{children}</div>;
}

// A label/value line inside a card - the mobile equivalent of one table column.
export function MobileListRow({ label, value, className }: { label: ReactNode; value: ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-center justify-between gap-3 py-1 text-sm', className)}>
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="min-w-0 truncate text-right font-medium text-foreground">{value}</span>
    </div>
  );
}

export function MobileListEmpty({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground md:hidden">
      {children}
    </div>
  );
}
