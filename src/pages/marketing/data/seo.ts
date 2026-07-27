export interface RouteSeo {
  title: string;
  description: string;
  image: string;
  imageWidth: number;
  imageHeight: number;
}

// Single source of truth for per-route SEO/OpenGraph copy — read by both
// entry-server.tsx (prerender, authoritative for crawlers) and each page's
// <Seo> call (client-side nav fallback), so the two can't drift apart.
export const routeSeo: Record<string, RouteSeo> = {
  '/': {
    title: 'FlockText | Bulk SMS for Businesses & Churches in Ghana',
    description:
      'Bulk SMS for Ghana businesses & churches. Automate birthdays, schedule sends, and track delivery in real time.',
    image: '/og/og-home.png',
    imageWidth: 1734,
    imageHeight: 907,
  },
  '/pricing': {
    title: 'FlockText | Bulk SMS Pricing for Ghana Businesses',
    description:
      'Pay-as-you-go SMS credit pricing for Ghana businesses. No subscriptions, no locked features — buy credits, send anytime.',
    image: '/og/og-pricing.png',
    imageWidth: 1731,
    imageHeight: 909,
  },
  '/terms': {
    title: 'FlockText | Terms & Conditions',
    description: 'The terms and conditions governing your use of the FlockText bulk SMS platform.',
    image: '/og/og-home.png',
    imageWidth: 1734,
    imageHeight: 907,
  },
  '/privacy': {
    title: 'FlockText | Privacy Policy',
    description: 'How FlockText collects, uses, and protects your information and the contact data you upload.',
    image: '/og/og-home.png',
    imageWidth: 1734,
    imageHeight: 907,
  },
};
