import { z } from 'zod';

/**
 * Normalizes an Indian mobile number to its 10 digits, so "+91 98765 43210",
 * "098765-43210" and "9876543210" are the same login. Null if it isn't one.
 */
export function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/[\s-]/g, '').replace(/^(\+91|0)/, '');
  return /^[6-9]\d{9}$/.test(digits) ? digits : null;
}

/** zod field for a required Indian mobile number; the parsed value is the 10 digits. */
export const phoneField = z.string({ error: 'Enter your mobile number.' }).transform((v, ctx) => {
  const phone = normalizePhone(v);
  if (!phone) {
    ctx.addIssue({ code: 'custom', message: 'Enter a 10-digit mobile number.' });
    return z.NEVER;
  }
  return phone;
});
