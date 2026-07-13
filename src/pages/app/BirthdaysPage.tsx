import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Cake, Bell } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { BirthdayAutomationDialog } from '@/components/contacts/BirthdayAutomationDialog';
import { fetchBirthdays } from '@/api/contacts';
import { fetchBirthdayAutomation } from '@/api/organization';
import type { Contact } from '@/api/contacts';
import { cn } from '@/lib/utils';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function formatDay(dateOfBirth: string) {
  return new Date(dateOfBirth).getUTCDate();
}

export function BirthdaysPage() {
  const birthdays = useQuery({ queryKey: ['contacts', 'birthdays'], queryFn: fetchBirthdays });
  const automation = useQuery({ queryKey: ['birthday-automation'], queryFn: fetchBirthdayAutomation });
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth());
  const [showAutomation, setShowAutomation] = useState(false);

  const months = useMemo(() => {
    const buckets: Contact[][] = Array.from({ length: 12 }, () => []);
    for (const contact of birthdays.data ?? []) {
      if (!contact.dateOfBirth) continue;
      const month = new Date(contact.dateOfBirth).getUTCMonth();
      buckets[month].push(contact);
    }
    return buckets.map((contacts) => [...contacts].sort((a, b) => formatDay(a.dateOfBirth!) - formatDay(b.dateOfBirth!)));
  }, [birthdays.data]);

  const selectedContacts = months[selectedMonth];

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <div className="text-[26px] font-bold">Birthdays</div>
          <div className="mt-0.5 text-sm text-muted-foreground">{birthdays.data?.length ?? 0} contacts with a birthday on file</div>
        </div>
        <Button variant="outline" onClick={() => setShowAutomation(true)}>
          <Bell className="h-[15px] w-[15px]" /> Birthday automation
          {automation.data && (
            <span
              className={cn(
                'ml-1 rounded-full px-2 py-0.5 text-[11px] font-bold',
                automation.data.enabled ? 'bg-success/15 text-success' : 'bg-muted text-muted-foreground'
              )}
            >
              {automation.data.enabled ? 'On' : 'Off'}
            </span>
          )}
        </Button>
      </div>

      <BirthdayAutomationDialog open={showAutomation} onOpenChange={setShowAutomation} />

      <div className="mb-4.5 grid grid-cols-12 gap-2">
        {MONTH_SHORT.map((label, month) => {
          const count = months[month].length;
          const isActive = month === selectedMonth;
          return (
            <button
              key={month}
              type="button"
              onClick={() => setSelectedMonth(month)}
              className={cn(
                'flex flex-col items-center gap-0.5 rounded-xl border px-2 py-2.5 text-center transition-colors',
                isActive ? 'border-primary bg-accent/40' : 'border-border bg-card hover:border-primary/40'
              )}
            >
              <span className={cn('text-sm font-bold', isActive ? 'text-foreground' : 'text-foreground/80')}>{label}</span>
              <span className="text-[11px] text-muted-foreground">{count}</span>
            </button>
          );
        })}
      </div>

      {birthdays.isLoading && (
        <div className="space-y-2.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[60px] rounded-xl" />
          ))}
        </div>
      )}

      {!birthdays.isLoading && (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="border-b border-border bg-secondary px-5 py-2.5 text-[13px] font-bold text-foreground/80">
            {MONTH_NAMES[selectedMonth]} · {selectedContacts.length} birthday{selectedContacts.length === 1 ? '' : 's'}
          </div>
          {selectedContacts.length === 0 && (
            <div className="flex flex-col items-center gap-3 p-10 text-center">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Cake className="h-5 w-5" />
              </div>
              <div className="text-sm text-muted-foreground">No birthdays in {MONTH_NAMES[selectedMonth]}.</div>
            </div>
          )}
          {selectedContacts.map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5 last:border-b-0">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
                  {formatDay(c.dateOfBirth!)}
                </div>
                <div className="text-sm font-semibold">{c.name}</div>
              </div>
              <div className="text-sm text-muted-foreground">{c.phone}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
