import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Home, LifeBuoy } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Not part of routeSeo/prerenderRoutes - "*" has no single canonical URL to
// prerender, so title/robots are set directly here instead of via <Seo>.
// noindex keeps a dead link from ever ranking; removed on unmount so it
// doesn't leak into whatever page the user navigates to next.
export function NotFoundPage() {
  useEffect(() => {
    document.title = 'FlockText | Page Not Found';
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex';
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);

  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute -top-32 left-1/2 h-[420px] w-[680px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />

      <div className="relative mx-auto flex w-full max-w-2xl flex-col items-center px-5 py-24 text-center sm:px-8 lg:py-32">
        <div className="text-sm font-bold tracking-widest text-primary uppercase">Error 404</div>
        <h1 className="mt-3 text-5xl font-bold tracking-tight text-foreground sm:text-7xl">Page not found</h1>
        <p className="mt-5 max-w-md text-lg leading-relaxed text-muted-foreground">
          The page you're looking for doesn't exist or may have moved. Check the URL, or head back to somewhere
          useful.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" className="rounded-full px-6" render={<Link to="/" />}>
            <Home data-icon="inline-start" className="size-4" />
            Back to home
          </Button>
          <Button size="lg" variant="outline" className="rounded-full px-6" render={<Link to="/support" />}>
            <LifeBuoy data-icon="inline-start" className="size-4" />
            Contact support
          </Button>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <Link to="/blog" className="inline-flex items-center gap-1 transition-colors hover:text-foreground">
            Visit the blog
            <ArrowRight className="size-3.5" />
          </Link>
          <Link to="/pricing" className="transition-colors hover:text-foreground">
            Pricing
          </Link>
          <Link to="/churches" className="transition-colors hover:text-foreground">
            For Churches
          </Link>
          <Link to="/businesses" className="transition-colors hover:text-foreground">
            For Businesses
          </Link>
        </div>
      </div>
    </section>
  );
}
