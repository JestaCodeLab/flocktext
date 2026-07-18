import { useQuery } from '@tanstack/react-query';
import { fetchAddons } from '@/api/addons';

// Shared by the birthday paywall and the team seat gate, so the catalog +
// entitlements are fetched once and cached under one query key.
export function useAddonEntitlements() {
  return useQuery({ queryKey: ['addons'], queryFn: fetchAddons });
}
