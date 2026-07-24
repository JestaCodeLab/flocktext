import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { CalendarRange, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { rangeLabel, type DateRangeParams } from '@/lib/dateRange';

function CustomRangeDialog({
  open,
  onOpenChange,
  initialStart,
  initialEnd,
  onApply,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialStart?: string;
  initialEnd?: string;
  onApply: (startDate: string, endDate: string) => void;
}) {
  const [startDate, setStartDate] = useState(initialStart ?? '');
  const [endDate, setEndDate] = useState(initialEnd ?? '');

  useEffect(() => {
    if (open) {
      setStartDate(initialStart ?? '');
      setEndDate(initialEnd ?? '');
    }
  }, [open, initialStart, initialEnd]);

  function handleApply() {
    if (!startDate || !endDate) {
      toast.error('Choose a start and end date.');
      return;
    }
    if (startDate > endDate) {
      toast.error('Start date must be on or before the end date.');
      return;
    }
    onApply(startDate, endDate);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Custom date range</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="date-range-start">Start date</Label>
            <Input id="date-range-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="date-range-end">End date</Label>
            <Input id="date-range-end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleApply}>Apply</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Shared date-range dropdown filter (This week / This month / Last month / Custom range,
// plus an optional All time) used by the Dashboard, Contacts, and Delivery Reports pages.
export function DateRangeFilter({
  range,
  onChange,
  includeAllTime = false,
  size = 'default',
  className,
}: {
  range: DateRangeParams;
  onChange: (range: DateRangeParams) => void;
  includeAllTime?: boolean;
  size?: 'default' | 'sm';
  className?: string;
}) {
  const [showCustom, setShowCustom] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="outline" size={size} className={cn('bg-white', className)}>
              <CalendarRange className="h-[15px] w-[15px]" /> {rangeLabel(range)}
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          }
        />
        <DropdownMenuContent align="end" className="w-44">
          {includeAllTime && (
            <>
              <DropdownMenuItem onClick={() => onChange({ preset: 'all_time' })}>All time</DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem onClick={() => onChange({ preset: 'this_week' })}>This week</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onChange({ preset: 'last_week' })}>Last week</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onChange({ preset: 'this_month' })}>This month</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onChange({ preset: 'last_month' })}>Last month</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setShowCustom(true)}>Custom range…</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CustomRangeDialog
        open={showCustom}
        onOpenChange={setShowCustom}
        initialStart={range.startDate}
        initialEnd={range.endDate}
        onApply={(startDate, endDate) => onChange({ preset: 'custom', startDate, endDate })}
      />
    </>
  );
}
