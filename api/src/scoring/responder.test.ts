import { describe, expect, it } from 'vitest';
import {
  DEFAULT_RESPONDER_WEIGHTS,
  defaultRequiredSkills,
  distanceKm,
  shortlistTeams,
  shortlistVolunteers,
  type TeamInput,
  type VolunteerInput,
} from './responder.js';

const NOW = new Date('2026-11-14T10:00:00Z');
const minutesAgo = (m: number) => new Date(NOW.getTime() - m * 60_000);
const KM_PER_DEG_LAT = 111.195;

// A flood request in Dehradun. Responders are placed due north of it, `km` away.
const request = { lat: 30.3165, lon: 78.0322, requiredSkills: defaultRequiredSkills('flood') };
const north = (km: number) => ({ lat: request.lat + km / KM_PER_DEG_LAT, lon: request.lon });

function volunteer(over: Partial<VolunteerInput> & { km?: number; ageMin?: number } = {}) {
  const { km = 1, ageMin = 10, ...rest } = over;
  return {
    id: 'v1',
    available: true,
    activeAssignment: false,
    skills: [{ skill: 'first_aid', status: 'verified' }],
    location: { ...north(km), at: minutesAgo(ageMin) },
    offered: 4,
    withdrawn: 0,
    completed: 2,
    ...rest,
  } satisfies VolunteerInput;
}

function team(over: Partial<TeamInput> & { km?: number } = {}): TeamInput {
  const { km = 5, ...rest } = over;
  return {
    id: 't1',
    name: 'SDRF Dehradun',
    force: 'sdrf',
    status: 'available',
    ...north(km),
    capabilities: ['swimming', 'boat_handling'],
    ...rest,
  };
}

const rank = (vs: VolunteerInput[]) =>
  shortlistVolunteers(request, vs, DEFAULT_RESPONDER_WEIGHTS, NOW).map((r) => r.id);

describe('defaultRequiredSkills (PRD F7)', () => {
  it('flood needs Swimming, Boat Handling, First Aid; landslide Heavy Lifting, First Aid', () => {
    expect(defaultRequiredSkills('flood')).toEqual(['swimming', 'boat_handling', 'first_aid']);
    expect(defaultRequiredSkills('landslide')).toEqual(['heavy_lifting', 'first_aid']);
  });
});

describe('distanceKm', () => {
  it('one degree of latitude is about 111.2 km', () => {
    expect(distanceKm({ lat: 0, lon: 0 }, { lat: 1, lon: 0 })).toBeCloseTo(111.19, 1);
  });
});

describe('volunteer score (PRD F7)', () => {
  const only = (v: VolunteerInput, w = DEFAULT_RESPONDER_WEIGHTS) =>
    shortlistVolunteers(request, [v], w, NOW)[0]!;
  const value = (v: VolunteerInput, name: string, w = DEFAULT_RESPONDER_WEIGHTS) =>
    only(v, w).score.factors.find((f) => f.name === name)!.value;

  it('AC6: unverified and rejected skills never count toward Skill', () => {
    const v = volunteer({
      skills: [
        { skill: 'first_aid', status: 'verified' },
        { skill: 'swimming', status: 'unverified' },
        { skill: 'boat_handling', status: 'rejected' },
      ],
    });
    expect(value(v, 'Skill')).toBe(0.33);
  });

  it('Proximity falls linearly to 0 at 25 km', () => {
    expect(value(volunteer({ km: 0 }), 'Proximity')).toBe(1);
    expect(value(volunteer({ km: 12.5 }), 'Proximity')).toBe(0.5);
    expect(value(volunteer({ km: 40 }), 'Proximity')).toBe(0);
  });

  it('Freshness uses the Admin window (D-054)', () => {
    const v = volunteer({ ageMin: 60 });
    expect(value(v, 'Freshness')).toBe(0.5);
    expect(value(v, 'Freshness', { ...DEFAULT_RESPONDER_WEIGHTS, freshnessMinutes: 60 })).toBe(0);
  });

  it('Reliability = completed / (offered - withdrawn), 0.5 with no counted offers', () => {
    expect(value(volunteer({ offered: 5, withdrawn: 1, completed: 3 }), 'Reliability')).toBe(0.75);
    expect(value(volunteer({ offered: 2, withdrawn: 2, completed: 0 }), 'Reliability')).toBe(0.5);
    expect(value(volunteer({ offered: 0, withdrawn: 0, completed: 0 }), 'Reliability')).toBe(0.5);
  });

  it('AC9: contributions add up to the total, with the PRD one-line reason', () => {
    const v = volunteer({
      skills: [
        { skill: 'swimming', status: 'verified' },
        { skill: 'first_aid', status: 'verified' },
      ],
      km: 1.2,
      ageMin: 5,
      offered: 10,
      completed: 9,
    });
    const r = only(v);
    const sum = r.score.factors.reduce((s, f) => s + f.contribution, 0);
    expect(r.score.total).toBeCloseTo(sum, 10);
    expect(r.rank).toBe(1);
    expect(r.reason).toBe(
      'Ranked #1: verified First Aid and Swimming, 1.2 km away, location updated 5 min ago, 90% completion rate.',
    );
  });

  it('the reason says so when there is no history or no matching skill', () => {
    const v = volunteer({
      skills: [{ skill: 'driving', status: 'verified' }],
      offered: 0,
      completed: 0,
      ageMin: 150,
    });
    expect(only(v).reason).toBe(
      'Ranked #1: no required skill verified, 1.0 km away, location updated 2 h ago, no service history yet.',
    );
  });

  it('refuses an empty required-skill list', () => {
    expect(() =>
      shortlistVolunteers(
        { ...request, requiredSkills: [] },
        [volunteer()],
        DEFAULT_RESPONDER_WEIGHTS,
        NOW,
      ),
    ).toThrow(RangeError);
  });
});

