import { Link } from 'react-router-dom';
import { ArrowRight, Clock } from 'lucide-react';
import { Seo } from '@/pages/marketing/components/Seo';
import { blogPosts, formatBlogDate } from '@/pages/marketing/data/blog';
import { routeSeo } from '@/pages/marketing/data/seo';

export function BlogPage() {
  return (
    <>
      <Seo {...routeSeo['/blog']} />

      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-32 left-1/2 h-[420px] w-[680px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />

        <div className="relative mx-auto w-full max-w-7xl px-5 pt-16 pb-20 sm:px-8 lg:pt-24 lg:pb-24">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-3 text-sm font-bold tracking-widest text-primary uppercase">Blog</div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
              Bulk SMS insights for Ghanaian businesses & churches
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
              Practical guides on SMS marketing, congregation communication, and getting the most out of every
              credit.
            </p>
          </div>

          <div className="mx-auto mt-14 grid max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {blogPosts.map((post) => (
              <Link
                key={post.slug}
                to={`/blog/${post.slug}`}
                className="group flex flex-col overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-foreground/5"
              >
                <img
                  src={post.image}
                  alt={post.title}
                  width={1536}
                  height={1024}
                  className="aspect-[4/3] w-full object-cover"
                />
                <div className="flex flex-1 flex-col p-6">
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <time dateTime={post.date}>{formatBlogDate(post.date)}</time>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="size-3.5" />
                      {post.readingTime} min read
                    </span>
                  </div>
                  <h2 className="mt-2.5 text-lg font-bold text-foreground">{post.title}</h2>
                  <p className="mt-1.5 flex-1 text-base leading-relaxed text-muted-foreground">{post.description}</p>
                  <div className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                    Read more
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
