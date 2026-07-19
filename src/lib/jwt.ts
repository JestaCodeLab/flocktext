// Reads a JWT's exp claim for UI purposes only (e.g. countdown timers) -
// never trust this for security, the server independently enforces expiry.
export function decodeJwtExpMs(token: string): number | null {
  try {
    const payload = token.split('.')[1];
    const json = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return typeof json.exp === 'number' ? json.exp * 1000 : null;
  } catch {
    return null;
  }
}
