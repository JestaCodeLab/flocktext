import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarClock, CircleCheck, FileText, HandCoins, Megaphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';
import { Seo } from '@/pages/marketing/components/Seo';
import { FaqList } from '@/pages/marketing/components/FaqList';
import { routeSeo } from '@/pages/marketing/data/seo';
import { sharedFaqs } from '@/pages/marketing/data/faq';
import adminImage from '@/assets/images/schools.png';
import idCardImage from '@/assets/images/school-card.png';
import examsImage from '@/assets/images/school-exams.png';

const heroSlides = [
  { image: adminImage, alt: 'School administrator sending SMS updates to parents from FlockText' },
  { image: idCardImage, alt: 'Student reading an SMS notification that their ID card is ready for collection' },
  { image: examsImage, alt: 'Student checking an SMS exam timetable notification in the library' },
];

const parentHighlights = [
  'Automated fee reminders before every term’s deadline',
  'Instant closure and emergency alerts',
  'No portal login required — it just lands as a text',
];

const studentHighlights = [
  'Exam timetables and results sent the moment they’re ready',
  'Instant alerts for cancelled or rescheduled lectures',
  'Reaches every student directly, no app required',
];

const useCases = [
  {
    icon: FileText,
    title: 'Exam timetables & results',
    description: 'Notify students the moment exam timetables, venue changes, or results are published.',
    chip: 'bg-chart-2/15 text-chart-2',
  },
  {
    icon: CalendarClock,
    title: 'Lecture & class changes',
    description: 'Reach students instantly when a lecture is cancelled, rescheduled, or moved to a new venue.',
    chip: 'bg-chart-3/15 text-chart-3',
  },
  {
    icon: HandCoins,
    title: 'Fee & payment reminders',
    description: 'Automate fee due-date reminders to parents and cut down on late payments.',
    chip: 'bg-chart-4/15 text-chart-4',
  },
  {
    icon: Megaphone,
    title: 'Campus alerts & closures',
    description: 'Send closures and urgent announcements to students, parents, and staff all at once.',
    chip: 'bg-chart-1/15 text-chart-1',
  },
];

const schoolsFaqs = [
  {
    question: 'How do schools and institutions in Ghana send bulk SMS to students and parents?',
    answer:
      'Import student, parent, and staff phone numbers into FlockText, group them by class, department, or level, then compose and send — or schedule a message for later, like a fee reminder ahead of term or an exam timetable release. Delivery reports confirm who received it.',
  },
  ...sharedFaqs,
];

