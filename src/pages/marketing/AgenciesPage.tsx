import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Briefcase,
  Building2,
  CalendarClock,
  Check,
  Church,
  CircleCheck,
  FileBarChart,
  GraduationCap,
  KeyRound,
  LayoutGrid,
  ShieldCheck,
  Store,
  Users,
  UserCog,
  Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';
import { Seo } from '@/pages/marketing/components/Seo';
import { FaqList } from '@/pages/marketing/components/FaqList';
import { OrgTreeSection } from '@/pages/marketing/components/OrgTreeSection';
import { routeSeo } from '@/pages/marketing/data/seo';
import { agencyFaqs } from '@/pages/marketing/data/faq';

const heroAccounts = [
  { icon: Briefcase, label: 'Client A', active: true },
  { icon: Briefcase, label: 'Client B', active: false },
  { icon: Church, label: 'Church Client', active: false },
  { icon: GraduationCap, label: 'School Client', active: false },
];

const useCases = [
  {
    icon: CalendarClock,
    title: 'Campaigns for every client',
    description: 'Build, schedule, and send SMS campaigns for each client without leaving one account.',
    chip: 'bg-chart-2/15 text-chart-2',
  },
  {
    icon: FileBarChart,
    title: 'Delivery reports per client',
    description: "Pull reports for a single client's campaigns without any other client's data mixed in.",
    chip: 'bg-chart-3/15 text-chart-3',
  },
  {
    icon: UserCog,
    title: 'Client & team access',
    description: "Give a client's own team visibility into their organization, and only their organization.",
    chip: 'bg-chart-1/15 text-chart-1',
  },
  {
    icon: Wallet,
    title: 'Wallets stay separate',
    description: "Each client's SMS balance is tracked on its own — nothing shared, nothing to reconcile.",
    chip: 'bg-chart-4/15 text-chart-4',
  },
];

const clientBranches = [
  { icon: Briefcase, label: 'Client A' },
  { icon: Briefcase, label: 'Client B' },
  { icon: Briefcase, label: 'Client C' },
  { icon: Church, label: 'Church Client' },
  { icon: GraduationCap, label: 'School Client' },
  { icon: Store, label: 'Retail Client' },
];

const clientHighlights = [
  'Each client keeps its own contacts, Sender ID, and SMS balance',
  'Switch between client accounts in one click — no separate logins',
  'Campaigns, messaging history, and delivery reports stay separate per client',
];

const benefits = [
  { icon: KeyRound, label: 'One login' },
  { icon: Building2, label: 'Multiple client organizations' },
  { icon: Users, label: 'Separate contacts' },
  { icon: ShieldCheck, label: 'Separate Sender IDs' },
  { icon: Wallet, label: 'Separate SMS balances' },
  { icon: FileBarChart, label: 'Separate reports' },
  { icon: UserCog, label: 'Client/team access' },
  { icon: CircleCheck, label: 'Easier client management' },
  { icon: LayoutGrid, label: 'Centralized administration' },
];

