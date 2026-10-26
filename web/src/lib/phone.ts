/** Same rule as api/src/auth/phone.ts: a 10-digit Indian mobile, or null. */
export function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/[\s-]/g, '').replace(/^(\+91|0)/, '');
  return /^[6-9]\d{9}$/.test(digits) ? digits : null;
}
