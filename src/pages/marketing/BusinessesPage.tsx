import { useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Bell,
  Briefcase,
  Building2,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  Gift,
  Megaphone,
  Scissors,
  ShoppingBag,
  Stethoscope,
  Truck,
  UtensilsCrossed,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';
import { Seo } from '@/pages/marketing/components/Seo';
import { FaqList } from '@/pages/marketing/components/FaqList';
import { routeSeo } from '@/pages/marketing/data/seo';
import { sharedFaqs } from '@/pages/marketing/data/faq';
import businessImage from '@/assets/images/retail-depot.png';
import shopsImage from '@/assets/images/shops.png';

const verticals = [
  {
    icon: ShoppingBag,
    title: 'Retail',
    description: 'Flash sales, restock alerts, and loyalty offers sent straight to your customers’ phones.',
  },
  {
    icon: UtensilsCrossed,
    title: 'Restaurants',
    description: 'Daily specials, reservation confirmations, and delivery updates that keep tables full.',
  },
  {
    icon: Scissors,
    title: 'Salons',
    description: 'Appointment reminders and confirmations that cut down on no-shows.',
  },
  {
    icon: Stethoscope,
    title: 'Clinics',
    description: 'Appointment reminders, health tips, and patient follow-ups patients actually read.',
  },
  {
    icon: Briefcase,
    title: 'SMEs',
    description: 'Order confirmations, payment reminders, and customer updates for growing businesses.',
  },
  {
    icon: Building2,
    title: 'Real Estate',
    description: 'Property alerts, viewing reminders, and follow-ups that keep leads warm.',
  },
];

const useCases = [
  {
    icon: Truck,
    title: 'Order & delivery updates',
    description: "Keep customers informed at every step, and cut down on \"where's my order\" calls.",
    chip: 'bg-chart-2/15 text-chart-2',
  },
  {
    icon: Megaphone,
    title: 'Promotions & flash sales',
    description: 'Announce a sale to your whole customer list in one send.',
    chip: 'bg-chart-3/15 text-chart-3',
  },
  {
    icon: Bell,
    title: 'Appointment reminders',
    description: 'Reduce no-shows for salons, clinics, and service businesses.',
    chip: 'bg-chart-1/15 text-chart-1',
  },
  {
    icon: Gift,
    title: 'Customer birthdays',
    description: 'Send a discount code automatically on their special day.',
    chip: 'bg-chart-4/15 text-chart-4',
  },
];

const highlights = [
  'No monthly contract — buy credits and spend on your own schedule',
  'Send under your own registered sender ID',
  'Live delivery reports for every campaign',
];

const businessFaqs = [
  {
    question: "What's the best bulk SMS app for small businesses in Ghana?",
    answer:
      'The right tool depends on your needs, but look for local network coverage (MTN, Vodafone, AirtelTigo), scheduling, contact management, and real-time delivery tracking — all of which FlockText provides out of the box.',
  },
  ...sharedFaqs,
];

export function BusinessesPage() {
  const verticalsTrackRef = useRef<HTMLDivElement>(null);
  const isAuthed = useAuthStore((s) => Boolean(s.accessToken));

  function scrollVerticals(direction: 1 | -1) {
    const track = verticalsTrackRef.current;
    const card = track?.firstElementChild as HTMLElement | null;
    if (!track || !card) return;
    const gap = parseFloat(getComputedStyle(track).columnGap || '0');
    track.scrollBy({ left: (card.offsetWidth + gap) * direction, behavior: 'smooth' });
  }

  return (
    <>
      <Seo {...routeSeo['/businesses']} />

      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-32 right-0 h-[420px] w-[560px] rounded-full bg-primary/10 blur-3xl" />

        <div className="relative mx-auto w-full max-w-7xl px-5 pt-14 pb-16 sm:px-8 sm:pt-20 sm:pb-20 lg:pt-24">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <div>
              <div className="mb-3 text-sm font-bold tracking-widest text-primary uppercase">For Businesses</div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
                Bulk SMS Platform for Ghanaian Businesses
              </h1>
              <p className="mt-6 max-w-lg text-base leading-relaxed text-muted-foreground">
                Turn one-time buyers into repeat customers with SMS marketing in Ghana. FlockText helps SMEs send
                promotions, order updates, and appointment reminders that customers actually open — SMS has open
                rates text and email marketing can't match.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button size="lg" className="h-12 rounded-full px-7 text-base" render={<Link to={isAuthed ? '/app' : '/signup'} />}>
                  {isAuthed ? 'Go to dashboard' : 'Grow Your Business with SMS'}
                  <ArrowRight data-icon="inline-end" className="size-4" />
                </Button>
                <Button size="lg" variant="outline" className="h-12 rounded-full px-7 text-base" render={<Link to="/pricing" />}>
                  See pricing
                </Button>
              </div>
            </div>
            <img
              src={businessImage}
              alt="Business owner sending SMS updates to customers from FlockText"
              width={1536}
              height={1024}
              className="aspect-[4/3] w-full rounded-3xl object-cover shadow-xl shadow-foreground/5 ring-1 ring-foreground/10"
            />
          </div>
        </div>
      </section>

      <section id="industries" className="border-t border-border">
        <div className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-8 lg:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-3 text-sm font-bold tracking-widest text-primary uppercase">Every industry</div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
              Built for every kind of business in Ghana
            </h2>
          </div>

          <div className="relative mt-14">
            <div
              ref={verticalsTrackRef}
              className="no-scrollbar flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-2"
            >
              {verticals.map((v) => (
                <div
                  key={v.title}
                  className="w-[90%] shrink-0 snap-start rounded-2xl bg-card p-6 ring-1 ring-foreground/10 sm:w-[calc(50%-10px)] lg:w-[calc(25%-15px)]"
                >
                  <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <v.icon className="size-5" />
                  </span>
                  <div className="mt-4 text-lg font-bold text-foreground">{v.title}</div>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{v.description}</p>
                </div>
              ))}
            </div>

            <button
              type="button"
              aria-label="Previous"
              onClick={() => scrollVerticals(-1)}
              className="absolute top-1/2 -left-4 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full bg-card text-foreground shadow-md ring-1 ring-foreground/10 transition-colors hover:bg-secondary sm:flex"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              aria-label="Next"
              onClick={() => scrollVerticals(1)}
              className="absolute top-1/2 -right-4 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full bg-card text-foreground shadow-md ring-1 ring-foreground/10 transition-colors hover:bg-secondary sm:flex"
            >
              <ChevronRight className="size-5" />
            </button>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-card/60">
        <div className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-8 lg:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-3 text-sm font-bold tracking-widest text-primary uppercase">Built for SMEs</div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
              Every message that keeps customers coming back
            </h2>
          </div>

          <div className="mx-auto mt-14 grid max-w-5xl gap-5 sm:grid-cols-2 lg:grid-cols-4">
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
              src={shopsImage}
              alt="Shop owner using a phone to send customer promotions"
              width={1536}
              height={1024}
              className="aspect-[4/3] w-full rounded-3xl object-cover ring-1 ring-foreground/10"
            />
            <div>
              <div className="mb-3 text-sm font-bold tracking-widest text-primary uppercase">Why SMS works</div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-4xl">
                Reach customers who don't check email or social media
              </h2>
              <p className="mt-5 text-base leading-relaxed text-muted-foreground">
                SMS gets read within minutes, not days — no algorithm deciding whether your customer sees it. For
                promotions, order updates, and reminders that need to land now, that's the difference between a
                message that works and one that gets ignored.
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
          <FaqList items={businessFaqs} />
        </div>
      </section>

      <section className="relative overflow-hidden bg-sidebar">
        <div className="pointer-events-none absolute -top-24 left-1/4 h-[300px] w-[500px] rounded-full bg-primary/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 right-1/4 h-[260px] w-[420px] rounded-full bg-sidebar-primary/10 blur-3xl" />

        <div className="relative mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-6 px-5 py-14 text-center sm:px-8 lg:flex-row lg:text-left">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-sidebar-foreground sm:text-4xl">
              Grow your business with SMS
            </h2>
            <p className="mt-2 max-w-xl text-base text-sidebar-foreground/60">
              Join Ghanaian businesses using FlockText to reach customers and grow revenue.
            </p>
          </div>
          <Button size="lg" className="h-11 rounded-full px-6 text-base" render={<Link to={isAuthed ? '/app' : '/signup'} />}>
            {isAuthed ? 'Go to dashboard' : 'Grow Your Business with SMS'}
            <ArrowRight data-icon="inline-end" className="size-4" />
          </Button>
        </div>
      </section>
    </>
  );
}
