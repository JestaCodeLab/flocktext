import { Info, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverTrigger, PopoverContent, PopoverClose } from '@/components/ui/popover';
import { STATUS_ORDER, STATUS_META } from '@/lib/messageStatus';
import { cn } from '@/lib/utils';

// Educates admins/orgs on what each delivery status means - the same five statuses
// (and colors) as StatusBadge/DeliveryBarChart, so this legend always matches what's
// actually shown in the table and chart next to it.
export function StatusInfoButton() {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button size="sm" variant="outline">
            <Info className="h-3.5 w-3.5" /> Status Information
          </Button>
        }
      />
      <PopoverContent align="start" className="w-[min(90vw,32rem)]">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="text-sm font-bold text-foreground">Status Information</div>
          <PopoverClose className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </PopoverClose>
        </div>
        <div className="grid grid-cols-1 gap-x-6 gap-y-3.5 sm:grid-cols-2">
          {STATUS_ORDER.map((status) => {
            const meta = STATUS_META[status];
            return (
              <div key={status}>
                <div className="flex items-center gap-2">
                  <span className={cn('inline-block h-2.5 w-2.5 shrink-0 rounded-full', meta.dotClassName)} />
                  <span className="text-[13px] font-semibold text-foreground">{meta.label}</span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{meta.description}</p>
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
