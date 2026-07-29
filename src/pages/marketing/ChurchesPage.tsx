import { Link } from 'react-router-dom';
import { ArrowRight, CalendarClock, CircleCheck, Gift, HandCoins, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';
import { Seo } from '@/pages/marketing/components/Seo';
import { FaqList } from '@/pages/marketing/components/FaqList';
import { routeSeo } from '@/pages/marketing/data/seo';
import { sharedFaqs } from '@/pages/marketing/data/faq';
import churchImage from '@/assets/images/church.png';
import pastorsImage from '@/assets/images/pastors.png';

const useCases = [
  {
    icon: CalendarClock,
    title: 'Service & event reminders',
    description: 'Boost attendance for Sunday service, midweek programs, and special events.',
    chip: 'bg-chart-2/15 text-chart-2',
  },
  {
    icon: Gift,
    title: 'Member birthdays & anniversaries',
    description: 'Make every member feel remembered with automated wishes.',
    chip: 'bg-chart-3/15 text-chart-3',
  },
  {
    icon: HandCoins,
    title: 'Fundraising & giving campaigns',
    description: 'Send timely reminders for building funds, harvest, and outreach drives.',
    chip: 'bg-chart-1/15 text-chart-1',
  },
  {
    icon: Users,
    title: 'Group messaging',
    description: 'Reach ushers, choir, youth ministry, or small groups separately with targeted texts.',
    chip: 'bg-chart-4/15 text-chart-4',
  },
];

const highlights = [
  'Group contacts by ministry, department, or small group',
  'Automated birthday & anniversary wishes, every year',
  'Reaches members who may not check email or social media',
];

const churchFaqs = [
  {
    question: 'How do I send bulk SMS to church members in Ghana?',
    answer:
      "Import your congregation's phone numbers into FlockText, group them by ministry or department if needed, then compose and send your message — or schedule it for a future date. Delivery reports let you confirm who received it.",
  },
  ...sharedFaqs,
];

export function ChurchesPage() {
  const isAuthed = useAuthStore((s) => Boolean(s.accessToken));

  return (
    <>
      <Seo {...routeSeo['/churches']} />

      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-32 right-0 h-[420px] w-[560px] rounded-full bg-primary/10 blur-3xl" />

        <div className="relative mx-auto w-full max-w-7xl px-5 pt-14 pb-16 sm:px-8 sm:pt-20 sm:pb-20 lg:pt-24">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <div>
              <div className="mb-3 text-sm font-bold tracking-widest text-primary uppercase">For Churches</div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
                SMS Platform for Churches in Ghana
              </h1>
              <p className="mt-6 max-w-lg text-base leading-relaxed text-muted-foreground">
                Stay connected with your congregation between Sundays. FlockText helps churches, ministries, and
                religious organizations in Ghana send service reminders, event announcements, and encouragement
                texts — reaching members who may not check email or social media.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button size="lg" className="h-12 rounded-full px-7 text-base" render={<Link to={isAuthed ? '/app' : '/signup'} />}>
                  {isAuthed ? 'Go to dashboard' : 'Connect With Your Congregation'}
                  <ArrowRight data-icon="inline-end" className="size-4" />
                </Button>
                <Button size="lg" variant="outline" className="h-12 rounded-full px-7 text-base" render={<Link to="/pricing" />}>
                  See pricing
                </Button>
              </div>
            </div>
            <img
              src={churchImage}
              alt="Church staff sending SMS reminders to their congregation from FlockText"
              width={1536}
              height={1024}
              className="aspect-[4/3] w-full rounded-3xl object-cover shadow-xl shadow-foreground/5 ring-1 ring-foreground/10"
            />
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-card/60">
        <div className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-8 lg:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-3 text-sm font-bold tracking-widest text-primary uppercase">Built for ministries</div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
              Every message that keeps your congregation connected
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

      <section className="border-t border-border">
        <div className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-8 lg:py-24">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <img
              src={pastorsImage}
              alt="Pastor sending a service reminder to the congregation"
              width={1536}
              height={1024}
              className="aspect-[4/3] w-full rounded-3xl object-cover ring-1 ring-foreground/10 lg:order-2"
            />
            <div className="lg:order-1">
              <div className="mb-3 text-sm font-bold tracking-widest text-primary uppercase">Why SMS works</div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-4xl">
                Reach members who may not check email or social media
              </h2>
              <p className="mt-5 text-base leading-relaxed text-muted-foreground">
                Not every member follows the church on social media or checks email regularly — but almost everyone
                reads a text. For attendance-critical announcements and personal touches like a birthday wish, SMS
                reaches people where they actually are.
              </p>
              <div className="mt-6 space-y-3">
                {highlights.map((point) => (
                  <div key={point} className="flex items-start gap-2.5 text-base text-foreground/80">
                    <CircleCheck className="mt-0.5 size-4 shrink-0 text-success" />
                    {point}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-card/60">
        <div className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-8 lg:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-3 text-sm font-bold tracking-widest text-primary uppercase">FAQ</div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-5xl">Common Questions</h2>
          </div>
          <FaqList items={churchFaqs} />
        </div>
      </section>

      <section className="relative overflow-hidden bg-sidebar">
        <div className="pointer-events-none absolute -top-24 left-1/4 h-[300px] w-[500px] rounded-full bg-primary/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 right-1/4 h-[260px] w-[420px] rounded-full bg-sidebar-primary/10 blur-3xl" />

        <div className="relative mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-6 px-5 py-14 text-center sm:px-8 lg:flex-row lg:text-left">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-sidebar-foreground sm:text-4xl">
              Connect with your congregation
            </h2>
            <p className="mt-2 max-w-xl text-base text-sidebar-foreground/60">
              Join churches across Ghana using FlockText to stay connected between Sundays.
            </p>
          </div>
          <Button size="lg" className="h-11 rounded-full px-6 text-base" render={<Link to={isAuthed ? '/app' : '/signup'} />}>
            {isAuthed ? 'Go to dashboard' : 'Connect With Your Congregation'}
            <ArrowRight data-icon="inline-end" className="size-4" />
          </Button>
        </div>
      </section>
    </>
  );
}
