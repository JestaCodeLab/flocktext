import { blogPosts } from '@/pages/marketing/data/blog';

export const SITE_URL = 'https://www.flocktext.com';

export interface RouteSeo {
  title: string;
  description: string;
  url: string;
  image: string;
  imageWidth: number;
  imageHeight: number;
  // Blog-only extras: og:type defaults to "website" when omitted; jsonLd is
  // baked into a <script type="application/ld+json"> by prerender.mjs (and
  // mirrored client-side by <Seo>) for search-engine structured data.
  type?: 'website' | 'article';
  publishedTime?: string;
  jsonLd?: Record<string, unknown>;
}

// Single source of truth for per-route SEO/OpenGraph copy — read by both
// entry-server.tsx (prerender, authoritative for crawlers) and each page's
// <Seo> call (client-side nav fallback), so the two can't drift apart.
// `image` and `url` are absolute (not root-relative) since the Open Graph
// spec requires absolute URLs for og:image, and link-unfurlers are
// inconsistent about resolving relative ones.
export const routeSeo: Record<string, RouteSeo> = {
  '/': {
    title: 'FlockText | Bulk SMS for Businesses & Churches in Ghana',
    description:
      'Bulk SMS for Ghana businesses & churches. Automate birthdays, schedule sends, and track delivery in real time.',
    url: `${SITE_URL}/`,
    image: `${SITE_URL}/og/og-home.png`,
    imageWidth: 1734,
    imageHeight: 907,
  },
  '/pricing': {
    title: 'FlockText | Bulk SMS Pricing for Ghana Businesses',
    description:
      'Pay-as-you-go SMS credit pricing for Ghana businesses. No subscriptions, no locked features — buy credits, send anytime.',
    url: `${SITE_URL}/pricing`,
    image: `${SITE_URL}/og/og-pricing.png`,
    imageWidth: 1731,
    imageHeight: 909,
  },
  '/terms': {
    title: 'FlockText | Terms & Conditions',
    description: 'The terms and conditions governing your use of the FlockText bulk SMS platform.',
    url: `${SITE_URL}/terms`,
    image: `${SITE_URL}/og/og-home.png`,
    imageWidth: 1734,
    imageHeight: 907,
  },
  '/privacy': {
    title: 'FlockText | Privacy Policy',
    description: 'How FlockText collects, uses, and protects your information and the contact data you upload.',
    url: `${SITE_URL}/privacy`,
    image: `${SITE_URL}/og/og-home.png`,
    imageWidth: 1734,
    imageHeight: 907,
  },
  '/support': {
    title: 'FlockText | Support',
    description: 'Get help with your FlockText account, messages, and billing — contact us by email, phone, or WhatsApp.',
    url: `${SITE_URL}/support`,
    image: `${SITE_URL}/og/og-home.png`,
    imageWidth: 1734,
    imageHeight: 907,
  },
  '/businesses': {
    title: 'FlockText | Bulk SMS for Businesses — SMS Marketing Ghana',
    description:
      'Business text messaging for retail, restaurants, salons, clinics, SMEs, and real estate in Ghana. Send promotions, order updates, and appointment reminders customers actually open. Pay-as-you-go.',
    url: `${SITE_URL}/businesses`,
    image: `${SITE_URL}/og/og-business.png`,
    imageWidth: 1448,
    imageHeight: 1086,
  },
  '/churches': {
    title: 'FlockText | SMS Software for Churches & Congregations in Ghana',
    description:
      'Stay connected with your congregation between Sundays. Service reminders, event announcements, and automated birthday texts.',
    url: `${SITE_URL}/churches`,
    image: `${SITE_URL}/og/og-church.png`,
    imageWidth: 1448,
    imageHeight: 1086,
  },
  '/schools': {
    title: 'FlockText | Bulk SMS for Schools in Ghana',
    description:
      'SMS software for schools and institutions in Ghana. Send exam timetables and lecture updates to students, fee reminders to parents, and campus alerts to everyone.',
    url: `${SITE_URL}/schools`,
    image: `${SITE_URL}/og/og-school.jpg`,
    imageWidth: 1200,
    imageHeight: 630,
  },
  '/blog': {
    title: 'FlockText | Blog — Bulk SMS Tips for Ghana Businesses & Churches',
    description:
      'Practical guides on bulk SMS marketing, congregation communication, and getting the most value from every SMS credit in Ghana.',
    url: `${SITE_URL}/blog`,
    image: `${SITE_URL}/og/og-home.png`,
    imageWidth: 1734,
    imageHeight: 907,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Blog',
      name: 'FlockText Blog',
      url: `${SITE_URL}/blog`,
      publisher: { '@type': 'Organization', name: 'FlockText', url: SITE_URL },
      blogPost: blogPosts.map((post) => ({
        '@type': 'BlogPosting',
        headline: post.title,
        description: post.description,
        url: `${SITE_URL}/blog/${post.slug}`,
        datePublished: post.date,
      })),
    },
  },
};

// One SEO entry per blog post, keyed by its slug route - generated from the
// posts themselves so a new file dropped into content/blog is automatically
// prerendered (see prerenderRoutes below) without a manual seo.ts edit.
for (const post of blogPosts) {
  routeSeo[`/blog/${post.slug}`] = {
    title: `FlockText Blog | ${post.title}`,
    description: post.description,
    url: `${SITE_URL}/blog/${post.slug}`,
    image: `${SITE_URL}/og/og-home.png`,
    imageWidth: 1734,
    imageHeight: 907,
    type: 'article',
    publishedTime: post.date,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.description,
      image: `${SITE_URL}/og/og-home.png`,
      datePublished: post.date,
      dateModified: post.date,
      url: `${SITE_URL}/blog/${post.slug}`,
      mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}/blog/${post.slug}` },
      author: { '@type': 'Organization', name: 'FlockText', url: SITE_URL },
      publisher: {
        '@type': 'Organization',
        name: 'FlockText',
        logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo/flocktext-logo.png` },
      },
    },
  };
}
