import { describe, expect, it } from 'vitest';
import { cn } from './utils';

describe('cn', () => {
  it('lets the last Tailwind utility win', () => {
    expect(cn('p-4', 'p-6')).toBe('p-6');
  });

  it('drops falsy class names', () => {
    const hidden = false;
    expect(cn('rounded-lg', hidden && 'hidden', 'border')).toBe('rounded-lg border');
  });
});
