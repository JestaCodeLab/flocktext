import { Link } from 'react-router-dom';
import {
  Users,
  FileText,
  BarChart3,
  Settings2,
  Send,
  Stethoscope,
  Church,
  Briefcase,
  UtensilsCrossed,
  CircleCheck,
  ArrowRight,
  Quote,
  Download,
  CalendarClock,
  Gift,
  UserPlus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Seo } from '@/pages/marketing/components/Seo';
import { PackageGrid } from '@/pages/marketing/components/PackageGrid';
import { APP_STORE_URL, PLAY_STORE_URL } from '@/pages/marketing/data/contact';
import { routeSeo } from '@/pages/marketing/data/seo';
import heroImage from '@/assets/images/flocktext_home_banner.png';
import churchImage from '@/assets/images/church.png';
import healthcareImage from '@/assets/images/healthcare.png';
import businessImage from '@/assets/images/business.png';
import restaurantImage from '@/assets/images/restaurant.png';
import handPhoneImage from '@/assets/images/phone.png';
import appStoreBadge from '@/assets/images/Appstore-download.webp';
import playStoreBadge from '@/assets/images/googleplay-download.webp';

const trustPoints = ['No credit card required', 'Instant delivery', '99%+ delivery rate'];

// Generic placeholder wordmarks — swap for real client logos once confirmed. See [[flocktext-marketing-homepage]].
const trustedByLogos = ['Vertex', 'Northbridge', 'Solace', 'Meridian', 'Anchor Co.', 'Halcyon'];

const features = [
  {
    icon: Send,
    title: 'Bulk SMS Messaging',
    description: 'Send messages to thousands instantly. Share promotions, alerts, reminders and more.',
    chip: 'bg-chart-2/15 text-chart-2',
  },
  {
    icon: Users,
    title: 'Contact Management',
    description: 'Organize your contacts into lists and groups for targeted and personalized communication.',
    chip: 'bg-chart-3/15 text-chart-3',
  },
  {
    icon: BarChart3,
    title: 'Delivery Reports',
    description: 'Track every message with real-time delivery reports and analytics.',
    chip: 'bg-chart-1/15 text-chart-1',
  },
  {
    icon: Settings2,
    title: 'Easy Integration',
    description: 'Integrate our SMS API into your systems and apps in just a few steps.',
    chip: 'bg-chart-4/15 text-chart-4',
  },
  {
    icon: CalendarClock,
    title: 'Scheduled & Recurring Sends',
    description: 'Queue messages for later or set up recurring sends so nothing slips through the cracks.',
    chip: 'bg-chart-2/15 text-chart-2',
  },
  {
    icon: Gift,
    title: 'Birthday Automation',
    description: 'Automatically send birthday greetings to your contacts without lifting a finger.',
    chip: 'bg-chart-3/15 text-chart-3',
  },
  {
    icon: FileText,
    title: 'Message Templates',
    description: 'Save and reuse your best-performing messages so you can send faster next time.',
    chip: 'bg-chart-1/15 text-chart-1',
  },
  {
    icon: UserPlus,
    title: 'Team Member Accounts',
    description: 'Invite your team and manage access so everyone can send without sharing logins.',
    chip: 'bg-chart-4/15 text-chart-4',
  },
];

const appHighlights = [
  'Send SMS and check delivery from anywhere',
  'Track wallet balance and buy credits in seconds',
  'Get notified the moment a campaign finishes sending',
];

const steps = [
  { icon: Users, step: 1, title: 'Add Contacts', description: 'Upload your contacts or import from existing lists.' },
  { icon: FileText, step: 2, title: 'Create Message', description: 'Type your message and personalize it.' },
  { icon: Send, step: 3, title: 'Send', description: 'Choose your recipients and hit send.' },
  { icon: BarChart3, step: 4, title: 'Track Results', description: 'View delivery reports and measure performance.' },
];

const industries = [
  {
    icon: Church,
    title: 'Churches',
    description: 'Sunday reminders, event announcements, and congregation updates.',
    image: churchImage,
  },
  {
    icon: Stethoscope,
    title: 'Healthcare',
    description: 'Appointment reminders, health tips, and patient engagement.',
    image: healthcareImage,
  },
  {
    icon: Briefcase,
    title: 'Business',
    description: 'Promotions, customer updates, and team announcements.',
    image: businessImage,
  },
  {
    icon: UtensilsCrossed,
    title: 'Restaurants',
    description: 'Daily specials, order updates, and customer promotions.',
    image: restaurantImage,
  },
];

