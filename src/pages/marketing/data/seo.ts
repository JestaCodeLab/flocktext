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
    title: 'FlockText | Bulk SMS Platforms for Businesses & Churches in Ghana',
    description:
      'FlockText is a bulk SMS platform built for businesses, churches, and institutions in Ghana. Organize contacts into groups, automate birthday messages, schedule recurring campaigns, send from your own custom sender ID, and track delivery in real time — from an easy-to-use dashboard or a REST API, with pay-as-you-go credits that never sit behind a subscription.',
    image: '/og/og-home.png',
    imageWidth: 1734,
    imageHeight: 907,
  },
  '/pricing': {
    title: 'FlockText | Bulk SMS Pricing & Credit Plans for Ghana Businesses',
    description:
      "See FlockText's transparent, pay-as-you-go SMS credit pricing for businesses, churches, and institutions in Ghana. No subscriptions, no contracts, and no locked features — buy credits once, spend them on your own schedule, and unlock a lower per-SMS rate at every higher tier.",
    image: '/og/og-pricing.png',
    imageWidth: 1731,
    imageHeight: 909,
  },
};
