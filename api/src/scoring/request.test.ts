import { describe, expect, it } from 'vitest';
import { band, byPriority, DEFAULT_WEIGHTS, priority, severity } from './request.js';

const NOW = new Date('2026-10-27T10:00:00Z');
const minutesAgo = (m: number) => new Date(NOW.getTime() - m * 60_000);

describe('severity (PRD F5 points table)', () => {
  it('AC3: the PRD worked examples', () => {
    expect(severity({ hazard: 'flood', trapped: 0, injured: 0 })).toBe(1);
    expect(severity({ hazard: 'flood', trapped: 1, injured: 0 })).toBe(3);
    expect(severity({ hazard: 'flood', trapped: 1, injured: 2 })).toBe(4);
    expect(severity({ hazard: 'landslide', trapped: 1, injured: 0 })).toBe(4);
    expect(severity({ hazard: 'landslide', trapped: 3, injured: 0 })).toBe(5);
  });

  it('AC3: the same inputs always give the same severity', () => {
    const input = { hazard: 'landslide', trapped: 4, injured: 1 } as const;
    expect(severity(input)).toBe(severity({ ...input }));
  });

  it('AC3: every band edge of the table', () => {
    const trapped = [0, 1, 2, 3, 5, 6, 40].map((n) =>
      severity({ hazard: 'flood', trapped: n, injured: 0 }),
    );
    expect(trapped).toEqual([1, 3, 3, 4, 4, 5, 5]);
    const injured = [0, 1, 2, 3, 5, 6, 40].map((n) =>
      severity({ hazard: 'flood', trapped: 0, injured: n }),
    );
    expect(injured).toEqual([1, 2, 2, 3, 3, 4, 4]);
  });

  it('AC3: a blank count scores 0, same as an explicit 0', () => {
    expect(severity({ hazard: 'flood', trapped: null, injured: null })).toBe(
      severity({ hazard: 'flood', trapped: 0, injured: 0 }),
    );
  });

  it('AC3: saturates at 5', () => {
    expect(severity({ hazard: 'landslide', trapped: 99, injured: 99 })).toBe(5);
  });
});

describe('priority (PRD F6)', () => {
  const base = { severity: 3, flagCount: 2, createdAt: minutesAgo(30) };

  it('uses (severity-1)/4, flags/4 and min(minutes/60, 1)', () => {
    const { factors } = priority(base, NOW);
    expect(factors.map((f) => f.value)).toEqual([0.5, 0.5, 0.5]);
  });

  it('Wait is capped at 1 after an hour', () => {
    const wait = (m: number) => priority({ ...base, createdAt: minutesAgo(m) }, NOW).factors[2]!;
    expect(wait(60).value).toBe(1);
    expect(wait(600).value).toBe(1);
  });

  it('a request created after `now` does not get a negative Wait', () => {
    expect(priority({ ...base, createdAt: minutesAgo(-5) }, NOW).factors[2]!.value).toBe(0);
  });

  it('AC9: contributions add up to the displayed total', () => {
    for (const sev of [1, 2, 3, 4, 5]) {
      for (const flagCount of [0, 1, 3, 4]) {
        for (const m of [0, 7, 29, 61]) {
          const s = priority({ severity: sev, flagCount, createdAt: minutesAgo(m) }, NOW);
          const sum = s.factors.reduce((t, f) => t + f.contribution, 0);
          expect(s.total).toBeCloseTo(sum, 10);
        }
      }
    }
  });

  it('respects custom weights', () => {
    const s = priority(base, NOW, { alpha: 1, beta: 0, gamma: 0 });
    expect(s.total).toBe(0.5);
  });

  it('default weights sum to 1', () => {
    const { alpha, beta, gamma } = DEFAULT_WEIGHTS;
    expect(alpha + beta + gamma).toBeCloseTo(1, 10);
  });
});

describe('band', () => {
  it('Critical from 0.70, High from 0.50, else Normal', () => {
    expect(band(0.7)).toBe('Critical');
    expect(band(0.69)).toBe('High');
    expect(band(0.5)).toBe('High');
    expect(band(0.49)).toBe('Normal');
  });
});

describe('byPriority', () => {
  const make = (id: string, sev: number, m: number) => {
    const createdAt = minutesAgo(m);
    return { id, createdAt, score: priority({ severity: sev, flagCount: 1, createdAt }, NOW) };
  };

  it('AC5: sorted by P(r) descending', () => {
    const sorted = [make('low', 1, 5), make('high', 5, 5), make('mid', 3, 5)].sort(byPriority);
    expect(sorted.map((r) => r.id)).toEqual(['high', 'mid', 'low']);
  });

  it('AC5: identical except age, the older one ranks higher', () => {
    const sorted = [make('newer', 3, 10), make('older', 3, 40)].sort(byPriority);
    expect(sorted.map((r) => r.id)).toEqual(['older', 'newer']);
  });

  it('AC5: when both are past the Wait cap their scores tie and the older one still ranks higher', () => {
    const a = make('newer', 3, 90);
    const b = make('older', 3, 300);
    expect(a.score.total).toBe(b.score.total);
    expect([a, b].sort(byPriority).map((r) => r.id)).toEqual(['older', 'newer']);
  });
});
