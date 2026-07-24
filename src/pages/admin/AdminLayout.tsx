import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Building2, CreditCard, BadgeCheck, ChevronDown, ShieldCheck, Puzzle, Megaphone, Settings } from 'lucide-react';
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

const navItems = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/organizations', label: 'Organizations', icon: Building2 },
  { to: '/admin/packages', label: 'Packages', icon: CreditCard },
  { to: '/admin/sender-ids', label: 'Sender IDs', icon: BadgeCheck },
  { to: '/admin/addons', label: 'Addons', icon: Puzzle },
  { to: '/admin/announcements', label: 'Announcements', icon: Megaphone },
];

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
  const session = useAdminAuthStore((s) => s.session);
  const refreshToken = useAdminAuthStore((s) => s.refreshToken);
  const clear = useAdminAuthStore((s) => s.clear);

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

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <aside className="flex w-[236px] shrink-0 flex-col overflow-y-auto border-r border-sidebar-border bg-sidebar p-3.5 text-sidebar-foreground">
        <div className="mb-7 px-2">
          <img src="/logo/flocktext-logo-white.png" alt="FlockText" className="h-7 w-auto" />
          <div className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-sidebar-foreground/60">
            <ShieldCheck className="h-3.5 w-3.5" />
            Admin console
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-0.5">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => navLinkClass(isActive)}>
              <item.icon className="h-[17px] w-[17px]" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2.5 rounded-lg border-t border-sidebar-border px-2 pt-3.5 text-left hover:bg-sidebar-accent/60">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sidebar-foreground text-xs font-bold text-sidebar">
              {session.admin.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-semibold">{session.admin.name}</div>
              <div className="truncate text-[11px] text-sidebar-foreground/60">{session.admin.email}</div>
            </div>
            <ChevronDown className="h-4 w-4 shrink-0 text-sidebar-foreground/60" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="top" className="w-56">
            <DropdownMenuItem onClick={() => navigate('/admin/account')}>
              <Settings className="h-4 w-4" /> Account settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={handleLogout}>
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="flex shrink-0 items-center justify-end gap-3.5 border-b border-border bg-card px-8 py-3.5">
          <div className="flex items-center gap-2.5 rounded-full border border-border py-1 pl-1 pr-3.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-foreground text-xs font-bold text-background">
              {session.admin.name.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-semibold">{session.admin.name}</span>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto px-9 py-7">
          <Outlet />
        </main>
      </div>

      <AdminSessionTimeoutModal />
    </div>
  );
}
