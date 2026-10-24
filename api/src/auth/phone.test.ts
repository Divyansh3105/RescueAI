import { describe, expect, it } from 'vitest';
import { normalizePhone } from './phone.js';

describe('normalizePhone', () => {
  it('accepts a bare number and strips +91, a leading 0, spaces and dashes', () => {
    expect(normalizePhone('9876543210')).toBe('9876543210');
    expect(normalizePhone('+91 98765 43210')).toBe('9876543210');
    expect(normalizePhone('098765-43210')).toBe('9876543210');
  });

  it('rejects short numbers and numbers not starting 6-9', () => {
    expect(normalizePhone('12345')).toBeNull();
    expect(normalizePhone('5876543210')).toBeNull();
  });
});
