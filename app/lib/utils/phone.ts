/**
 * Normalize phone to 10 digits (last 10) for consistent contact lookup and URLs.
 */
export function normalizePhone(phone: string | null | undefined): string {
  if (phone == null) return "";
  const digits = String(phone).replace(/\D/g, "");
  return digits.slice(-10);
}

/**
 * Format 10-digit phone for display: (555) 123-4567
 */
export function formatPhone(phone: string | null | undefined): string {
  const digits = normalizePhone(phone);
  if (digits.length !== 10) return digits || "—";
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}
