// Best-effort split for prefilling first/last name inputs from an existing
// full name (contacts created before firstName/lastName were captured).
export function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  return { firstName: parts[0] || '', lastName: parts.slice(1).join(' ') };
}

// Contacts with no real name get the phone number itself as `name` (see
// api/services/contactImport.js / contactController.js) so the required DB
// field is never blank. Anywhere that's rendered as its own "name" field,
// showing the phone number again is just a confusing duplicate of the phone
// field sitting right next to it - this treats that fallback as empty instead.
export function displayName(name: string, phone: string): string {
  return name === phone ? '' : name;
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}
