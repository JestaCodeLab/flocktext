import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Check, MessageCircle } from 'lucide-react';
import { fetchPublicPackages } from '@/api/public';
import { fallbackPackages } from '@/pages/marketing/data/packages';
import { WHATSAPP_URL } from '@/pages/marketing/data/contact';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Seo } from '@/pages/marketing/components/Seo';
import { routeSeo } from '@/pages/marketing/data/seo';

const includedFeatures = [
  'REST API access',
  'Contact groups & birthday automation',
  'Scheduled & recurring sends',
  'Custom sender ID',
  'Delivery reports',
  'Team member accounts',
  'Self-service join links',
  'Message templates',
];

export function PricingPage() {
  const { data: packages } = useQuery({
    queryKey: ['public', 'packages'],
    queryFn: fetchPublicPackages,
    initialData: fallbackPackages,
    staleTime: 60_000,
  });

  return (
    <>
      <Seo {...routeSeo['/pricing']} />

      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-32 left-1/2 h-[420px] w-[680px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />

        <div className="relative mx-auto w-full max-w-7xl px-5 pt-16 pb-20 sm:px-8 lg:pt-24 lg:pb-24">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-3 text-xs font-bold tracking-widest text-primary uppercase">Pricing</div>
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Simple, pay-as-you-go pricing
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
              Buy SMS credits once and spend them on your own schedule. No monthly contracts, no locked features —
              everything FlockText offers is available the moment you sign up.
            </p>
          </div>

          <div className="mx-auto mt-14 grid max-w-6xl gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {packages.map((pkg) => {
              const perCredit = pkg.ghs / pkg.credits;
              const popular = pkg.badge === 'Most popular';
              return (
                <div
                  key={pkg.label}
                  className={cn(
                    'relative flex flex-col rounded-2xl p-7 transition-all',
                    popular
                      ? 'bg-sidebar text-sidebar-foreground shadow-xl shadow-foreground/10 ring-1 ring-sidebar-border lg:-translate-y-2'
                      : 'bg-card ring-1 ring-foreground/10 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-foreground/5'
                  )}
                >
                  {pkg.badge ? (
                    <span
                      className={cn(
                        'absolute -top-3 left-7 rounded-full px-3 py-1 text-xs font-bold',
                        popular
                          ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                          : 'bg-secondary text-secondary-foreground ring-1 ring-foreground/10'
                      )}
                    >
                      {pkg.badge}
                    </span>
                  ) : null}

                  <div className={cn('text-sm font-bold', popular ? 'text-sidebar-primary' : 'text-primary')}>
                    {pkg.label}
                  </div>

                  <div className="mt-3 flex items-baseline gap-1.5">
                    <span className="text-[40px] leading-none font-bold tracking-tight">GHS {pkg.ghs}</span>
                  </div>

                  <div className={cn('mt-3 text-sm', popular ? 'text-sidebar-foreground/70' : 'text-muted-foreground')}>
                    <span className={cn('font-semibold', popular ? 'text-sidebar-foreground' : 'text-foreground')}>
                      {pkg.credits.toLocaleString()}
                    </span>{' '}
                    SMS credits
                  </div>
                  <div className={cn('mt-1 text-xs', popular ? 'text-sidebar-foreground/50' : 'text-muted-foreground')}>
                    ≈ GHS {perCredit.toFixed(3)} per credit
                  </div>

                  <Button
                    className={cn('mt-7 w-full rounded-full', !popular && 'bg-foreground text-background hover:bg-foreground/85')}
                    render={<Link to="/signup" />}
                  >
                    Get started
                    <ArrowRight data-icon="inline-end" className="size-4" />
                  </Button>
                </div>
              );
            })}
          </div>

          <div className="mx-auto mt-20 max-w-4xl rounded-2xl bg-card p-8 ring-1 ring-foreground/10 sm:p-10">
            <div className="text-center">
              <h2 className="text-xl font-bold text-foreground">Everything included, on every plan</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                No locked features, no upgrade walls — credits are the only thing you pay for.
              </p>
            </div>
            <div className="mt-8 grid gap-x-8 gap-y-3.5 sm:grid-cols-2">
              {includedFeatures.map((item) => (
                <div key={item} className="flex items-start gap-2.5 text-sm text-foreground/80">
                  <span className="mt-0.5 flex size-4.5 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
                    <Check className="size-3" />
                  </span>
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-14 text-center">
            <p className="text-muted-foreground">Need a custom volume or a reseller arrangement?</p>
            <Button
              variant="outline"
              className="mt-4 rounded-full px-6"
              render={<a href={WHATSAPP_URL} target="_blank" rel="noreferrer" />}
            >
              <MessageCircle data-icon="inline-start" className="size-4 text-success" />
              Chat with us on WhatsApp
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
