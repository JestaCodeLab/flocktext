import { useEffect, useState } from 'react';
import { NavLink, Outlet, Link, useLocation } from 'react-router-dom';
import { ArrowRight, ChevronDown, Mail, Menu, X } from 'lucide-react';
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
import { SUPPORT_EMAIL, WHATSAPP_URL } from '@/pages/marketing/data/contact';
import { WhatsAppIcon } from '@/pages/marketing/components/WhatsAppIcon';

const navLinks = [{ to: '/pricing', label: 'Pricing', end: false }];

// "Download App" scrolls to a section on the homepage only, not a route — a
// plain anchor link, so no NavLink active-state.
const downloadAppLink = { to: '/#download-app', label: 'Download App' };

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

  // Download App is an anchor within the homepage, not a route — scroll to it on navigation.
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
            <DropdownMenu>
              <DropdownMenuTrigger className="flex cursor-pointer items-center gap-1 rounded-full px-4 py-1.5 text-sm font-medium text-muted-foreground transition-colors outline-none hover:text-foreground aria-expanded:text-foreground">
                Solutions
                <ChevronDown className="size-3.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" sideOffset={10} className="min-w-44 rounded-xl p-1.5">
                <DropdownMenuItem className="cursor-pointer rounded-lg px-2.5 py-2" render={<Link to="/businesses" />}>
                  <span className="text-sm font-medium">For Businesses</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer rounded-lg px-2.5 py-2" render={<Link to="/churches" />}>
                  <span className="text-sm font-medium">For Churches</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Link
              to={downloadAppLink.to}
              className="rounded-full px-4 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {downloadAppLink.label}
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
              <DropdownMenuTrigger className="flex cursor-pointer items-center gap-1 rounded-full px-4 py-1.5 text-sm font-medium text-muted-foreground transition-colors outline-none hover:text-foreground aria-expanded:text-foreground">
                Contact
                <ChevronDown className="size-3.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" sideOffset={10} className="min-w-44 rounded-xl p-1.5">
                <DropdownMenuItem
                  className="cursor-pointer gap-2.5 rounded-lg px-2.5 py-2"
                  render={<a href={`mailto:${SUPPORT_EMAIL}`} />}
                >
                  <Mail className="size-4 text-primary" />
                  <span>
                    <span className="block text-sm font-medium">Email us</span>
                    <span className="block text-xs text-muted-foreground">{SUPPORT_EMAIL}</span>
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer gap-2.5 rounded-lg px-2.5 py-2"
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
            <NavLink
              to="/businesses"
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                cn(
                  'rounded-lg border-b border-border/60 px-3 py-2.5 text-base font-medium',
                  isActive ? 'bg-secondary text-foreground' : 'text-muted-foreground'
                )
              }
            >
              For Businesses
            </NavLink>

            <NavLink
              to="/churches"
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                cn(
                  'rounded-lg border-b border-border/60 px-3 py-2.5 text-base font-medium',
                  isActive ? 'bg-secondary text-foreground' : 'text-muted-foreground'
                )
              }
            >
              For Churches
            </NavLink>

            <Link
              to={downloadAppLink.to}
              onClick={() => setMenuOpen(false)}
              className="rounded-lg border-b border-border/60 px-3 py-2.5 text-base font-medium text-muted-foreground"
            >
              {downloadAppLink.label}
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
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-5 py-14 sm:px-8 md:grid-cols-[2fr_1fr_1fr_1fr]">
          <div className="space-y-4">
            <Logo dark />
            <p className=" mt-3 max-w-sm text-sm leading-relaxed text-sidebar-foreground/60">
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
            <div className="text-xs font-bold tracking-wider text-sidebar-primary uppercase">Solutions</div>
            <div className="flex flex-col gap-2.5 text-sm text-sidebar-foreground/70">
              <Link to="/businesses" className="w-fit transition-colors hover:text-sidebar-foreground">
                For Businesses
              </Link>
              <Link to="/churches" className="w-fit transition-colors hover:text-sidebar-foreground">
                For Churches
              </Link>
            </div>
          </div>

          <div className="space-y-4">
            <div className="text-xs font-bold tracking-wider text-sidebar-primary uppercase">Contact</div>
            <div className="flex flex-col gap-2.5 text-sm text-sidebar-foreground/70">
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
          <div className="mx-auto flex w-full max-w-7xl flex-col-reverse items-center gap-3 px-5 py-6 text-xs text-sidebar-foreground/45 sm:flex-row sm:justify-between sm:px-8">
            <span>© {new Date().getFullYear()} FlockText. All rights reserved.</span>
            <div className="flex items-center gap-5">
              <Link to="/support" className="transition-colors hover:text-sidebar-foreground">
                Support
              </Link>
              <Link to="/terms" className="transition-colors hover:text-sidebar-foreground">
                Terms & Conditions
              </Link>
              <Link to="/privacy" className="transition-colors hover:text-sidebar-foreground">
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