// Placeholder testimonials — pending real customer quotes to replace these. See [[flocktext-marketing-homepage]].
const testimonials = [
  {
    quote: 'FlockText has transformed the way we communicate with our customers. Reliable, fast and easy to use.',
    name: 'Business Owner',
    role: 'Retail',
  },
  {
    quote: 'The delivery rate is excellent and the reports help us track every campaign effectively.',
    name: 'Operations Manager',
    role: 'Financial services',
  },
  {
    quote: "We use FlockText daily for reminders and promotions. It's simply the best SMS platform we've used.",
    name: 'Team Lead',
    role: 'Hospitality',
  },
];

export function HomePage() {
  return (
    <>
      <Seo {...routeSeo['/']} />

      {/* Mobile hero — dedicated layout below sm: a rounded photo card with a delivery
          "toast" overlay, then stacked full-width CTAs and a vertical trust list. The
          sm+ hero below is a completely different full-bleed layout, so these render as
          two separate blocks rather than one responsive tree. */}
      <section className="sm:hidden">
        <div className="px-4 pt-3">
          <div className="relative overflow-hidden rounded-3xl ring-1 ring-foreground/10">
            <img src={heroImage} alt="" className="h-64 w-full object-cover object-[60%_20%]" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-foreground/50" />
            <div className="absolute inset-x-3 bottom-3 flex items-center gap-2.5 rounded-2xl bg-card/95 p-2.5 shadow-lg backdrop-blur-sm">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-white">
                <Send className="size-4" />
              </span>
              <div className="text-[11px] leading-tight">
                <div className="font-bold text-foreground">FlockText</div>
                <div className="text-muted-foreground">Delivered to 2,481 contacts</div>
              </div>
              <span className="ml-auto flex size-5 shrink-0 items-center justify-center rounded-full bg-success">
                <CircleCheck className="size-3.5 text-white" />
              </span>
            </div>
          </div>
        </div>

        <div className="px-5 pt-6 pb-20">
          <h1 className="text-[34px] leading-[1.1] font-bold tracking-tight text-foreground">
            Business Communication
            <span className="block text-primary">Made Simple</span>
          </h1>

          <p className="mt-3.5 text-[15px] leading-relaxed text-muted-foreground">
            Send bulk SMS, manage contacts, and engage your audience effectively with FlockText.
          </p>

          <div className="mt-5 flex flex-col gap-3">
            <Button size="lg" className="h-[52px] w-full rounded-full text-base" render={<Link to="/signup" />}>
              Start sending today
              <ArrowRight data-icon="inline-end" className="size-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-[52px] w-full rounded-full text-base"
              render={<Link to="/#download-app" />}
            >
              Download App
            </Button>
          </div>
        </div>
      </section>

      {/* Hero (sm+) — flocktext_home_banner.png as a full-bleed background, white-to-transparent
          gradient over it so the left-aligned copy stays legible against the photo.
          -mt-[68px] pulls this section up behind the sticky header (which is transparent
          at the top of the page) so the photo shows through the nav instead of stopping
          below it; min-h is bumped by that same 68px so nothing after the hero shifts. */}
      <section
        className="relative -mt-[68px] hidden min-h-[628px] items-center overflow-hidden bg-cover bg-right sm:flex lg:min-h-[708px]"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to right, var(--background) 0%, var(--background) 30%, color-mix(in oklch, var(--background) 55%, transparent) 48%, transparent 68%)',
          }}
        />

        <div className="relative mx-auto w-full max-w-7xl px-5 py-16 sm:px-8">
          <div className="max-w-xl lg:max-w-lg">
            <h1 className="text-[52px] leading-[1] font-bold tracking-tight text-foreground lg:text-[62px]">
              Business
              <br />
              Communication
              <br />
              <span className="text-primary">Made Simple</span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              Send bulk SMS, manage contacts, and engage your audience effectively with FlockText.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button size="lg" className="h-12 rounded-full px-7 text-base" render={<Link to="/signup" />}>
                Start sending for free
                <ArrowRight data-icon="inline-end" className="size-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 rounded-full px-7 text-base"
                render={<Link to="/#download-app" />}
              >
                Download App
              </Button>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2">
              {trustPoints.map((point) => (
                <div key={point} className="flex items-center gap-2 text-base text-foreground/80">
                  <CircleCheck className="size-4 text-success" />
                  {point}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Trusted by */}
      <section className="hidden border-t border-border sm:block">
        <div className="mx-auto w-full max-w-7xl px-5 py-12 sm:px-8">
          <p className="text-center text-base text-muted-foreground">
            Trusted by businesses and organizations across Africa
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 grayscale">
            {trustedByLogos.map((name) => (
              <span key={name} className="text-xl font-bold tracking-tight text-muted-foreground/70">
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Industries */}
      <section id="industries" className="border-t border-border bg-card/60">
        <div className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-8 lg:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-3 text-sm font-bold tracking-widest text-primary uppercase">Built for every industry</div>
            <h2 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              One platform. Many possibilities.
            </h2>
          </div>

          <div className="no-scrollbar -mx-5 mt-14 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-2 sm:mx-0 sm:grid sm:snap-none sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4">
            {industries.map((industry) => (
              <div
                key={industry.title}
                className="w-[78%] shrink-0 snap-center overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-foreground/5 sm:w-auto sm:shrink sm:snap-align-none"
              >
                <img
                  src={industry.image}
                  alt=""
                  width={1536}
                  height={1024}
                  className="aspect-[4/3] w-full object-cover"
                />
                <div className="p-5">
                  <div className="text-lg font-bold text-foreground">{industry.title}</div>
                  <p className="mt-1.5 text-base leading-relaxed text-muted-foreground">{industry.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-border">
        <div className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-8 lg:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-3 text-sm font-bold tracking-widest text-primary uppercase">Powerful features</div>
            <h2 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Everything you need to reach more people
            </h2>
          </div>

          <div className="no-scrollbar -mx-5 mt-14 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 sm:mx-0 sm:grid sm:snap-none sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group w-[78%] shrink-0 snap-center rounded-2xl bg-card p-6 ring-1 ring-foreground/10 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-foreground/5 sm:w-auto sm:shrink sm:snap-align-none"
              >
                <span className={`flex size-11 items-center justify-center rounded-xl ${feature.chip}`}>
                  <feature.icon className="size-5" />
                </span>
                <div className="mt-4 text-lg font-bold text-foreground">{feature.title}</div>
                <p className="mt-1.5 text-base leading-relaxed text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Button className="rounded-full px-6" render={<Link to="/signup" />}>
              Explore all features
              <ArrowRight data-icon="inline-end" className="size-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Mobile app */}
      <section id="download-app" className="relative overflow-hidden bg-sidebar lg:min-h-[680px] xl:min-h-[780px]">
        <div className="pointer-events-none absolute -top-32 left-1/3 h-[320px] w-[520px] rounded-full bg-primary/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 right-0 h-[280px] w-[440px] rounded-full bg-sidebar-primary/10 blur-3xl" />

        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[42%] items-center justify-center lg:flex xl:w-[50%]">
          <img
            src={handPhoneImage}
            alt="Hand holding a phone showing the FlockText create account screen"
            className="h-[110%] w-auto max-w-none translate-y-20 object-contain"
          />
        </div>

        <div className="relative mx-auto w-full max-w-7xl px-5 py-16 sm:px-8 lg:py-24">
          <div className="max-w-xl text-center sm:text-left lg:max-w-md xl:max-w-xl">
            <div className="mb-3 text-sm font-bold tracking-widest text-sidebar-primary uppercase">Mobile app</div>
            <h2 className="text-4xl leading-[1.05] font-bold tracking-tight text-sidebar-foreground sm:text-5xl lg:text-4xl xl:text-6xl">
              Manage Everything On The Go
            </h2>
            <p className="mx-auto mt-6 max-w-md text-lg leading-relaxed text-sidebar-foreground/70 sm:mx-0">
              Send messages, track your wallet, and monitor delivery in real time — the FlockText app is available
              now on the App Store and Google Play.
            </p>

            <div className="mt-8 space-y-3 text-left">
              {appHighlights.map((point) => (
                <div key={point} className="flex items-start gap-2.5 text-base text-sidebar-foreground/80">
                  <CircleCheck className="mt-0.5 size-4 shrink-0 text-sidebar-primary" />
                  {point}
                </div>
              ))}
            </div>

            <div className="mt-9 -mb-6 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
              <a href={APP_STORE_URL} target="_blank" rel="noreferrer" className="transition-opacity hover:opacity-85">
                <img src={appStoreBadge} alt="Download on the App Store" className="h-16 w-auto lg:h-20 lg:-ml-3 sm:-ml-3" />
              </a>
              <a href={PLAY_STORE_URL} target="_blank" rel="noreferrer" className="transition-opacity hover:opacity-85">
                <img src={playStoreBadge} alt="Get it on Google Play" className="h-16 w-auto lg:h-20 lg:-ml-6 sm:-ml-3" />
              </a>
            </div>
          </div>

          <div className="-mt-5 flex justify-center lg:hidden">
            <img
              src={handPhoneImage}
              alt="Hand holding a phone showing the FlockText create account screen"
              className="w-[112%] translate-y-20 max-w-none object-contain sm:w-auto sm:max-w-sm"
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="hidden sm:block">
        <div className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-8 lg:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-3 text-sm font-bold tracking-widest text-primary uppercase">How it works</div>
            <h2 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Send your message in 4 simple steps
            </h2>
          </div>

          <div className="mx-auto mt-14 grid max-w-5xl gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((item, i) => (
              <div key={item.title} className="relative text-center">
                {i < steps.length - 1 ? (
                  <div className="absolute top-8 left-1/2 hidden h-px w-full border-t border-dashed border-border lg:block" />
                ) : null}
                <div className="relative mx-auto flex size-16 items-center justify-center rounded-full bg-primary/10">
                  <item.icon className="size-6 text-primary" />
                  <span className="absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                    {item.step}
                  </span>
                </div>
                <div className="mt-4 text-lg font-bold text-foreground">{item.title}</div>
                <p className="mt-1.5 text-base leading-relaxed text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-t border-border bg-card/60">
        <div className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-8 lg:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-3 text-sm font-bold tracking-widest text-primary uppercase">Pricing</div>
            <h2 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Simple, pay-as-you-go pricing
            </h2>
            <p className="mt-4 text-xl text-muted-foreground">
              Buy SMS credits once and spend them on your own schedule. No monthly contracts, no locked features.
            </p>
          </div>

          <div className="mx-auto mt-14 max-w-6xl">
            <PackageGrid />
          </div>

          <div className="mt-10 text-center">
            <Button variant="outline" className="rounded-full px-6" render={<Link to="/pricing" />}>
              See full pricing
              <ArrowRight data-icon="inline-end" className="size-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section>
        <div className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-8 lg:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-3 text-sm font-bold tracking-widest text-primary uppercase">What our customers say</div>
            <h2 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Loved by businesses, trusted for results
            </h2>
          </div>

          <div className="mx-auto mt-14 grid max-w-6xl gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((testimonial) => (
              <div key={testimonial.quote} className="flex flex-col rounded-2xl bg-card p-7 ring-1 ring-foreground/10">
                <Quote className="size-6 text-primary/40" />
                <p className="mt-4 flex-1 text-base leading-relaxed text-foreground/80">{testimonial.quote}</p>
                <div className="mt-5 border-t border-border pt-4">
                  <div className="text-base font-bold text-foreground">{testimonial.name}</div>
                  <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-sidebar">
        <div className="pointer-events-none absolute -top-24 left-1/4 h-[300px] w-[500px] rounded-full bg-primary/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 right-1/4 h-[260px] w-[420px] rounded-full bg-sidebar-primary/10 blur-3xl" />

        <div className="relative mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-6 px-5 py-14 text-center sm:px-8 lg:flex-row lg:text-left">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-sidebar-foreground sm:text-4xl">
              Start communicating better today
            </h2>
            <p className="mt-2 max-w-xl text-base text-sidebar-foreground/60">
              Join thousands of businesses using FlockText to connect, engage and grow.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" className="h-11 rounded-full px-6 text-base" render={<Link to="/signup" />}>
              Sign up free
            </Button>
            <Button
              size="lg"
              className="h-11 rounded-full border-sidebar-foreground/20 bg-transparent px-6 text-base text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
              variant="outline"
              render={<Link to="/#download-app" />}
            >
              <Download data-icon="inline-start" className="size-4" />
              Download App
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
