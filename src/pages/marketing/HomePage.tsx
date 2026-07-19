import { Link } from 'react-router-dom';
import {
  Users,
  Cake,
  CalendarClock,
  FileText,
  Tag,
  BarChart3,
  Wallet,
  Link2,
  Code2,
  Check,
  ArrowRight,
  Sparkles,
  MessageCircle,
  CircleCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Seo } from '@/pages/marketing/components/Seo';
import { DashboardPreview } from '@/pages/marketing/components/DashboardPreview';
import { WHATSAPP_URL } from '@/pages/marketing/data/contact';

const stats = [
  {
    icon: CircleCheck,
    value: '100%',
    label: 'Delivery rate',
    sub: 'Every send tracked',
    chip: 'bg-chart-2/15 text-chart-2',
  },
  {
    icon: Cake,
    value: '0',
    label: 'Missed birthdays',
    sub: 'Fully automated',
    chip: 'bg-chart-1/15 text-chart-1',
  },
  {
    icon: Code2,
    value: '2',
    label: 'Ways to send',
    sub: 'Dashboard or API',
    chip: 'bg-chart-3/15 text-chart-3',
  },
];

const features = [
  {
    icon: Users,
    title: 'Contacts & groups',
    description: 'Organize your contacts into groups — customers, members, staff — and message exactly who you mean to.',
    chip: 'bg-chart-3/15 text-chart-3',
  },
  {
    icon: Cake,
    title: 'Birthday automation',
    description: 'FlockText sends birthday messages on its own, using each contact’s date of birth. Nothing to remember.',
    chip: 'bg-chart-1/15 text-chart-1',
  },
  {
    icon: CalendarClock,
    title: 'Scheduled & recurring',
    description: 'Queue a message for later or set it to repeat — weekly reminders, monthly promotions, and more.',
    chip: 'bg-chart-4/15 text-chart-4',
  },
  {
    icon: FileText,
    title: 'Templates',
    description: 'Save your most-used messages as templates so composing a new blast takes seconds, not minutes.',
    chip: 'bg-chart-2/15 text-chart-2',
  },
  {
    icon: Tag,
    title: 'Custom sender ID',
    description: 'Messages arrive from your organization’s name, not a random shortcode.',
    chip: 'bg-chart-5/15 text-chart-5',
  },
  {
    icon: BarChart3,
    title: 'Delivery reports',
    description: 'See exactly what was delivered, pending, or failed for every message you send.',
    chip: 'bg-chart-3/15 text-chart-3',
  },
  {
    icon: Link2,
    title: 'Self-service join links',
    description: 'Share a link and let customers or members add themselves to your contact list — no manual data entry.',
    chip: 'bg-chart-2/15 text-chart-2',
  },
  {
    icon: Wallet,
    title: 'Pay-as-you-go credits',
    description: 'Top up your wallet with Paystack and spend it down at your own pace.',
    chip: 'bg-chart-1/15 text-chart-1',
  },
];

const dashboardPoints = [
  'Compose and send in a few clicks',
  'Manage contacts, groups, and templates',
  'Track delivery in real time',
];

