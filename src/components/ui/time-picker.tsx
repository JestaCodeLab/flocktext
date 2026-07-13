import * as React from 'react';
import { Popover } from '@base-ui/react/popover';
import { Clock, ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

function convertTo24Hour(hours12: number, isPM: boolean) {
  if (hours12 === 12) return isPM ? 12 : 0;
  return isPM ? hours12 + 12 : hours12;
}

function TimeColumn({
  label,
  value,
  min,
  max,
  onIncrement,
  onDecrement,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onIncrement: () => void;
  onDecrement: () => void;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex flex-col items-center">
      <button
        type="button"
        aria-label={`Increase ${label.toLowerCase()}`}
        onClick={onIncrement}
        className="mb-1 rounded-md p-1.5 text-foreground transition-colors hover:bg-primary/10 hover:text-primary"
      >
        <ChevronUp className="h-5 w-5" />
      </button>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={2}
        value={String(value).padStart(2, '0')}
        aria-label={label}
        onFocus={(e) => e.target.select()}
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, '');
          if (!digits) return;
          onChange(Math.min(Math.max(parseInt(digits, 10), min), max));
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowUp') {
            e.preventDefault();
            onIncrement();
          } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            onDecrement();
          }
        }}
        className="w-14 rounded-lg border-2 border-border bg-background py-1.5 text-center text-2xl font-bold text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
      />
      <button
        type="button"
        aria-label={`Decrease ${label.toLowerCase()}`}
        onClick={onDecrement}
        className="mt-1 rounded-md p-1.5 text-foreground transition-colors hover:bg-primary/10 hover:text-primary"
      >
        <ChevronDown className="h-5 w-5" />
      </button>
    </div>
  );
}

export function TimePicker({ value, onChange, placeholder = 'Select time' }: TimePickerProps) {
  const [open, setOpen] = React.useState(false);

  const [hours24, minutes] = value ? value.split(':').map(Number) : [9, 0];
  const isPM = hours24 >= 12;
  const hours12 = hours24 === 0 ? 12 : hours24 > 12 ? hours24 - 12 : hours24;

  function commitHour(newHours12: number) {
    onChange(`${String(convertTo24Hour(newHours12, isPM)).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`);
  }

  function commitMinute(newMinutes: number) {
    onChange(`${String(hours24).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`);
  }

  function setMeridiem(nextIsPM: boolean) {
    onChange(`${String(convertTo24Hour(hours12, nextIsPM)).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`);
  }

  const displayValue = value ? `${String(hours12).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${isPM ? 'PM' : 'AM'}` : '';

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        className={cn(
          'flex h-10 w-full min-w-0 items-center justify-between gap-2 rounded-lg border border-input bg-white px-3.5 text-sm text-foreground transition-colors outline-none',
          'hover:border-ring/50 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
          'data-popup-open:border-ring data-popup-open:ring-3 data-popup-open:ring-ring/50',
          'dark:bg-input/30 dark:hover:bg-input/50'
        )}
      >
        <span className={cn(!displayValue && 'text-muted-foreground')}>{displayValue || placeholder}</span>
        <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Positioner side="bottom" align="start" sideOffset={8} className="isolate z-50">
          <Popover.Popup
            className={cn(
              'origin-(--transform-origin) rounded-lg bg-popover p-5 text-popover-foreground shadow-md ring-1 ring-foreground/10 outline-none duration-100',
              'data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2',
              'data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95'
            )}
          >
            <div className="flex items-center justify-center gap-3">
              <TimeColumn
                label="Hour"
                value={hours12}
                min={1}
                max={12}
                onChange={commitHour}
                onIncrement={() => commitHour(hours12 === 12 ? 1 : hours12 + 1)}
                onDecrement={() => commitHour(hours12 === 1 ? 12 : hours12 - 1)}
              />
              <div className="pb-1 text-2xl font-bold text-muted-foreground">:</div>
              <TimeColumn
                label="Minute"
                value={minutes}
                min={0}
                max={59}
                onChange={commitMinute}
                onIncrement={() => commitMinute(minutes === 59 ? 0 : minutes + 1)}
                onDecrement={() => commitMinute(minutes === 0 ? 59 : minutes - 1)}
              />

              <div className="ml-1 flex flex-col gap-2">
                <button
                  type="button"
                  aria-pressed={!isPM}
                  onClick={() => setMeridiem(false)}
                  className={cn(
                    'rounded-lg border px-3 py-1.5 text-sm font-semibold transition-colors',
                    !isPM ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-background text-muted-foreground hover:text-foreground'
                  )}
                >
                  AM
                </button>
                <button
                  type="button"
                  aria-pressed={isPM}
                  onClick={() => setMeridiem(true)}
                  className={cn(
                    'rounded-lg border px-3 py-1.5 text-sm font-semibold transition-colors',
                    isPM ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-background text-muted-foreground hover:text-foreground'
                  )}
                >
                  PM
                </button>
              </div>
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
