import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Contact,
  FolderKanban,
  Cake,
  LayoutTemplate,
  BarChart3,
  Wallet,
  BadgeCheck,
  Settings,
  History,
  KeyRound,
  ChevronDown,
  SendIcon,
  Sun,
  Moon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { fetchMe, logout } from '@/api/auth';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { useEntityLabels, type EntityLabels } from '@/lib/terminology';
import { senderIdStatusLabel } from '@/lib/senderIdStatus';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { NotificationsSheet } from '@/components/layout/NotificationsSheet';
import { SessionTimeoutModal } from '@/components/layout/SessionTimeoutModal';
import type { LucideIcon } from 'lucide-react';

type NavItem =
  | { to: string; label: string; icon: LucideIcon }
  | { label: string; icon: LucideIcon; children: { to: string; label: string; icon: LucideIcon }[] };

function getMainNavItems(entity: EntityLabels): NavItem[] {
  return [
    { to: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    {
      label: entity.pluralCap,
      icon: Users,
      children: [
        { to: '/app/contacts', label: `All ${entity.pluralCap}`, icon: Contact },
        { to: '/app/contacts/groups', label: 'Groups', icon: FolderKanban },
        { to: '/app/contacts/birthdays', label: 'Birthdays', icon: Cake },
      ],
    },
    { to: '/app/compose', label: 'Send SMS', icon: SendIcon },
    { to: '/app/templates', label: 'Templates', icon: LayoutTemplate },
    { to: '/app/wallet', label: 'SMS Credit', icon: Wallet },
    { to: '/app/reports', label: 'Delivery Reports', icon: BarChart3 },
  ];
}

function getBottomNavItems(role: string | undefined): { to: string; label: string; icon: LucideIcon }[] {
  const items: { to: string; label: string; icon: LucideIcon }[] = [];
  if (role === 'admin') items.push({ to: '/app/activity-log', label: 'Activity Log', icon: History });
  items.push({ to: '/app/settings', label: 'Settings', icon: Settings });
  return items;
}

function navLinkClass(isActive: boolean) {
  return cn(
    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-normal transition-colors',
    isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground/65 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground'
  );
}

export function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const session = useAuthStore((s) => s.session);
  const clear = useAuthStore((s) => s.clear);
  const updateUser = useAuthStore((s) => s.updateUser);
  const updateOrganization = useAuthStore((s) => s.updateOrganization);
  const themeResolved = useThemeStore((s) => s.resolved);
  const setThemeMode = useThemeStore((s) => s.setMode);
  const [contactsManualOpen, setContactsManualOpen] = useState<boolean | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const entity = useEntityLabels();

  useEffect(() => {
    setContactsManualOpen(null);
  }, [location.pathname]);

  // The cached session (localStorage) can drift from the server - e.g. a role
  // change made by another admin, or a legacy role value from before a data
  // migration - so pull the authoritative copy once per app load.
  const { data: freshSession } = useQuery({ queryKey: ['me'], queryFn: fetchMe, staleTime: 0 });
  useEffect(() => {
    if (!freshSession) return;
    updateUser(freshSession.user);
    updateOrganization(freshSession.organization);
  }, [freshSession, updateUser, updateOrganization]);

  if (!session) return null;

  const mainNavItems = getMainNavItems(entity);
  const { user, organization } = session;
  const bottomNavItems = getBottomNavItems(user.role);
  const senderId = organization.senderIds.find((s) => s.isPrimary) ?? organization.senderIds[0];
  const senderStatusColor: Record<string, string> = {
    approved: 'bg-success/15 text-success',
    rejected: 'bg-destructive/15 text-destructive',
    pending_review: 'bg-warning/15 text-warning',
    pending_bms: 'bg-warning/15 text-warning',
  };

  async function handleLogout() {
    const { refreshToken } = useAuthStore.getState();
    if (refreshToken) {
      try {
        await logout(refreshToken);
      } catch {
        // best-effort - proceed with local logout regardless
      }
    }
    clear();
    navigate('/login', { replace: true });
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <aside className="flex w-[236px] shrink-0 flex-col overflow-y-auto border-r border-sidebar-border bg-sidebar p-3.5 text-sidebar-foreground">
        <div className="mb-7 px-2">
          <img src="/logo/flocktext-logo-white.png" alt="FlockText" className="h-8 w-auto" />
        </div>

        <nav className="flex flex-1 flex-col gap-0.5">
          {mainNavItems.map((item) => {
            if ('children' in item) {
              const routeOpen = location.pathname.startsWith('/app/contacts');
              const isOpen = contactsManualOpen ?? routeOpen;
              return (
                <Collapsible key={item.label} open={isOpen} onOpenChange={(open) => setContactsManualOpen(open)}>
                  <CollapsibleTrigger className={navLinkClass(isOpen)}>
                    <span className="flex items-center gap-3">
                      <item.icon className="h-[15px] w-[15px]" />
                      {item.label}
                    </span>
                    <ChevronDown className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')} />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="flex flex-col gap-0.5 pt-0.5">
                      {item.children.map((child) => (
                        <NavLink
                          key={child.to}
                          to={child.to}
                          end
                          className={({ isActive }) => cn(navLinkClass(isActive), 'pl-8 text-[13px]')}
                        >
                          <child.icon className="h-4 w-4" />
                          {child.label}
                        </NavLink>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            }
            return (
              <NavLink key={item.to} to={item.to} className={({ isActive }) => navLinkClass(isActive)}>
                <item.icon className="h-[15px] w-[15px]" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="flex flex-col gap-1 border-t border-sidebar-border pt-3.5">
          {bottomNavItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => navLinkClass(isActive)}>
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </div>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="flex shrink-0 items-center justify-between gap-3.5 border-b border-border bg-card px-8 py-3.5">
          <div className="flex items-center gap-2.5">
            {senderId ? (
              <div className={cn('flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold', senderStatusColor[senderId.status])}>
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                {senderId.senderId} · {senderIdStatusLabel[senderId.status]}
              </div>
            ) : (
              <Link
                to="/app/settings"
                state={{ tab: 'sender-ids' }}
                className="flex items-center gap-1.5 rounded-full border border-dashed border-border px-3 py-1.5 text-xs font-bold text-muted-foreground hover:text-foreground"
              >
                <BadgeCheck className="h-3.5 w-3.5" /> No Sender ID
              </Link>
            )}

            <div className="flex items-center gap-1.5 rounded-full border border-border bg-secondary px-3.5 py-1 text-sm font-bold">
              <Wallet className="h-[15px] w-[15px] text-primary" />
              {organization.walletBalanceCredits.toLocaleString()} Credits
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setThemeMode(themeResolved === 'dark' ? 'light' : 'dark')}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground hover:text-foreground"
            >
              {themeResolved === 'dark' ? <Moon className="h-[15px] w-[15px]" /> : <Sun className="h-[15px] w-[15px]" />}
            </button>

            <NotificationsSheet />

            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 rounded-full border border-border py-1 pl-1 pr-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-background">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium">{user.name.split(' ')[0]}</span>
                <ChevronDown className="h-[15px] w-[15px] text-muted-foreground" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 p-2">
                <div className="flex items-center gap-3 px-2 py-2.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-background">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <div className="truncate text-sm font-medium">{user.name}</div>
                      <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="shrink-0 text-white capitalize">
                        {user.role}
                      </Badge>
                    </div>
                    <div className="mt-0.5 truncate text-xs text-muted-foreground">{organization.churchName}</div>
                  </div>
                </div>
                <DropdownMenuSeparator className="my-1.5" />
                <DropdownMenuItem className="cursor-pointer gap-2.5 px-2.5 py-2.5 text-[13px]" onClick={() => navigate('/app/settings')}>
                  <Settings className="h-4 w-4" /> Account
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer gap-2.5 px-2.5 py-2.5 text-[13px]"
                  onClick={() => navigate('/app/settings', { state: { tab: 'security' } })}
                >
                  <KeyRound className="h-4 w-4" /> Change Password
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-1.5" />
                <DropdownMenuItem
                  className="cursor-pointer gap-2.5 px-2.5 py-2.5 text-[13px]"
                  variant="destructive"
                  onClick={() => setShowLogoutConfirm(true)}
                >
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <Dialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Log out?</DialogTitle>
              <DialogDescription>Are you sure you want to log out of FlockText? </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowLogoutConfirm(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  setShowLogoutConfirm(false);
                  handleLogout();
                }}
              >
                Log out
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <main className="min-h-0 flex-1 overflow-y-auto px-9 py-7">
          <Outlet />
        </main>
      </div>

      <SessionTimeoutModal />
    </div>
  );
}
