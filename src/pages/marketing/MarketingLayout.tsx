import { useEffect, useState } from 'react';
import { NavLink, Outlet, Link, useLocation } from 'react-router-dom';
import { ArrowRight, ChevronDown, Mail, Menu, Phone, X } from 'lucide-react';
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

// Font Awesome's "whatsapp" brand glyph — lucide has no brand icons, so this is inlined directly.
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 448 512" fill="currentColor" className={className} aria-hidden="true">
      <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z" />
    </svg>
  );
}

const navLinks = [{ to: '/pricing', label: 'Pricing', end: false }];

// Sections live on the homepage only — plain anchor links, not routes, so no NavLink active-state.
const anchorLinks = [
  { to: '/#features', label: 'Features' },
  { to: '/#download-app', label: 'Download App' },
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
  const [scrolled, setScrolled] = useState(false);
  const isAuthed = useAuthStore((s) => Boolean(s.accessToken));
  const location = useLocation();

  // Features/Download App are anchors within the homepage, not routes — scroll to them on navigation.
  // Route changes without a hash (e.g. Home -> Pricing) don't reset scroll position on their own, so scroll to top instead.
  useEffect(() => {
    if (!location.hash) {
      window.scrollTo({ top: 0 });
      return;
    }
    const el = document.getElementById(location.hash.slice(1));
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [location.pathname, location.hash]);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header
        className={cn(
          'sticky top-0 z-40 border-b transition-colors duration-300',
          scrolled || menuOpen
            ? 'border-border/70 bg-background/85 backdrop-blur-md'
            : 'border-transparent bg-transparent'
        )}
      >
        <div className="relative mx-auto flex h-[68px] w-full max-w-7xl items-center justify-between px-5 sm:px-8">
          <Logo />

          <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 rounded-full border border-border/70 bg-card/80 p-1 md:flex">
            <Link
              to={anchorLinks[0].to}
              className="rounded-full px-4 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {anchorLinks[0].label}
            </Link>

            <Link
              to={anchorLinks[1].to}
              className="rounded-full px-4 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {anchorLinks[1].label}
            </Link>

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
                  render={<a href={`mailto:${SUPPORT_EMAIL}`} />}
                >
                  <Mail className="size-4 text-primary" />
                  <span>
                    <span className="block text-sm font-medium">Email us</span>
                    <span className="block text-xs text-muted-foreground">{SUPPORT_EMAIL}</span>
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="gap-2.5 rounded-lg px-2.5 py-2"
                  render={<a href={WHATSAPP_URL} target="_blank" rel="noreferrer" />}
                >
                  <WhatsAppIcon className="size-4 text-success" />
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
                <Button className="hidden rounded-full px-5 sm:inline-flex" render={<Link to="/signup" />}>
                  Sign up
                </Button>
              </>
            )}
            <Button
              variant="outline"
              size="icon"
              className="rounded-lg bg-white md:hidden"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </Button>
          </div>
        </div>

        <div
          className={cn(
            'overflow-hidden bg-background transition-[max-height] duration-300 ease-in-out md:hidden',
            menuOpen ? 'max-h-[520px] border-t border-border/70' : 'max-h-0'
          )}
        >
          <nav className="mx-auto flex w-full max-w-7xl flex-col px-5 py-3 sm:px-8">
            <Link
              to={anchorLinks[0].to}
              onClick={() => setMenuOpen(false)}
              className="rounded-lg border-b border-border/60 px-3 py-2.5 text-base font-medium text-muted-foreground"
            >
              {anchorLinks[0].label}
            </Link>

            <Link
              to={anchorLinks[1].to}
              onClick={() => setMenuOpen(false)}
              className="rounded-lg border-b border-border/60 px-3 py-2.5 text-base font-medium text-muted-foreground"
            >
              {anchorLinks[1].label}
            </Link>

            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'rounded-lg border-b border-border/60 px-3 py-2.5 text-base font-medium',
                    isActive ? 'bg-secondary text-foreground' : 'text-muted-foreground'
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}

            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noreferrer"
              onClick={() => setMenuOpen(false)}
              className="rounded-lg border-b border-border/60 px-3 py-2.5 text-base font-medium text-muted-foreground"
            >
              Contact us
            </a>

            {isAuthed ? null : (
              <div className="mt-2 flex items-center gap-2.5 sm:hidden">
                <Button
                  variant="outline"
                  className="flex-1 rounded-full text-base"
                  render={<Link to="/login" onClick={() => setMenuOpen(false)} />}
                >
                  Log in
                </Button>
                <Button
                  className="flex-1 rounded-full text-base"
                  render={<Link to="/signup" onClick={() => setMenuOpen(false)} />}
                >
                  Sign up
                </Button>
              </div>
            )}
          </nav>
        </div>
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
                <WhatsAppIcon className="size-3.5" />
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
