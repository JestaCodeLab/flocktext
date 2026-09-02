import { useEffect, useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  LayoutDashboard,
  Users,
  Contact,
  FolderKanban,
  Cake,
  LayoutTemplate,
  BarChart3,
  Wallet,
  Building2,
  Settings,
  History,
  Home,
  ChevronDown,
  Check,
  Plus,
  SendIcon,
  Sun,
  Moon,
  MoreHorizontal,
  LifeBuoy,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { fetchMe, logout } from '@/api/auth';
import { fetchAccounts, createAccount, switchAccount } from '@/api/memberships';
import { apiErrorMessage } from '@/api/client';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { useEntityLabels, type EntityLabels } from '@/lib/terminology';
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
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { NotificationsSheet } from '@/components/layout/NotificationsSheet';
import { SessionTimeoutModal } from '@/components/layout/SessionTimeoutModal';
import { WhatsAppSupportButton } from '@/components/layout/WhatsAppSupportButton';
import { PlatformFeatureAnnouncement } from '@/components/announcements/PlatformFeatureAnnouncement';
import { WhatsAppIcon } from '@/pages/marketing/components/WhatsAppIcon';
import { WHATSAPP_URL } from '@/pages/marketing/data/contact';
import type { LucideIcon } from 'lucide-react';
import type { Account } from '@/types';

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
  items.push({ to: '/app/support', label: 'Support', icon: LifeBuoy });
  items.push({ to: '/app/settings', label: 'Settings', icon: Settings });
  return items;
}

