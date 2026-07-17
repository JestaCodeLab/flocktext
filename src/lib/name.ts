// Best-effort split for prefilling first/last name inputs from an existing
// full name (contacts created before firstName/lastName were captured).
export function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  return { firstName: parts[0] || '', lastName: parts.slice(1).join(' ') };
}
