import { describe, expect, it } from 'vitest';
import { groupSum, sumsToOne } from './weights';

describe('weights', () => {
  it('sumsToOne accepts 0.4+0.3+0.2+0.1 and rejects 0.5+0.5+0.1', () => {
    expect(sumsToOne([0.4, 0.3, 0.2, 0.1])).toBe(true);
    expect(sumsToOne([0.5, 0.5, 0.1])).toBe(false);
  });

  it('accepts thirds despite floating-point error', () => {
    expect(sumsToOne([0.333, 0.333, 0.334])).toBe(true);
    expect(sumsToOne([1 / 3, 1 / 3, 1 / 3])).toBe(true);
  });

  it('rejects negative weights and blanks', () => {
    expect(sumsToOne([1.2, -0.2])).toBe(false);
    expect(sumsToOne([Number.NaN, 1])).toBe(false);
  });

  it('groupSum adds the group', () => {
    expect(groupSum([0.25, 0.25, 0.5])).toBeCloseTo(1);
  });
});
