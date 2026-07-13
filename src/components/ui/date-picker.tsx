import React from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function DatePicker({ value, onChange, placeholder = 'Select date' }: DatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [displayMonth, setDisplayMonth] = React.useState(new Date(value || Date.now()));
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedDate = value ? new Date(value) : null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const daysInMonth = new Date(displayMonth.getFullYear(), displayMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(displayMonth.getFullYear(), displayMonth.getMonth(), 1).getDay();
  const days: (number | null)[] = Array(firstDayOfMonth).fill(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const monthName = displayMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

  function handlePrevMonth() {
    setDisplayMonth(new Date(displayMonth.getFullYear(), displayMonth.getMonth() - 1));
  }

  function handleNextMonth() {
    setDisplayMonth(new Date(displayMonth.getFullYear(), displayMonth.getMonth() + 1));
  }

  function handleSelectDate(day: number) {
    const newDate = new Date(displayMonth.getFullYear(), displayMonth.getMonth(), day);
    const isoString = newDate.toISOString().split('T')[0];
    onChange(isoString);
    setIsOpen(false);
  }

  const displayValue = selectedDate
    ? selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '';

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex h-10 w-full min-w-0 items-center justify-between gap-2 rounded-lg border border-input bg-white px-3.5 text-sm text-foreground transition-colors outline-none',
          'hover:border-ring/50 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
          isOpen && 'border-ring ring-3 ring-ring/50',
          'dark:bg-input/30 dark:hover:bg-input/50'
        )}
      >
        <span className={cn(!displayValue && 'text-muted-foreground')}>{displayValue || placeholder}</span>
        <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-80 rounded-lg border border-border bg-card shadow-lg p-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold">{monthName}</h3>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1 hover:bg-background rounded transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1 hover:bg-background rounded transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mb-2 grid grid-cols-7 gap-1 text-xs font-medium text-muted-foreground text-center">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {days.map((day, idx) =>
              day === null ? (
                <div key={`empty-${idx}`} />
              ) : (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleSelectDate(day)}
                  className={cn(
                    'h-8 rounded text-sm font-medium transition-colors',
                    selectedDate?.getDate() === day && selectedDate?.getMonth() === displayMonth.getMonth()
                      ? 'bg-primary text-white'
                      : 'hover:bg-background text-foreground'
                  )}
                >
                  {day}
                </button>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}
