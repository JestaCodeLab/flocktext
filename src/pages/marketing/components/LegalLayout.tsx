import type { ReactNode } from 'react';

interface LegalLayoutProps {
  eyebrow?: string;
  title: string;
  effectiveDate?: string;
  subtitle?: ReactNode;
  children: ReactNode;
}

export function LegalLayout({ eyebrow = 'Legal', title, effectiveDate, subtitle, children }: LegalLayoutProps) {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute -top-32 left-1/2 h-[420px] w-[680px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />

      <div className="relative mx-auto w-full max-w-3xl px-5 pt-16 pb-24 sm:px-8 lg:pt-24">
        <div className="text-center">
          <div className="mb-3 text-sm font-bold tracking-widest text-primary uppercase">{eyebrow}</div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-5xl">{title}</h1>
          {effectiveDate ? <p className="mt-4 text-base text-muted-foreground">Effective {effectiveDate}</p> : null}
          {subtitle ? <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">{subtitle}</p> : null}
        </div>

        <div className="mt-14 space-y-10">{children}</div>
      </div>
    </section>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-3">
      <h2 className="text-xl font-bold text-foreground">{title}</h2>
      <div className="space-y-3 text-base leading-relaxed text-muted-foreground">{children}</div>
    </div>
  );
}
