import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface FeatureAnnouncementSlide {
  kind: 'image' | 'video' | 'icon';
  url?: string;
  icon?: LucideIcon;
  alt?: string;
}

export interface FeatureAnnouncementLink {
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: 'default' | 'outline';
}

interface FeatureAnnouncementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtext: string;
  slides?: FeatureAnnouncementSlide[];
  links?: FeatureAnnouncementLink[];
}

// Generic "what's new" style modal - a media panel (carousel of images, a single
// video, or a plain icon) above a title/subtext block and up to a few action
// links. Used both for the hardcoded sender-ID explainer on ComposePage and for
// admin-authored "Feature" announcements broadcast from the super admin console.
export function FeatureAnnouncementModal({ open, onOpenChange, title, subtext, slides = [], links = [] }: FeatureAnnouncementModalProps) {
  const [index, setIndex] = useState(0);
  const slide = slides[index];

  function go(delta: number) {
    setIndex((i) => (i + delta + slides.length) % slides.length);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setIndex(0);
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-[calc(100%-2rem)] gap-0 overflow-hidden p-0 sm:max-w-[420px]">
        {slide && (
          <div className="relative flex h-[200px] items-center justify-center overflow-hidden bg-gradient-to-br from-primary/15 to-primary/5">
            {slide.kind === 'image' && slide.url && (
              <img src={slide.url} alt={slide.alt ?? ''} className="h-full w-full object-cover" />
            )}
            {slide.kind === 'video' && slide.url && (
              // eslint-disable-next-line jsx-a11y/media-has-caption
              <video src={slide.url} className="h-full w-full object-cover" controls autoPlay muted loop />
            )}
            {slide.kind === 'icon' && slide.icon && <slide.icon className="h-16 w-16 text-primary" strokeWidth={1.5} />}

            {slides.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => go(-1)}
                  aria-label="Previous"
                  className="absolute top-1/2 left-2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-background/80 text-foreground shadow hover:bg-background"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => go(1)}
                  aria-label="Next"
                  className="absolute top-1/2 right-2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-background/80 text-foreground shadow hover:bg-background"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <div className="absolute bottom-2.5 left-1/2 flex -translate-x-1/2 gap-1.5">
                  {slides.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      aria-label={`Go to slide ${i + 1}`}
                      onClick={() => setIndex(i)}
                      className={cn('h-1.5 rounded-full transition-all', i === index ? 'w-4 bg-primary' : 'w-1.5 bg-primary/30')}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        <div className="space-y-2 p-6">
          <div className="font-heading text-lg leading-tight font-bold">{title}</div>
          <div className="text-sm text-muted-foreground">{subtext}</div>
        </div>

        {links.length > 0 && (
          <div className="-mx-0 flex flex-col-reverse gap-2.5 border-t border-border bg-muted/50 p-5 sm:flex-row sm:justify-end">
            {links.map((link, i) => {
              const variant = link.variant ?? (i === links.length - 1 ? 'default' : 'outline');
              return link.href ? (
                <Button key={i} variant={variant} render={<a href={link.href} target="_blank" rel="noreferrer" />}>
                  {link.label}
                </Button>
              ) : (
                <Button key={i} variant={variant} onClick={link.onClick}>
                  {link.label}
                </Button>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