export function SchoolsPage() {
  const isAuthed = useAuthStore((s) => Boolean(s.accessToken));
  const [heroSlide, setHeroSlide] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setHeroSlide((i) => (i + 1) % heroSlides.length), 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      <Seo {...routeSeo['/schools']} />

      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-32 right-0 h-[420px] w-[560px] rounded-full bg-primary/10 blur-3xl" />

        <div className="relative mx-auto w-full max-w-7xl px-5 pt-14 pb-16 sm:px-8 sm:pt-20 sm:pb-20 lg:pt-24">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <div>
              <div className="mb-3 text-sm font-bold tracking-widest text-primary uppercase">For Schools</div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
                SMS Platform for Schools in Ghana
              </h1>
              <p className="mt-6 max-w-lg text-base leading-relaxed text-muted-foreground">
                Reach students, parents, and staff the moment it matters. FlockText helps schools and institutions
                in Ghana send exam timetables and lecture updates to students, fee reminders to parents, and
                campus alerts to everyone — no app to download, no portal to check.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button size="lg" className="h-12 rounded-full px-7 text-base" render={<Link to={isAuthed ? '/app' : '/signup'} />}>
                  {isAuthed ? 'Go to dashboard' : 'Reach Your School Instantly'}
                  <ArrowRight data-icon="inline-end" className="size-4" />
                </Button>
                <Button size="lg" variant="outline" className="h-12 rounded-full px-7 text-base" render={<Link to="/pricing" />}>
                  See pricing
                </Button>
              </div>
            </div>
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl shadow-xl shadow-foreground/5 ring-1 ring-foreground/10">
              {heroSlides.map((slide, i) => (
                <img
                  key={slide.image}
                  src={slide.image}
                  alt={slide.alt}
                  width={1536}
                  height={1024}
                  className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${i === heroSlide ? 'opacity-100' : 'opacity-0'}`}
                />
              ))}
              <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5">
                {heroSlides.map((slide, i) => (
                  <span
                    key={slide.image}
                    className={`h-1.5 rounded-full transition-all ${i === heroSlide ? 'w-4 bg-white' : 'w-1.5 bg-white/60'}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-card/60">
        <div className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-8 lg:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-3 text-sm font-bold tracking-widest text-primary uppercase">Built for schools</div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
              Every message that keeps your school connected
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
              src={adminImage}
              alt="School administrator sending SMS updates to parents from FlockText"
              width={1536}
              height={1024}
              className="aspect-[4/3] w-full rounded-3xl object-cover ring-1 ring-foreground/10"
            />
            <div>
              <div className="mb-3 text-sm font-bold tracking-widest text-primary uppercase">For Parents</div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-4xl">
                Stay informed without logging into a portal
              </h2>
              <p className="mt-5 text-base leading-relaxed text-muted-foreground">
                Between work and school runs, parents don't always have time to check a portal or read a long
                email — but a text gets seen. Fee reminders, closure notices, and updates land directly on their
                phone.
              </p>
              <div className="mt-6 space-y-3">
                {parentHighlights.map((point) => (
                  <div key={point} className="flex items-start gap-2.5 text-base text-foreground/80">
                    <CircleCheck className="mt-0.5 size-4 shrink-0 text-success" />
                    {point}
                  </div>
                ))}
              </div>
              <Button className="mt-7 h-11 rounded-full px-6 text-base" render={<Link to={isAuthed ? '/app' : '/signup'} />}>
                {isAuthed ? 'Go to dashboard' : 'Reach Your Parents Instantly'}
                <ArrowRight data-icon="inline-end" className="size-4" />
              </Button>
            </div>
          </div>

          <div className="mt-16 grid items-center gap-10 border-t border-border pt-16 lg:grid-cols-2 lg:gap-16">
            <img
              src={examsImage}
              alt="Student checking an SMS exam timetable notification in the library"
              width={1536}
              height={1024}
              className="aspect-[4/3] w-full rounded-3xl object-cover ring-1 ring-foreground/10 lg:order-2"
            />
            <div className="lg:order-1">
              <div className="mb-3 text-sm font-bold tracking-widest text-primary uppercase">For Students</div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-4xl">
                Reach students who don't check the noticeboard
              </h2>
              <p className="mt-5 text-base leading-relaxed text-muted-foreground">
                Whether it's a cancelled lecture or a freshly published exam timetable, students get the news the
                moment it's sent — no waiting to walk past a noticeboard or log into the student portal.
              </p>
              <div className="mt-6 space-y-3">
                {studentHighlights.map((point) => (
                  <div key={point} className="flex items-start gap-2.5 text-base text-foreground/80">
                    <CircleCheck className="mt-0.5 size-4 shrink-0 text-success" />
                    {point}
                  </div>
                ))}
              </div>
              <Button className="mt-7 h-11 rounded-full px-6 text-base" render={<Link to={isAuthed ? '/app' : '/signup'} />}>
                {isAuthed ? 'Go to dashboard' : 'Reach Your Students Instantly'}
                <ArrowRight data-icon="inline-end" className="size-4" />
              </Button>
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
          <FaqList items={schoolsFaqs} />
        </div>
      </section>

      <section className="relative overflow-hidden bg-sidebar">
        <div className="pointer-events-none absolute -top-24 left-1/4 h-[300px] w-[500px] rounded-full bg-primary/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 right-1/4 h-[260px] w-[420px] rounded-full bg-sidebar-primary/10 blur-3xl" />

        <div className="relative mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-6 px-5 py-14 text-center sm:px-8 lg:flex-row lg:text-left">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-sidebar-foreground sm:text-4xl">
              Keep students and staff in the loop
            </h2>
            <p className="mt-2 max-w-xl text-base text-sidebar-foreground/60">
              Join schools across Ghana using FlockText to reach everyone instantly.
            </p>
          </div>
          <Button size="lg" className="h-11 rounded-full px-6 text-base" render={<Link to={isAuthed ? '/app' : '/signup'} />}>
            {isAuthed ? 'Go to dashboard' : 'Reach Your School Instantly'}
            <ArrowRight data-icon="inline-end" className="size-4" />
          </Button>
        </div>
      </section>
    </>
  );
}
