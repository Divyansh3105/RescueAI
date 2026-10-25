import { describe, expect, it } from 'vitest';
import { homeFor, safeNext } from './routes';

describe('homeFor', () => {
  it('maps each role to its home', () => {
    expect(homeFor('volunteer')).toBe('/volunteer');
    expect(homeFor('onsite_commander')).toBe('/commander/queue');
    expect(homeFor('office_commander')).toBe('/commander/queue');
    expect(homeFor('admin')).toBe('/admin/commanders');
  });
});

describe('safeNext', () => {
  it('keeps an allowed same-site path', () => {
    expect(safeNext('/commander/map', 'onsite_commander')).toBe('/commander/map');
    expect(safeNext('/commander/queue?r=RQ-1', 'office_commander')).toBe('/commander/queue?r=RQ-1');
  });

  it('rejects protocol-relative and absolute URLs', () => {
    for (const next of [
      '//evil.com',
      'https://evil.com',
      '/\\evil.com',
      'javascript:alert(1)',
      '/\t/evil.com',
      '/\n/evil.com',
    ]) {
      expect(safeNext(next, 'onsite_commander')).toBe('/commander/queue');
    }
  });

  it("rejects another role's area", () => {
    expect(safeNext('/admin/weights', 'volunteer')).toBe('/volunteer');
    expect(safeNext('/commander/queue', 'admin')).toBe('/admin/commanders');
  });

  it('with null or the login page returns home', () => {
    expect(safeNext(null, 'admin')).toBe('/admin/commanders');
    expect(safeNext('/login', 'admin')).toBe('/admin/commanders');
  });
});
