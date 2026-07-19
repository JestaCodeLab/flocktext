import { useState } from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import { ArrowRight, ChevronDown, Menu, MessageCircle, Phone, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';

const logo = '/logo/flocktext-logo.png';
const logoWhite = '/logo/flocktext-logo-white.png';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { CONTACT_PHONE, CONTACT_PHONE_DISPLAY, SUPPORT_EMAIL, WHATSAPP_URL } from '@/pages/marketing/data/contact';

const navLinks = [
  { to: '/', label: 'Home', end: true },
  { to: '/pricing', label: 'Pricing', end: false },
];

function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <Link to="/" className="shrink-0">
      <img src={dark ? logoWhite : logo} alt="FlockText" className="h-9 w-auto" />
    </Link>
  );
}

export function MarketingLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const isAuthed = useAuthStore((s) => Boolean(s.accessToken));

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-md">
        <div className="relative mx-auto flex h-[68px] w-full max-w-7xl items-center justify-between px-5 sm:px-8">
          <Logo />

          <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 rounded-full border border-border/70 bg-card/80 p-1 md:flex">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  cn(
                    'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-foreground text-background'
                      : 'text-muted-foreground hover:text-foreground'
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}

            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1 rounded-full px-4 py-1.5 text-sm font-medium text-muted-foreground transition-colors outline-none hover:text-foreground aria-expanded:text-foreground">
                Contact
                <ChevronDown className="size-3.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" sideOffset={10} className="min-w-44 rounded-xl p-1.5">
                <DropdownMenuItem
                  className="gap-2.5 rounded-lg px-2.5 py-2"
                  render={<a href={`tel:${CONTACT_PHONE}`} />}
                >
                  <Phone className="size-4 text-primary" />
                  <span>
                    <span className="block text-sm font-medium">Call us</span>
                    <span className="block text-xs text-muted-foreground">{CONTACT_PHONE_DISPLAY}</span>
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="gap-2.5 rounded-lg px-2.5 py-2"
                  render={<a href={WHATSAPP_URL} target="_blank" rel="noreferrer" />}
                >
                  <MessageCircle className="size-4 text-success" />
                  <span>
                    <span className="block text-sm font-medium">WhatsApp</span>
                    <span className="block text-xs text-muted-foreground">Chat with support</span>
                  </span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          <div className="flex items-center gap-2">
            {isAuthed ? (
              <Button className="rounded-full px-5" render={<Link to="/app" />}>
                Dashboard
                <ArrowRight data-icon="inline-end" className="size-4" />
              </Button>
            ) : (
              <>
                <Button variant="ghost" className="hidden rounded-full sm:inline-flex" render={<Link to="/login" />}>
                  Log in
                </Button>
                <Button className="rounded-full px-5" render={<Link to="/signup" />}>
                  Get started
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full md:hidden"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </Button>
          </div>
        </div>

        {menuOpen ? (
          <div className="border-t border-border/70 bg-background md:hidden">
            <nav className="mx-auto flex w-full max-w-7xl flex-col px-5 py-3 sm:px-8">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'rounded-lg px-3 py-2.5 text-[15px] font-medium',
                      isActive ? 'bg-secondary text-foreground' : 'text-muted-foreground'
                    )
                  }
                >
                  {link.label}
                </NavLink>
              ))}
              {isAuthed ? null : (
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-[15px] font-medium text-muted-foreground sm:hidden"
                >
                  Log in
                </Link>
              )}

              <div className="mt-2 flex flex-col gap-1 border-t border-border/70 pt-3">
                <div className="px-3 pb-1 text-xs font-bold tracking-wider text-muted-foreground uppercase">
                  Contact
                </div>
                <a
                  href={`tel:${CONTACT_PHONE}`}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[15px] font-medium text-muted-foreground"
                >
                  <Phone className="size-4 text-primary" />
                  Call {CONTACT_PHONE_DISPLAY}
                </a>
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[15px] font-medium text-muted-foreground"
                >
                  <MessageCircle className="size-4 text-success" />
                  WhatsApp
                </a>
              </div>
            </nav>
          </div>
        ) : null}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="bg-sidebar text-sidebar-foreground">
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-5 py-14 sm:px-8 md:grid-cols-[1.6fr_1fr_1fr]">
          <div className="space-y-4">
            <Logo dark />
            <p className="max-w-sm text-sm leading-relaxed text-sidebar-foreground/60">
              Bulk SMS for businesses, churches, and institutions — reach everyone you serve, automate birthdays, and
              keep every group in sync.
            </p>
          </div>

          <div className="space-y-4">
            <div className="text-xs font-bold tracking-wider text-sidebar-primary uppercase">Product</div>
            <div className="flex flex-col gap-2.5 text-sm text-sidebar-foreground/70">
              <Link to="/" className="w-fit transition-colors hover:text-sidebar-foreground">
                Home
              </Link>
              <Link to="/pricing" className="w-fit transition-colors hover:text-sidebar-foreground">
                Pricing
              </Link>
              <Link to="/signup" className="w-fit transition-colors hover:text-sidebar-foreground">
                Get started
              </Link>
            </div>
          </div>

          <div className="space-y-4">
            <div className="text-xs font-bold tracking-wider text-sidebar-primary uppercase">Contact</div>
            <div className="flex flex-col gap-2.5 text-sm text-sidebar-foreground/70">
              <a href={`tel:${CONTACT_PHONE}`} className="flex w-fit items-center gap-2 transition-colors hover:text-sidebar-foreground">
                <Phone className="size-3.5" />
                {CONTACT_PHONE_DISPLAY}
              </a>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noreferrer"
                className="flex w-fit items-center gap-2 transition-colors hover:text-sidebar-foreground"
              >
                <MessageCircle className="size-3.5" />
                WhatsApp
              </a>
              <a href={`mailto:${SUPPORT_EMAIL}`} className="w-fit transition-colors hover:text-sidebar-foreground">
                {SUPPORT_EMAIL}
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-sidebar-border">
          <div className="mx-auto w-full max-w-7xl px-5 py-6 text-xs text-sidebar-foreground/45 sm:px-8">
            © {new Date().getFullYear()} FlockText. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
