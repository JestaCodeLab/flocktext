export const SITE_URL = 'https://www.flocktext.com';

export interface RouteSeo {
  title: string;
  description: string;
  url: string;
  image: string;
  imageWidth: number;
  imageHeight: number;
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
};
