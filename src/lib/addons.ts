import { useQuery } from '@tanstack/react-query';
import { fetchAddons } from '@/api/addons';

/** Cache key for one account's addon entitlements. Lives here so the components
 *  that read entitlements and the ones that invalidate after a purchase can't
 *  disagree about its shape. */
export function addonsQueryKey(organizationId?: string) {
  return ['addons', organizationId ?? 'active'] as const;
}

// Shared by the birthday paywall and the team seat gate, so the catalog +
// entitlements are fetched once and cached per account. Omit organizationId to
// target whichever account the app is currently switched into.
export function useAddonEntitlements(organizationId?: string) {
  return useQuery({
    queryKey: addonsQueryKey(organizationId),
    queryFn: () => fetchAddons(organizationId),
  });
}
