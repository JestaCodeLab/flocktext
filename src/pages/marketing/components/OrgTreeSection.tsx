import { Link } from 'react-router-dom';
import { ArrowRight, CircleCheck, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface OrgTreeBranch {
  icon: LucideIcon;
  label: string;
}

export interface OrgTreeSectionProps {
  kicker: string;
  heading: string;
  description: string;
  highlights: string[];
  rootLabel: string;
  rootIcon: LucideIcon;
  branches: OrgTreeBranch[];
  ctaLabel: string;
  ctaTo: string;
  isAuthed: boolean;
}

// The visual centerpiece for the multi-organization capability: a root
// "account" node connected to several branch/client/campus nodes, styled as
// an org chart. Shared across the Businesses/Churches/Schools/Agencies
// solution pages so the tree itself (and its "bigger than a feature card"
// treatment) stays identical — only the labels and copy change per audience.
export function OrgTreeSection({
  kicker,
  heading,
  description,
  highlights,
  rootLabel,
  rootIcon: RootIcon,
  branches,
  ctaLabel,
  ctaTo,
  isAuthed,
}: OrgTreeSectionProps) {
  return (
    <section className="relative overflow-hidden border-t border-border bg-sidebar">
      <div className="pointer-events-none absolute -top-24 left-1/3 h-[340px] w-[560px] rounded-full bg-primary/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 right-1/4 h-[280px] w-[440px] rounded-full bg-sidebar-primary/10 blur-3xl" />

      <div className="relative mx-auto w-full max-w-7xl px-5 py-20 sm:px-8 lg:py-28">
        <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
          <div>
            <div className="mb-3 text-sm font-bold tracking-widest text-primary uppercase">{kicker}</div>
            <h2 className="text-3xl font-bold tracking-tight text-sidebar-foreground sm:text-5xl">{heading}</h2>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-sidebar-foreground/65">{description}</p>
            <div className="mt-6 space-y-3">
              {highlights.map((point) => (
                <div key={point} className="flex items-start gap-2.5 text-base text-sidebar-foreground/80">
                  <CircleCheck className="mt-0.5 size-4 shrink-0 text-success" />
                  {point}
                </div>
              ))}
            </div>
            <Button
              size="lg"
              className="mt-8 h-12 rounded-full px-7 text-base"
              render={<Link to={isAuthed ? '/app' : ctaTo} />}
            >
              {isAuthed ? 'Go to dashboard' : ctaLabel}
              <ArrowRight data-icon="inline-end" className="size-4" />
            </Button>
          </div>

          <div className="rounded-3xl bg-card p-8 shadow-xl shadow-foreground/10 ring-1 ring-foreground/10 sm:p-10">
            <div className="mx-auto flex w-fit items-center gap-2.5 rounded-2xl border-2 border-primary bg-primary/10 px-5 py-3">
              <RootIcon className="size-5 shrink-0 text-primary" />
              <span className="font-bold text-foreground">{rootLabel}</span>
            </div>

            <div className="mx-auto h-8 w-px bg-border" />

            <div className="flex flex-wrap justify-center gap-x-3 gap-y-8 border-t border-border pt-8">
              {branches.map((b) => (
                <div
                  key={b.label}
                  className="relative flex items-center gap-2 rounded-xl bg-secondary/70 px-3.5 py-2.5 text-sm font-medium text-foreground before:absolute before:-top-8 before:left-1/2 before:h-8 before:w-px before:-translate-x-1/2 before:bg-border"
                >
                  <b.icon className="size-4 shrink-0 text-primary" />
                  {b.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