// The mobile bottom tab bar's plain (non-emphasized) tabs, flanking the
// raised Send SMS button. Everything else the sidebar can reach (Templates,
// SMS Credit, Settings, Activity Log, Contacts/Groups, Contacts/Birthdays)
// lives behind the bar's "More" tab instead of getting its own slot.
function getMobileTabItems(entity: EntityLabels): { to: string; label: string; icon: LucideIcon }[] {
  return [
    { to: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/app/contacts', label: entity.pluralCap, icon: Contact },
    { to: '/app/reports', label: 'Reports', icon: BarChart3 },
  ];
}

// Paths owned by a bottom-bar tab - anything else falls under "More", so that
// tab lights up whenever the current page can only be reached through it.
const MOBILE_TAB_PREFIXES = ['/app/dashboard', '/app/contacts', '/app/compose', '/app/reports'];

function navLinkClass(isActive: boolean) {
  return cn(
    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-normal transition-colors',
    isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground/65 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground'
  );
}

// How many accounts the profile dropdown lists before deferring the rest to
// Settings > Account.
const ACCOUNT_MENU_LIMIT = 5;

export function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const session = useAuthStore((s) => s.session);
  const clear = useAuthStore((s) => s.clear);
  const setSession = useAuthStore((s) => s.setSession);
  const updateUser = useAuthStore((s) => s.updateUser);
  const updateOrganization = useAuthStore((s) => s.updateOrganization);
  const updateMembership = useAuthStore((s) => s.updateMembership);
  const themeResolved = useThemeStore((s) => s.resolved);
  const setThemeMode = useThemeStore((s) => s.setMode);
  const [contactsManualOpen, setContactsManualOpen] = useState<boolean | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  // Switching swaps the whole app's data context and drops you on the
  // dashboard, so it's confirmed rather than fired straight from the menu -
  // a mis-click on a neighbouring row shouldn't silently move you accounts.
  const [pendingSwitch, setPendingSwitch] = useState<Account | null>(null);
  const entity = useEntityLabels();

  useEffect(() => {
    setContactsManualOpen(null);
  }, [location.pathname]);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  // The cached session (localStorage) can drift from the server - e.g. a role
  // change made by another admin, or a legacy role value from before a data
  // migration - so pull the authoritative copy once per app load.
  const { data: freshSession } = useQuery({ queryKey: ['me'], queryFn: fetchMe, staleTime: 0 });
  useEffect(() => {
    if (!freshSession) return;
    updateUser(freshSession.user);
    updateOrganization(freshSession.organization);
    updateMembership(freshSession.membership);
  }, [freshSession, updateUser, updateOrganization, updateMembership]);

  const accounts = useQuery({ queryKey: ['accounts'], queryFn: fetchAccounts });

  // The header switcher is for switching, not managing - past a handful of
  // accounts the menu grows taller than the viewport, so the rest live behind
  // a link into Settings > Account, which lists them all in full. Active
  // account sorted to the front so the cap can never hide the one the user is
  // currently in.
  const allAccounts = accounts.data ?? [];
  const visibleAccounts = [...allAccounts]
    .sort((a, b) => Number(b.isActive) - Number(a.isActive))
    .slice(0, ACCOUNT_MENU_LIMIT);
  const hiddenAccountCount = allAccounts.length - visibleAccounts.length;

  function switchToSession(nextSession: typeof session) {
    if (!nextSession) return;
    const { accessToken, refreshToken } = useAuthStore.getState();
    setSession(nextSession, accessToken ?? '', refreshToken ?? '');
    queryClient.clear();
    navigate('/app/dashboard', { replace: true });
  }

  const switchAccountMutation = useMutation({
    mutationFn: switchAccount,
    onSuccess: (nextSession) => {
      setPendingSwitch(null);
      switchToSession(nextSession);
    },
    onError: (err) => {
      setPendingSwitch(null);
      toast.error(apiErrorMessage(err));
    },
  });

  const createAccountMutation = useMutation({
    mutationFn: () => createAccount(),
    onSuccess: (nextSession) => {
      toast.success('New account created.');
      switchToSession(nextSession);
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  // A session cached in localStorage from before accounts/memberships shipped
  // only has {user, organization} - no membership key yet. Treat that as "not
  // ready" rather than crashing; the /api/auth/me refresh above will populate
  // it and this component re-renders once that lands.
  if (!session || !session.membership) return null;

  const mainNavItems = getMainNavItems(entity);
  const { user, organization, membership } = session;
  const bottomNavItems = getBottomNavItems(membership.role);
  const mobileTabItems = getMobileTabItems(entity);
  const isMoreTabActive = !MOBILE_TAB_PREFIXES.some((prefix) => location.pathname.startsWith(prefix));

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

  const navContent = (
    <>
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
    </>
  );

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <aside className="hidden w-[236px] shrink-0 flex-col overflow-y-auto border-r border-sidebar-border bg-sidebar p-3.5 text-sidebar-foreground md:flex">
        <Link to="/" className="mb-7 block px-2">
          <img src="/logo/flocktext-logo-white.png" alt="FlockText" className="h-8 w-auto" />
        </Link>
        {navContent}
      </aside>

      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent
          side="left"
          className="w-[236px] max-w-[80vw] flex-col gap-0 overflow-y-auto border-sidebar-border bg-sidebar p-3.5 text-sidebar-foreground"
        >
          <Link to="/" className="mb-7 block shrink-0 px-2">
            <img src="/logo/flocktext-logo-white.png" alt="FlockText" className="h-8 w-auto" />
          </Link>
          {navContent}
        </SheetContent>
      </Sheet>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="flex shrink-0 items-center justify-between gap-2 border-b border-border bg-card px-3 py-2.5 sm:gap-3.5 sm:px-5 sm:py-3.5 md:px-8">
          <div className="no-scrollbar flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto sm:gap-2.5">
            <DropdownMenu>
              <DropdownMenuTrigger className="flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-secondary px-3.5 py-1 text-sm font-medium whitespace-nowrap">
                <Building2 className="h-[15px] w-[15px] text-primary" />
                <span className="max-w-[110px] truncate sm:max-w-[180px]">
                  {organization.churchName || 'Untitled account'}
                </span>
                <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[260px] p-1.5">
                <div className="px-2.5 py-1 text-xs font-semibold text-muted-foreground">Switch account</div>
                {visibleAccounts.map((account) => (
                  <DropdownMenuItem
                    key={account.organizationId}
                    className="cursor-pointer gap-2.5 px-2.5 py-2 text-[13px]"
                    disabled={switchAccountMutation.isPending || account.isActive}
                    onClick={() => {
                      if (!account.isActive) setPendingSwitch(account);
                    }}
                  >
                    {account.isActive ? <Check className="h-4 w-4 shrink-0" /> : <span className="h-4 w-4 shrink-0" />}
                    <span className="truncate">{account.churchName || 'Untitled account'}</span>
                  </DropdownMenuItem>
                ))}
                {hiddenAccountCount > 0 && (
                  <DropdownMenuItem
                    className="cursor-pointer gap-2.5 px-2.5 py-2 text-[13px] text-muted-foreground"
                    onClick={() => navigate('/app/settings', { state: { tab: 'account' } })}
                  >
                    <span className="h-4 w-4 shrink-0" />
                    <span className="truncate">
                      View all {allAccounts.length} accounts ({hiddenAccountCount} more)
                    </span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator className="my-1.5" />
                <DropdownMenuItem
                  className="cursor-pointer gap-2.5 px-2.5 py-2 text-[13px]"
                  disabled={createAccountMutation.isPending}
                  onClick={() => createAccountMutation.mutate()}
                >
                  <Plus className="h-4 w-4 shrink-0" /> Add another account
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="hidden shrink-0 items-center gap-1.5 rounded-full border border-border bg-secondary px-3.5 py-1 text-sm font-medium whitespace-nowrap sm:flex">
              <Wallet className="h-[15px] w-[15px] text-primary" />
              {organization.walletBalanceCredits.toLocaleString()} credits
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5">
            <button
              type="button"
              onClick={() => setThemeMode(themeResolved === 'dark' ? 'light' : 'dark')}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground hover:text-foreground"
            >
              {themeResolved === 'dark' ? <Moon className="h-[15px] w-[15px]" /> : <Sun className="h-[15px] w-[15px]" />}
            </button>

            <NotificationsSheet />

            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 rounded-full border border-border py-1 pl-1 pr-2 sm:pr-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-background">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="hidden text-sm font-medium sm:inline">{user.name.split(' ')[0]}</span>
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
                      <Badge variant={membership.role === 'admin' ? 'default' : 'secondary'} className="shrink-0 text-white capitalize">
                        {membership.role}
                      </Badge>
                    </div>
                    <div className="mt-0.5 truncate text-xs text-muted-foreground">{organization.churchName}</div>
                  </div>
                </div>
                <DropdownMenuSeparator className="my-1.5" />
                <DropdownMenuItem className="cursor-pointer gap-2.5 px-2.5 py-2.5 text-[13px]" render={<Link to="/" />}>
                  <Home className="h-4 w-4" /> Go to Homepage
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer gap-2.5 px-2.5 py-2.5 text-[13px]" onClick={() => navigate('/app/settings')}>
                  <Settings className="h-4 w-4" /> Account
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer gap-2.5 px-2.5 py-2.5 text-[13px]"
                  render={<a href={WHATSAPP_URL} target="_blank" rel="noreferrer" />}
                >
                  <WhatsAppIcon className="h-4 w-4" /> Quick Support
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

        <Dialog
          open={!!pendingSwitch}
          onOpenChange={(next) => {
            if (!next && !switchAccountMutation.isPending) setPendingSwitch(null);
          }}
        >
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Switch to {pendingSwitch?.churchName || 'this account'}?</DialogTitle>
              <DialogDescription>
                FlockText will reload with {pendingSwitch?.churchName || 'that account'}'s contacts, messages, and wallet,
                and you'll land on its dashboard. Anything unsaved on this page will be lost.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                disabled={switchAccountMutation.isPending}
                onClick={() => setPendingSwitch(null)}
              >
                Stay here
              </Button>
              <Button
                disabled={switchAccountMutation.isPending}
                onClick={() => pendingSwitch && switchAccountMutation.mutate(pendingSwitch.organizationId)}
              >
                {switchAccountMutation.isPending ? 'Switching…' : 'Switch account'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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

        <main className="min-h-0 flex-1 overflow-y-auto px-4 py-5 pb-24 sm:px-6 sm:py-6 md:pb-6 lg:px-9 lg:py-7">
          <Outlet />
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 flex items-stretch border-t border-border bg-card pb-[env(safe-area-inset-bottom)] md:hidden">
        {mobileTabItems.slice(0, 2).map((item) => {
          const isActive = location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}

        <div className="flex flex-1 flex-col items-center justify-center">
          <Link
            to="/app/compose"
            className="-mt-5 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg ring-4 ring-background"
          >
            <SendIcon className="h-5 w-5" />
          </Link>
        </div>

        {mobileTabItems.slice(2).map((item) => {
          const isActive = location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}

        <button
          type="button"
          onClick={() => setMobileNavOpen(true)}
          className={cn(
            'flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium',
            isMoreTabActive ? 'text-primary' : 'text-muted-foreground'
          )}
        >
          <MoreHorizontal className="h-5 w-5" />
          More
        </button>
      </nav>

      <WhatsAppSupportButton />

      <SessionTimeoutModal />
      <PlatformFeatureAnnouncement />
    </div>
  );
}
