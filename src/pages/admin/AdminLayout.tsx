import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Building2, CreditCard, BadgeCheck, ChevronDown, ShieldCheck, Puzzle, Megaphone, Settings, Send, Receipt, LifeBuoy, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAdminAuthStore } from '@/store/adminAuthStore';
import { adminLogout } from '@/api/adminAuth';
import { AdminSessionTimeoutModal } from '@/components/admin/AdminSessionTimeoutModal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent } from '@/components/ui/sheet';

const navItems = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/organizations', label: 'Organizations', icon: Building2 },
  { to: '/admin/delivery-report', label: 'Delivery report', icon: Send },
  { to: '/admin/transactions', label: 'Transactions', icon: Receipt },
  { to: '/admin/packages', label: 'Packages', icon: CreditCard },
  { to: '/admin/sender-ids', label: 'Sender IDs', icon: BadgeCheck },
  { to: '/admin/addons', label: 'Addons', icon: Puzzle },
  { to: '/admin/announcements', label: 'Announcements', icon: Megaphone },
];

const bottomNavItems = [{ to: '/admin/tickets', label: 'Support Tickets', icon: LifeBuoy }];

function navLinkClass(isActive: boolean) {
  return cn(
    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors',
    isActive
      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
      : 'text-sidebar-foreground/65 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground'
  );
}

export function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const session = useAdminAuthStore((s) => s.session);
  const refreshToken = useAdminAuthStore((s) => s.refreshToken);
  const clear = useAdminAuthStore((s) => s.clear);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  if (!session) return null;

  async function handleLogout() {
    if (refreshToken) {
      try {
        await adminLogout(refreshToken);
      } catch {
        // best-effort - proceed with local logout regardless
      }
    }
    clear();
    navigate('/admin/login', { replace: true });
  }

  const navContent = (
    <>
      <nav className="flex flex-1 flex-col gap-0.5">
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} className={({ isActive }) => navLinkClass(isActive)}>
            <item.icon className="h-[17px] w-[17px]" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="flex flex-col gap-0.5 border-t border-sidebar-border pt-3.5">
        {bottomNavItems.map((item) => (
          <NavLink key={item.to} to={item.to} className={({ isActive }) => navLinkClass(isActive)}>
            <item.icon className="h-[17px] w-[17px]" />
            {item.label}
          </NavLink>
        ))}
      </div>
    </>
  );

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <aside className="hidden w-[236px] shrink-0 flex-col overflow-y-auto border-r border-sidebar-border bg-sidebar p-3.5 text-sidebar-foreground md:flex">
        <div className="mb-7 px-2">
          <img src="/logo/flocktext-logo-white.png" alt="FlockText" className="h-7 w-auto" />
          <div className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-sidebar-foreground/60">
            <ShieldCheck className="h-3.5 w-3.5" />
            Admin console
          </div>
        </div>
        {navContent}
      </aside>

      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent
          side="left"
          className="w-[236px] max-w-[80vw] flex-col gap-0 overflow-y-auto border-sidebar-border bg-sidebar p-3.5 text-sidebar-foreground"
        >
          <div className="mb-7 shrink-0 px-2">
            <img src="/logo/flocktext-logo-white.png" alt="FlockText" className="h-7 w-auto" />
            <div className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-sidebar-foreground/60">
              <ShieldCheck className="h-3.5 w-3.5" />
              Admin console
            </div>
          </div>
          {navContent}
        </SheetContent>
      </Sheet>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="flex shrink-0 items-center justify-between gap-2 border-b border-border bg-card px-3 py-2.5 sm:justify-end sm:gap-3.5 sm:px-5 sm:py-3.5 md:px-8">
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground hover:text-foreground md:hidden"
          >
            <Menu className="h-[18px] w-[18px]" />
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1.5 rounded-full border border-border py-1 pr-2.5 pl-1 sm:gap-2.5 sm:pr-3.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-foreground text-xs font-bold text-background">
                {session.admin.name.charAt(0).toUpperCase()}
              </div>
              <span className="hidden text-sm font-semibold sm:inline">{session.admin.name}</span>
              <ChevronDown className="hidden h-4 w-4 shrink-0 text-muted-foreground sm:inline" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2.5 py-2 sm:hidden">
                <div className="truncate text-sm font-semibold">{session.admin.name}</div>
                <div className="truncate text-xs text-muted-foreground">{session.admin.email}</div>
              </div>
              <DropdownMenuSeparator className="sm:hidden" />
              <DropdownMenuItem onClick={() => navigate('/admin/account')}>
                <Settings className="h-4 w-4" /> Account settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={handleLogout}>
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6 lg:px-9 lg:py-7">
          <Outlet />
        </main>
      </div>

      <AdminSessionTimeoutModal />
    </div>
  );
}
