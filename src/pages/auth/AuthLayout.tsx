import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const logo = '/logo/flocktext-logo.png';
const logoWhite = '/logo/flocktext-logo-white.png';

const slides = [
  {
    title: 'Reach your whole audience in seconds',
    body: 'Send reminders, announcements, and invitations to every contact group with one message.',
  },
  {
    title: 'Pay-as-you-go, credit never expires',
    body: 'Top up whenever you like via card or mobile money. No subscriptions, no surprise renewals.',
  },
  {
    title: 'Your name on every message',
    body: "We handle sender ID approval for you, so texts arrive from your organization's name, not a random number.",
  },
];

export function AuthLayout({ children, contentClassName }: { children: React.ReactNode; contentClassName?: string }) {
  const [slideIndex, setSlideIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setSlideIndex((i) => (i + 1) % slides.length), 5000);
    return () => clearInterval(timer);
  }, []);

  function go(delta: number) {
    setSlideIndex((i) => (i + delta + slides.length) % slides.length);
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-4 sm:p-8">
      <div className="flex min-h-[680px] w-full max-w-[1040px] overflow-hidden rounded-[28px] bg-card shadow-xl ring-1 ring-foreground/5">
        <div className="relative hidden w-[46%] min-w-[360px] overflow-hidden bg-foreground lg:block">
          <div className="absolute inset-0 bg-gradient-to-b from-foreground/10 via-foreground/5 to-foreground" />
          <Link to="/" className="absolute left-8 top-8 z-10">
            <img src={logoWhite} alt="FlockText" className="h-9 w-auto" />
          </Link>

          <div className="absolute inset-x-6 bottom-6 z-10 rounded-2xl bg-white/10 p-6 ring-1 ring-white/15 backdrop-blur-md">
            <div key={slideIndex} className="animate-in fade-in duration-500">
              <div className="mb-2 text-lg font-bold leading-snug text-white">{slides[slideIndex].title}</div>
              <div className="text-[14px] leading-relaxed text-white/70">{slides[slideIndex].body}</div>
            </div>
            <div className="mt-5 flex items-center justify-between">
              <div className="flex gap-1.5">
                {slides.map((_, i) => (
                  <div key={i} className={`h-1.5 rounded-full transition-all ${i === slideIndex ? 'w-6 bg-primary' : 'w-1.5 bg-white/30'}`} />
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => go(-1)}
                  aria-label="Previous"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-white ring-1 ring-white/25 transition-colors hover:bg-white/10"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => go(1)}
                  aria-label="Next"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-white ring-1 ring-white/25 transition-colors hover:bg-white/10"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className={cn('flex flex-1 items-center justify-center overflow-y-auto p-8 sm:p-12', contentClassName)}>
          <div className="w-full max-w-[380px]">
            <Link to="/" className="mb-8 block w-fit lg:hidden">
              <img src={logo} alt="FlockText" className="h-9 w-auto" />
            </Link>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
