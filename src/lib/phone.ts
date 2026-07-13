export function formatPhoneInput(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 10);
  const parts = [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6, 10)].filter(Boolean);
  return parts.join(' ');
}

export function normalizePhone(phone: string) {
  return phone.replace(/\D/g, '');
}
