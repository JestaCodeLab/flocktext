import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, BellOff, Wallet, CalendarClock, SendHorizonal, BadgeCheck, XCircle, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { fetchNotifications, markNotificationRead, markAllNotificationsRead, type NotificationType } from '@/api/notifications';

const NOTIFICATION_ICON: Record<NotificationType, typeof Bell> = {
  low_balance: Wallet,
  schedule_confirm: CalendarClock,
  delivery_summary: SendHorizonal,
  sender_id_approved: BadgeCheck,
  sender_id_rejected: XCircle,
  team_invite: UserPlus,
};

export function NotificationsSheet() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['notifications'], queryFn: fetchNotifications, refetchInterval: 30000 });

  const markRead = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllRead = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const notifications = query.data?.notifications ?? [];
  const unreadCount = query.data?.unreadCount ?? 0;

  return (
    <Sheet>
      <SheetTrigger className="relative flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground hover:text-foreground">
        <Bell className="h-[15px] w-[15px]" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </SheetTrigger>
      <SheetContent className="gap-0 p-0">
        <SheetHeader className="flex-row items-center justify-between space-y-0 border-b border-border px-5 py-4">
          <SheetTitle>Notifications</SheetTitle>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
              className="text-xs font-semibold text-primary hover:underline"
            >
              Mark all read
            </button>
          )}
        </SheetHeader>

        {notifications.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-5 text-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <BellOff className="h-5 w-5" />
            </div>
            <div className="text-sm text-muted-foreground">You're all caught up. Nothing new to show yet.</div>
          </div>
        ) : (
          <div className="flex-1 divide-y divide-border overflow-y-auto">
            {notifications.map((n) => {
              const Icon = NOTIFICATION_ICON[n.type] ?? Bell;
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => !n.read && markRead.mutate(n.id)}
                  className={cn('flex w-full items-start gap-3 px-5 py-3 text-left hover:bg-muted/50', !n.read && 'bg-primary/5')}
                >
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold">{n.title}</span>
                      {!n.read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">{n.message}</div>
                    <div className="mt-1 text-[11px] text-muted-foreground">
                      {new Date(n.date).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
