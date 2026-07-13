import { Bell, BellOff } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

export function NotificationsSheet() {
  return (
    <Sheet>
      <SheetTrigger className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground hover:text-foreground">
        <Bell className="h-[15px] w-[15px]" />
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Notifications</SheetTitle>
        </SheetHeader>
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <BellOff className="h-5 w-5" />
          </div>
          <div className="text-sm text-muted-foreground">You're all caught up. Nothing new to show yet.</div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
