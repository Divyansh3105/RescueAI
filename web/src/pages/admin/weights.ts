// PRD F7 / AC10: each weight group (w1-w4, and alpha-beta-gamma) must sum to 1.
// The API re-checks this with zod; this check only gives the Admin early feedback.

export const groupSum = (values: number[]) => values.reduce((a, b) => a + b, 0);

/** True when every weight is a number in [0, 1] and the group sums to 1 within 0.001. */
export function sumsToOne(values: number[]): boolean {
  if (values.some((v) => !Number.isFinite(v) || v < 0 || v > 1)) return false;
  return Math.abs(groupSum(values) - 1) <= 0.001;
}
