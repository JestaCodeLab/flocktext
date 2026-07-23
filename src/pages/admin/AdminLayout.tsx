import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Building2, CreditCard, BadgeCheck, ChevronDown, ShieldCheck, Puzzle, Megaphone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAdminAuthStore } from '@/store/adminAuthStore';
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
    isActive ? 'bg-accent text-accent-foreground' : 'text-foreground/80 hover:bg-secondary'
  );
}

export function AdminLayout() {
  const navigate = useNavigate();
  const session = useAdminAuthStore((s) => s.session);
  const clear = useAdminAuthStore((s) => s.clear);

  if (!session) return null;

  function handleLogout() {
    clear();
    navigate('/admin/login', { replace: true });
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="flex w-[236px] shrink-0 flex-col border-r border-border bg-card p-3.5">
        <div className="mb-7 px-2">
          <img src="/logo/flocktext-logo.png" alt="FlockText" className="h-7 w-auto" />
          <div className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
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
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-end gap-3.5 border-b border-border bg-card px-8 py-3.5">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 rounded-full border border-border py-1 pl-1 pr-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-foreground text-xs font-bold text-background">
                {session.admin.name.charAt(0).toUpperCase()}
              </div>
              <ChevronDown className="h-[15px] w-[15px] text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <div className="text-sm font-bold">{session.admin.name}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">{session.admin.email}</div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={handleLogout}>
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="flex-1 px-9 py-7">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
