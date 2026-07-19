import type { PublicPackage } from '@/api/public';

/**
 * Mirrors api/scripts/seedPackages.js. Used for first paint (and the
 * build-time prerender snapshot) before the live /public/packages
 * response arrives — keep in sync if the seed data changes.
 */
export const fallbackPackages: PublicPackage[] = [
  { ghs: 20, credits: 40, label: 'Starter', badge: '' },
  { ghs: 50, credits: 110, label: 'Growth', badge: 'Most popular' },
  { ghs: 100, credits: 240, label: 'Business', badge: '' },
  { ghs: 200, credits: 520, label: 'Enterprise', badge: '' },
];
