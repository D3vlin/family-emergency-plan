export function formatPhoneForDisplay(phone: string): string {
  const trimmed = phone.trim();
  const digitsOnly = trimmed.replace(/[\s-]/g, "");
  if (/^\d{10}$/.test(digitsOnly)) {
    return `${digitsOnly.slice(0, 3)} ${digitsOnly.slice(3, 6)} ${digitsOnly.slice(6)}`;
  }
  return trimmed.replace(/\s+/g, " ");
}

export function sanitizePhoneInput(value: string): string {
  return value.replace(/[^0-9+\-\s]/g, "");
}