export function HomePage() {
  return (
    <>
      <Seo
        title="FlockText — Bulk SMS for businesses, churches & institutions"
        description="Reach everyone you serve by SMS. Contact groups, birthday automation, scheduled sends, and delivery reports for businesses, churches, and institutions."
      />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-32 left-1/2 h-[480px] w-[720px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute top-40 -right-40 h-[360px] w-[360px] rounded-full bg-chart-1/10 blur-3xl" />

        <div className="relative mx-auto grid w-full max-w-7xl items-center gap-12 px-5 pt-16 pb-20 sm:px-8 lg:grid-cols-[1.05fr_1fr] lg:pt-24 lg:pb-28">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-semibold text-muted-foreground">
              <Sparkles className="size-3.5 text-primary" />
              Credits never sit behind a subscription
            </div>

            <h1 className="text-4xl leading-[1.08] font-bold tracking-tight text-foreground sm:text-[46px] lg:text-[54px]">
              Bulk SMS for <span className="text-primary">everyone</span> you serve
            </h1>

            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
              Send announcements, reminders, and birthday messages to your customers, members, or staff in seconds —
              from a dashboard your team can actually use, or a REST API if you’d rather build it in.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button size="lg" className="h-12 rounded-full px-7 text-[15px]" render={<Link to="/signup" />}>
                Start for free
                <ArrowRight data-icon="inline-end" className="size-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 rounded-full px-7 text-[15px]"
                render={<Link to="/pricing" />}
              >
                See pricing
              </Button>
            </div>

            <div className="mt-10 grid max-w-xl grid-cols-1 divide-y divide-border overflow-hidden rounded-xl bg-card/80 ring-1 ring-foreground/10 backdrop-blur-sm sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              {stats.map((stat) => (
                <div key={stat.label} className="flex items-center gap-3 p-4">
                  <span className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${stat.chip}`}>
                    <stat.icon className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-lg font-bold tracking-tight text-foreground">{stat.value}</span>
                      <span className="truncate text-[13px] font-semibold text-foreground/80">{stat.label}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">{stat.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="pointer-events-none absolute -inset-6 rounded-[32px] bg-gradient-to-br from-primary/15 via-transparent to-chart-1/15" />
            <DashboardPreview className="relative" />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border bg-card/60">
        <div className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-8 lg:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-3 text-xs font-bold tracking-widest text-primary uppercase">Features</div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Everything a serious sender needs
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              No bloated messaging suite — just the tools your team actually uses, whether you run a business, a
              church, or an institution.
            </p>
          </div>

          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-2xl bg-card p-6 ring-1 ring-foreground/10 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-foreground/5"
              >
                <span className={`flex size-11 items-center justify-center rounded-xl ${feature.chip}`}>
                  <feature.icon className="size-5" />
                </span>
                <div className="mt-4 text-[15px] font-bold text-foreground">{feature.title}</div>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dashboard or API */}
      <section>
        <div className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-8 lg:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-3 text-xs font-bold tracking-widest text-primary uppercase">Two ways to send</div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Dashboard or API — you choose
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Compose from the FlockText dashboard, or send programmatically with a keyed REST API.
            </p>
          </div>

          <div className="mx-auto mt-14 grid max-w-5xl gap-5 md:grid-cols-2">
            <div className="flex flex-col rounded-2xl bg-card p-8 ring-1 ring-foreground/10">
              <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <BarChart3 className="size-5" />
              </span>
              <div className="mt-5 text-lg font-bold text-foreground">No-code dashboard</div>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Built for teams — no technical setup required.
              </p>
              <ul className="mt-5 space-y-3">
                {dashboardPoints.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-foreground/80">
                    <span className="mt-0.5 flex size-4.5 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
                      <Check className="size-3" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col overflow-hidden rounded-2xl bg-sidebar p-8 text-sidebar-foreground ring-1 ring-sidebar-border">
              <span className="flex size-11 items-center justify-center rounded-xl bg-sidebar-primary/15 text-sidebar-primary">
                <Code2 className="size-5" />
              </span>
              <div className="mt-5 text-lg font-bold">Developer API</div>
              <p className="mt-1.5 text-sm text-sidebar-foreground/60">
                A keyed REST API with the same credits and delivery reporting.
              </p>
              <pre className="mt-5 overflow-x-auto rounded-xl bg-sidebar-accent p-5 font-mono text-[13px] leading-relaxed text-sidebar-foreground/90">
{`POST /api/v1/messages/send
Authorization: Bearer <api-key>

{
  "to": "+233...",
  "message": "Your order is ready for pickup!"
}`}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-sidebar">
        <div className="pointer-events-none absolute -top-24 left-1/4 h-[300px] w-[500px] rounded-full bg-primary/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 right-1/4 h-[260px] w-[420px] rounded-full bg-sidebar-primary/10 blur-3xl" />

        <div className="relative mx-auto w-full max-w-7xl px-5 py-20 text-center sm:px-8 lg:py-24">
          <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-sidebar-foreground sm:text-4xl">
            Ready to start sending?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-sidebar-foreground/60">
            Create a free account and top up credits whenever you’re ready to send.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" className="h-12 rounded-full px-7 text-[15px]" render={<Link to="/signup" />}>
              Start for free
              <ArrowRight data-icon="inline-end" className="size-4" />
            </Button>
            <Button
              size="lg"
              className="h-12 rounded-full border-sidebar-foreground/20 bg-transparent px-7 text-[15px] text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
              variant="outline"
              render={<a href={WHATSAPP_URL} target="_blank" rel="noreferrer" />}
            >
              <MessageCircle data-icon="inline-start" className="size-4" />
              Talk to us
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
