// Request ranking (PRD F5 severity, F6 priority). Pure: no I/O, no clock - the caller passes `now`.

export type Hazard = 'flood' | 'landslide';

export interface Weights {
  alpha: number;
  beta: number;
  gamma: number;
}

// PRD F7: initial weights are equal until domain-informed values exist.
// ponytail: constant until the Admin settings row exists (AC10); then the caller passes its row.
export const DEFAULT_WEIGHTS: Weights = { alpha: 1 / 3, beta: 1 / 3, gamma: 1 / 3 };

export interface Factor {
  name: string;
  value: number;
  weight: number;
  contribution: number;
}

export interface Scored {
  factors: Factor[];
  total: number;
}

export type Band = 'Critical' | 'High' | 'Normal';

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * PRD F5 points table. [Provisional] (D-047). A blank (null) count scores 0 because
 * trapped and injured are optional on the form.
 */
export function severity(r: {
  hazard: Hazard;
  trapped: number | null;
  injured: number | null;
}): number {
  const trapped = r.trapped ?? 0;
  const injured = r.injured ?? 0;
  const trappedPoints = trapped === 0 ? 0 : trapped <= 2 ? 2 : trapped <= 5 ? 3 : 4;
  const injuredPoints = injured === 0 ? 0 : injured <= 2 ? 1 : injured <= 5 ? 2 : 3;
  return Math.min(5, 1 + trappedPoints + injuredPoints + (r.hazard === 'landslide' ? 1 : 0));
}

/**
 * PRD F6: P(r) = alpha*Sev + beta*Vul + gamma*Wait, each term in [0, 1].
 * Sev = (severity - 1) / 4 [Assumption]; Vul = flags / 4; Wait = min(minutes / 60, 1) [Provisional].
 * Each contribution is rounded to 2 places and the total is their sum, so the displayed
 * breakdown always adds up (AC9).
 */
export function priority(
  r: { severity: number; flagCount: number; createdAt: Date },
  now: Date,
  w: Weights = DEFAULT_WEIGHTS,
): Scored {
  const minutes = Math.max(0, (now.getTime() - r.createdAt.getTime()) / 60_000);
  const parts: [string, number, number][] = [
    ['Severity', (r.severity - 1) / 4, w.alpha],
    ['Vulnerability', r.flagCount / 4, w.beta],
    ['Waiting', Math.min(minutes / 60, 1), w.gamma],
  ];
  const factors = parts.map(([name, value, weight]) => ({
    name,
    value: round2(value),
    weight: round2(weight),
    contribution: round2(value * weight),
  }));
  return { factors, total: round2(factors.reduce((s, f) => s + f.contribution, 0)) };
}

/** PRD F6 band cutoffs 0.70 / 0.50. [Provisional] */
export const band = (total: number): Band =>
  total >= 0.7 ? 'Critical' : total >= 0.5 ? 'High' : 'Normal';

/** AC5: highest score first; on equal scores the older request ranks higher. */
export function byPriority(
  a: { score: Scored; createdAt: Date },
  b: { score: Scored; createdAt: Date },
): number {
  return b.score.total - a.score.total || a.createdAt.getTime() - b.createdAt.getTime();
}