export function AgenciesPage() {
  const isAuthed = useAuthStore((s) => Boolean(s.accessToken));

  return (
    <>
      <Seo {...routeSeo['/agencies']} />

      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-32 right-0 h-[420px] w-[560px] rounded-full bg-primary/10 blur-3xl" />

        <div className="relative mx-auto w-full max-w-7xl px-5 pt-14 pb-16 sm:px-8 sm:pt-20 sm:pb-20 lg:pt-24">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <div>
              <div className="mb-3 text-sm font-bold tracking-widest text-primary uppercase">For Agencies</div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
                Manage All Your Clients From One Account
              </h1>
              <p className="mt-6 max-w-lg text-base leading-relaxed text-muted-foreground">
                Manage SMS campaigns for multiple clients without juggling separate accounts and logins.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button size="lg" className="h-12 rounded-full px-7 text-base" render={<Link to={isAuthed ? '/app' : '/signup'} />}>
                  {isAuthed ? 'Go to dashboard' : 'Start Managing Clients'}
                  <ArrowRight data-icon="inline-end" className="size-4" />
                </Button>
                <Button size="lg" variant="outline" className="h-12 rounded-full px-7 text-base" render={<Link to="/pricing" />}>
                  See pricing
                </Button>
              </div>
            </div>

            <div className="rounded-3xl bg-card p-3 shadow-xl shadow-foreground/5 ring-1 ring-foreground/10">
              <div className="px-2.5 py-2 text-xs font-semibold text-muted-foreground">Switch account</div>
              <div className="space-y-1">
                {heroAccounts.map((account) => (
                  <div
                    key={account.label}
                    className={`flex items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-sm font-medium ${
                      account.active ? 'bg-primary/10 text-primary' : 'text-foreground'
                    }`}
                  >
                    <span
                      className={`flex size-8 shrink-0 items-center justify-center rounded-full ${
                        account.active ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground'
                      }`}
                    >
                      {account.active ? <Check className="size-4" /> : <account.icon className="size-4" />}
                    </span>
                    {account.label}
                    {account.active && <span className="ml-auto text-xs text-primary/80">Current</span>}
                  </div>
                ))}
                <div className="flex items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-sm font-medium text-muted-foreground">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary/60 text-muted-foreground">
                    +
                  </span>
                  Add client account
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-card/60">
        <div className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-8 lg:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-3 text-sm font-bold tracking-widest text-primary uppercase">Built for agencies</div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
              Every client, managed from one place
            </h2>
          </div>

          <div className="mx-auto mt-14 grid max-w-8xl gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {useCases.map((uc) => (
              <div key={uc.title} className="rounded-2xl bg-card p-6 ring-1 ring-foreground/10">
                <span className={`flex size-11 items-center justify-center rounded-xl ${uc.chip}`}>
                  <uc.icon className="size-5" />
                </span>
                <div className="mt-4 text-lg font-bold text-foreground">{uc.title}</div>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{uc.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <OrgTreeSection
        kicker="One account, every client"
        heading="Manage All Your Clients From One Account"
        description="Digital agencies, marketing agencies, and consultants managing communications for multiple clients — each client stays a fully separate organization, and you manage all of them from one FlockText login."
        highlights={clientHighlights}
        rootLabel="Your Agency"
        rootIcon={Building2}
        branches={clientBranches}
        ctaLabel="Start Managing Clients"
        ctaTo="/signup"
        isAuthed={isAuthed}
      />

      <section className="border-t border-border">
        <div className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-8 lg:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-3 text-sm font-bold tracking-widest text-primary uppercase">Why agencies choose FlockText</div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-5xl">Built for client work</h2>
          </div>

          <div className="mx-auto mt-14 grid max-w-4xl grid-cols-2 gap-3 sm:grid-cols-3">
            {benefits.map((b) => (
              <div
                key={b.label}
                className="flex items-center gap-2.5 rounded-2xl bg-card px-4 py-3.5 ring-1 ring-foreground/10"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <b.icon className="size-4" />
                </span>
                <span className="text-sm font-medium text-foreground">{b.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-card/60">
        <div className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-8 lg:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-3 text-sm font-bold tracking-widest text-primary uppercase">FAQ</div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-5xl">Common Questions</h2>
          </div>
          <FaqList items={agencyFaqs} />
        </div>
      </section>

      <section className="relative overflow-hidden bg-sidebar">
        <div className="pointer-events-none absolute -top-24 left-1/4 h-[300px] w-[500px] rounded-full bg-primary/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 right-1/4 h-[260px] w-[420px] rounded-full bg-sidebar-primary/10 blur-3xl" />

        <div className="relative mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-6 px-5 py-14 text-center sm:px-8 lg:flex-row lg:text-left">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-sidebar-foreground sm:text-4xl">
              Manage every client from one account
            </h2>
            <p className="mt-2 max-w-xl text-base text-sidebar-foreground/60">
              Join agencies across Ghana using FlockText to run SMS for every client they manage.
            </p>
          </div>
          <Button size="lg" className="h-11 rounded-full px-6 text-base" render={<Link to={isAuthed ? '/app' : '/signup'} />}>
            {isAuthed ? 'Go to dashboard' : 'Start Managing Clients'}
            <ArrowRight data-icon="inline-end" className="size-4" />
          </Button>
        </div>
      </section>
    </>
  );
}
