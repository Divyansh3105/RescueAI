/**
 * Normalizes an Indian mobile number to its 10 digits, so "+91 98765 43210",
 * "098765-43210" and "9876543210" are the same login. Null if it isn't one.
 */
export function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/[\s-]/g, '').replace(/^(\+91|0)/, '');
  return /^[6-9]\d{9}$/.test(digits) ? digits : null;
}
