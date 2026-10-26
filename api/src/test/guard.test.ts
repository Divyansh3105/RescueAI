import { describe, expect, it } from 'vitest';
import { assertTestDatabase } from './guard.js';

describe('assertTestDatabase', () => {
  it('allows a database whose name ends in _test', () => {
    expect(() => assertTestDatabase('postgres://u:p@localhost:5433/rescueai_test')).not.toThrow();
  });

  it('refuses the dev database, Neon and the default URL', () => {
    for (const url of [
      'postgres://u:p@localhost:5432/rescueai',
      'postgres://u:p@ep-x.neon.tech/neondb?sslmode=require',
      'postgres://u:p@localhost:5432/rescueai_test_copy',
    ]) {
      expect(() => assertTestDatabase(url)).toThrow(/_test/);
    }
  });
});
