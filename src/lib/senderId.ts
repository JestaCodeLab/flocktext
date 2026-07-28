// BMS Africa sender IDs: letters and numbers only (any case), no spaces or
// punctuation, max 11 chars - strip anything else as the user types instead of
// rejecting on submit, mirrors the backend's validators/shared.js senderIdSchema.
export function formatSenderIdInput(value: string) {
  return value.replace(/[^A-Za-z0-9]/g, '').slice(0, 11);
}
