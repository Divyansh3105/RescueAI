import { describe, expect, it } from 'vitest';
import { normalizePhone } from './phone';

describe('normalizePhone', () => {
  it('matches the API: strips +91, a leading 0, spaces and dashes', () => {
    expect(normalizePhone('+91 98765 43210')).toBe('9876543210');
    expect(normalizePhone('098765-43210')).toBe('9876543210');
    expect(normalizePhone('5876543210')).toBeNull();
  });
});
