import { describe, expect, it } from 'vitest';
import { dict } from './dictionaries';

describe('dictionaries', () => {
  it('AC24: en and hi have identical keys', () => {
    expect(Object.keys(dict.hi).sort()).toEqual(Object.keys(dict.en).sort());
  });

  it('no hi value is empty', () => {
    for (const [key, value] of Object.entries(dict.hi)) expect(value.trim(), key).not.toBe('');
  });

  it('has the sign-in strings', () => {
    expect(dict.en.signIn).toBe('Sign in');
  });
});
