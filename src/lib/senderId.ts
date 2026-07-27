// BMS Africa sender IDs: uppercase letters and numbers only, no spaces or
// punctuation, max 11 chars - strip anything else as the user types instead of
// rejecting on submit, mirrors the backend's validators/shared.js senderIdSchema.
export function formatSenderIdInput(value: string) {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 11);
}
