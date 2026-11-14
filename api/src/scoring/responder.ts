// Responder ranking (PRD F7 score, F8 explanation). Pure: no I/O, no clock - the caller passes `now`.
import { round2, type Factor, type Hazard, type Scored } from './request.js';

// PRD F2 skill list, in display order. Same values as the database `skill` enum.
export const SKILLS = [
  'first_aid',
  'swimming',
  'boat_handling',
  'heavy_lifting',
  'driving',
  'local_language',
] as const;
export type Skill = (typeof SKILLS)[number];
export type SkillStatus = 'unverified' | 'verified' | 'rejected';

const SKILL_LABEL: Record<Skill, string> = {
  first_aid: 'First Aid',
  swimming: 'Swimming',
  boat_handling: 'Boat Handling',
  heavy_lifting: 'Heavy Lifting',
  driving: 'Driving',
  local_language: 'Local Language Proficiency',
};

/** w1-w4 for S(v,r) and the Freshness window in minutes; the Admin settings row (AC10, D-054). */
export interface ResponderWeights {
  w1: number;
  w2: number;
  w3: number;
  w4: number;
  freshnessMinutes: number;
}

// PRD F7: equal weights and a 120-minute window until domain-informed values exist.
export const DEFAULT_RESPONDER_WEIGHTS: ResponderWeights = {
  w1: 0.25,
  w2: 0.25,
  w3: 0.25,
  w4: 0.25,
  freshnessMinutes: 120,
};

const PROXIMITY_KM = 25;
const SHORTLIST = 10;

/** PRD F7 defaults; the commander can edit them. */
export function defaultRequiredSkills(hazard: Hazard): Skill[] {
  return hazard === 'flood'
    ? ['swimming', 'boat_handling', 'first_aid']
    : ['heavy_lifting', 'first_aid'];
}

export interface Point {
  lat: number;
  lon: number;
}

/** Straight-line (haversine) distance in km. MVP proximity ignores roads and terrain. */
export function distanceKm(a: Point, b: Point): number {
  const rad = (d: number) => (d * Math.PI) / 180;
  const h =
    Math.sin(rad(b.lat - a.lat) / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lon - a.lon) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

export interface Target extends Point {
  requiredSkills: Skill[];
}

export interface VolunteerInput {
  id: string;
  available: boolean;
  activeAssignment: boolean;
  skills: { skill: Skill; status: SkillStatus }[];
  location: (Point & { at: Date }) | null;
  offered: number;
  withdrawn: number;
  completed: number;
}

export interface TeamInput extends Point {
  id: string;
  name: string;
  force: 'sdrf' | 'ndrf';
  status: 'available' | 'deployed' | 'unavailable';
  capabilities: Skill[];
}

export interface Ranked {
  id: string;
  rank: number;
  score: Scored;
  reason: string;
}

/** Contributions are rounded to 2 places and the total is their sum, so they add up (AC9). */
function scored(parts: [string, number, number][]): Scored {
  const factors: Factor[] = parts.map(([name, value, weight]) => ({
    name,
    value: round2(value),
    weight: round2(weight),
    contribution: round2(value * weight),
  }));
  return { factors, total: round2(factors.reduce((s, f) => s + f.contribution, 0)) };
}

/** Required skills the responder has, in display order. */
function matched(required: Skill[], has: Skill[]): Skill[] {
  if (required.length === 0) throw new RangeError('At least one required skill is needed.');
  return SKILLS.filter((s) => required.includes(s) && has.includes(s));
}

const proximity = (km: number) => Math.max(0, 1 - km / PROXIMITY_KM);

function listSkills(skills: Skill[]): string {
  const names = skills.map((s) => SKILL_LABEL[s]);
  return names.length <= 1
    ? names.join('')
    : `${names.slice(0, -1).join(', ')} and ${names.at(-1)!}`;
}

function rankAll<T>(
  items: (T & { id: string; score: Scored })[],
  reason: (t: T) => string,
): Ranked[] {
  return items
    .sort((a, b) => b.score.total - a.score.total || a.id.localeCompare(b.id))
    .slice(0, SHORTLIST)
    .map((t, i) => ({
      id: t.id,
      rank: i + 1,
      score: t.score,
      reason: `Ranked #${String(i + 1)}: ${reason(t)}.`,
    }));
}

/**
 * PRD F7 volunteer shortlist: S(v,r) = w1*Skill + w2*Proximity + w3*Freshness + w4*Reliability.
 * Eligible (AC6, AC7): Available, no active assignment, a shared location and at least one
 * verified skill. An old location lowers Freshness; it does not exclude.
 */
export function shortlistVolunteers(
  r: Target,
  volunteers: VolunteerInput[],
  w: ResponderWeights,
  now: Date,
): Ranked[] {
  const scoredVolunteers = volunteers.flatMap((v) => {
    const verified = v.skills.filter((s) => s.status === 'verified').map((s) => s.skill);
    if (!v.available || v.activeAssignment || !v.location || verified.length === 0) return [];
    const skills = matched(r.requiredSkills, verified);
    const km = distanceKm(r, v.location);
    const ageMin = Math.max(0, (now.getTime() - v.location.at.getTime()) / 60_000);
    const counted = v.offered - v.withdrawn;
    const reliability = counted > 0 ? Math.min(1, v.completed / counted) : 0.5;
    const score = scored([
      ['Skill', skills.length / r.requiredSkills.length, w.w1],
      ['Proximity', proximity(km), w.w2],
      ['Freshness', Math.max(0, 1 - ageMin / w.freshnessMinutes), w.w3],
      ['Reliability', reliability, w.w4],
    ]);
    return [{ id: v.id, score, skills, km, ageMin, counted, reliability }];
  });
  return rankAll(scoredVolunteers, (v) =>
    [
      v.skills.length ? `verified ${listSkills(v.skills)}` : 'no required skill verified',
      `${v.km.toFixed(1)} km away`,
      `location updated ${v.ageMin < 60 ? `${String(Math.floor(v.ageMin))} min` : `${String(Math.floor(v.ageMin / 60))} h`} ago`,
      v.counted > 0
        ? `${String(Math.round(v.reliability * 100))}% completion rate`
        : 'no service history yet',
    ].join(', '),
  );
}

/**
 * PRD F7 team shortlist, Available teams only (AC7).
 * [Provisional] Team score = (w1*Capability + w2*Proximity) / (w1 + w2) (D-054); the weights
 * shown are w1 and w2 rescaled to sum to 1, so the contributions still add up (AC9).
 */
export function shortlistTeams(r: Target, teams: TeamInput[], w: ResponderWeights): Ranked[] {
  const sum = w.w1 + w.w2;
  if (!(sum > 0)) throw new RangeError('w1 + w2 must be greater than 0 (D-054).');
  const scoredTeams = teams.flatMap((t) => {
    if (t.status !== 'available') return [];
    const skills = matched(r.requiredSkills, t.capabilities);
    const km = distanceKm(r, t);
    const score = scored([
      ['Capability', skills.length / r.requiredSkills.length, w.w1 / sum],
      ['Proximity', proximity(km), w.w2 / sum],
    ]);
    return [{ id: t.id, score, skills, km, force: t.force }];
  });
  return rankAll(
    scoredTeams,
    (t) =>
      `${t.force.toUpperCase()} team with ${t.skills.length ? listSkills(t.skills) : 'no required capability'}, base ${t.km.toFixed(1)} km away`,
  );
}
