import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Seo } from '@/pages/marketing/components/Seo';
import { formatBlogDate, getBlogPost, getRelatedPosts } from '@/pages/marketing/data/blog';
import { routeSeo } from '@/pages/marketing/data/seo';

// Styles the raw HTML `marked` renders from the post body - there's no
// typography plugin installed, so element styling is applied via descendant
// selectors on the wrapper instead of a `.prose` class.
const articleClassName =
  'max-w-none text-base leading-relaxed text-foreground/80 ' +
  '[&_h2]:mt-10 [&_h2]:mb-3 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-foreground ' +
  '[&_h3]:mt-8 [&_h3]:mb-2 [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-foreground ' +
  '[&_p]:mt-4 [&_p:first-child]:mt-0 ' +
  '[&_ul]:mt-4 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 ' +
  '[&_ol]:mt-4 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-5 ' +
  '[&_strong]:font-semibold [&_strong]:text-foreground ' +
  '[&_a]:font-medium [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 [&_a:hover]:no-underline ' +
  '[&_blockquote]:mt-4 [&_blockquote]:border-l-4 [&_blockquote]:border-primary/30 [&_blockquote]:pl-4 [&_blockquote]:italic';

export function BlogPostPage() {
  const { slug = '' } = useParams();
  const post = getBlogPost(slug);
  const seo = routeSeo[`/blog/${slug}`];

  if (!post || !seo) return <Navigate to="/blog" replace />;

  const relatedPosts = getRelatedPosts(slug);

  return (
    <>
      <Seo {...seo} />

      <article className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-32 left-1/2 h-[420px] w-[680px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />

        <div className="relative mx-auto w-full max-w-7xl px-5 pt-16 pb-24 sm:px-8 lg:pt-24">
          <Link
            to="/blog"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back to blog
          </Link>

          <div className="mt-6">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <time dateTime={post.date}>{formatBlogDate(post.date)}</time>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1">
                <Clock className="size-3.5" />
                {post.readingTime} min read
              </span>
            </div>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-5xl">{post.title}</h1>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{post.description}</p>
          </div>

          <img
            src={post.image}
            alt={post.title}
            className="mt-10 aspect-[21/9] w-full rounded-2xl object-cover ring-1 ring-foreground/10"
          />

          <div className="mt-14 grid gap-12 lg:grid-cols-[1fr_320px]">
            <div className={articleClassName} dangerouslySetInnerHTML={{ __html: post.html }} />

            <aside>
              {relatedPosts.length > 0 ? (
                <div>
                  <div className="text-sm font-bold tracking-widest text-primary uppercase">Related posts</div>
                  <div className="mt-4 space-y-4">
                    {relatedPosts.map((related) => (
                      <Link
                        key={related.slug}
                        to={`/blog/${related.slug}`}
                        className="group flex gap-3 rounded-xl p-2 transition-colors hover:bg-card"
                      >
                        <img src={related.image} alt={related.title} className="size-16 shrink-0 rounded-lg object-cover" />
                        <div className="min-w-0">
                          <div className="line-clamp-2 text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
                            {related.title}
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">{related.readingTime} min read</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="mt-8 rounded-2xl bg-sidebar p-6 text-sidebar-foreground lg:sticky lg:top-24">
                <div className="text-base font-bold">Ready to send?</div>
                <p className="mt-1.5 text-sm text-sidebar-foreground/70">
                  Start sending bulk SMS in minutes — no monthly contract.
                </p>
                <Button className="mt-4 w-full rounded-full" render={<Link to="/signup" />}>
                  Get started free
                </Button>
              </div>
            </aside>
          </div>
        </div>
      </article>
    </>
  );
}