describe('volunteer shortlist', () => {
  it('AC6: a volunteer with no verified skill is never shortlisted', () => {
    const v = volunteer({ skills: [{ skill: 'first_aid', status: 'unverified' }] });
    expect(rank([v])).toEqual([]);
  });

  it('AC7: Unavailable or already-assigned volunteers are never shortlisted', () => {
    expect(rank([volunteer({ id: 'off', available: false })])).toEqual([]);
    expect(rank([volunteer({ id: 'busy', activeAssignment: true })])).toEqual([]);
  });

  it('AC8: identical except distance, the nearer one ranks higher', () => {
    expect(rank([volunteer({ id: 'far', km: 8 }), volunteer({ id: 'near', km: 2 })])).toEqual([
      'near',
      'far',
    ]);
  });

  it('AC8: identical except location age, the more recent one ranks higher', () => {
    expect(
      rank([volunteer({ id: 'old', ageMin: 90 }), volunteer({ id: 'recent', ageMin: 5 })]),
    ).toEqual(['recent', 'old']);
  });

  it('AC8: identical except completion rate, the more reliable one ranks higher', () => {
    expect(
      rank([volunteer({ id: 'flaky', completed: 1 }), volunteer({ id: 'reliable', completed: 4 })]),
    ).toEqual(['reliable', 'flaky']);
  });

  it('keeps the top 10', () => {
    const many = Array.from({ length: 15 }, (_, i) => volunteer({ id: `v${String(i)}`, km: i }));
    const list = shortlistVolunteers(request, many, DEFAULT_RESPONDER_WEIGHTS, NOW);
    expect(list).toHaveLength(10);
    expect(list.map((r) => r.rank)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(list[0]!.id).toBe('v0');
  });
});

describe('team shortlist (PRD F7, D-054)', () => {
  const teams = (ts: TeamInput[], w = DEFAULT_RESPONDER_WEIGHTS) => shortlistTeams(request, ts, w);

  it('AC7: only Available teams are shortlisted', () => {
    expect(
      teams([team({ status: 'deployed' }), team({ id: 't2', status: 'unavailable' })]),
    ).toEqual([]);
  });

  it('score = (w1*Capability + w2*Proximity) / (w1 + w2), and AC9 holds', () => {
    // Capability 2/3, Proximity 1 - 5/25 = 0.8; equal weights -> (0.667 + 0.8) / 2.
    const [r] = teams([team()]);
    expect(r!.score.total).toBeCloseTo((2 / 3 + 0.8) / 2, 2);
    const sum = r!.score.factors.reduce((s, f) => s + f.contribution, 0);
    expect(r!.score.total).toBeCloseTo(sum, 10);
    expect(r!.reason).toBe(
      'Ranked #1: SDRF team with Swimming and Boat Handling, base 5.0 km away.',
    );
  });

  it('rejects w1 + w2 = 0, which would divide by zero (D-054)', () => {
    const w = { ...DEFAULT_RESPONDER_WEIGHTS, w1: 0, w2: 0, w3: 0.5, w4: 0.5 };
    expect(() => teams([team()], w)).toThrow(RangeError);
  });
});
