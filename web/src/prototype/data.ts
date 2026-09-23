/**
 * UI prototype data for Progress Report 1. Everything here is synthetic
 * (RULES.md -> Database Rules) and lives only in the browser.
 *
 * The scoring below follows the PRD F5-F7 formulas so the screens show real
 * numbers, but it is NOT the implementation: the real scoring lands in
 * api/src/scoring/ in Phase 2, and this whole folder goes away with it.
 */

export type Skill =
  | 'First Aid'
  | 'Swimming'
  | 'Boat Handling'
  | 'Heavy Lifting'
  | 'Driving'
  | 'Local Language Proficiency';
export type Hazard = 'Flood' | 'Landslide';
export type VulnFlag = 'Children' | 'Elderly' | 'Injured' | 'Disability';

export interface RescueRequest {
  id: string;
  hazard: Hazard;
  place: string;
  lat: number;
  lon: number;
  affected: number;
  trapped: number;
  injured: number;
  flags: VulnFlag[];
  minutesAgo: number;
  status: 'Pending' | 'In Progress';
  contactName: string;
  phone: string;
  description: string;
}

export interface Volunteer {
  id: string;
  name: string;
  lat: number;
  lon: number;
  verified: Skill[];
  unverified: Skill[];
  locationAgeMin: number;
  available: boolean;
  completed: number;
  offered: number;
  withdrawn: number;
}

export interface Team {
  id: string;
  name: string;
  force: 'SDRF' | 'NDRF';
  lat: number;
  lon: number;
  capabilities: Skill[];
  status: 'Available' | 'Deployed' | 'Unavailable';
}

export const requests: RescueRequest[] = [
  {
    id: 'RQ-4821',
    hazard: 'Landslide',
    place: 'Maldevta, near the Song river bridge',
    lat: 30.344,
    lon: 78.139,
    affected: 6,
    trapped: 3,
    injured: 1,
    flags: ['Children', 'Elderly'],
    minutesAgo: 38,
    status: 'Pending',
    contactName: 'Kamla Devi',
    phone: '90000 14821',
    description: 'Hillside came down on the back rooms. Two kids and grandmother inside.',
  },
  {
    id: 'RQ-4817',
    hazard: 'Flood',
    place: 'Rispana riverbank, Dharampur',
    lat: 30.303,
    lon: 78.052,
    affected: 4,
    trapped: 2,
    injured: 0,
    flags: ['Children'],
    minutesAgo: 52,
    status: 'Pending',
    contactName: 'Imran Ali',
    phone: '90000 14817',
    description: 'Water up to the first floor, family on the roof.',
  },
  {
    id: 'RQ-4809',
    hazard: 'Flood',
    place: 'Raiwala, behind the railway station',
    lat: 30.017,
    lon: 78.227,
    affected: 3,
    trapped: 0,
    injured: 0,
    flags: ['Injured'],
    minutesAgo: 71,
    status: 'In Progress',
    contactName: '',
    phone: '90000 14809',
    description: '',
  },
  {
    id: 'RQ-4826',
    hazard: 'Landslide',
    place: 'Sahastradhara Road, km 6',
    lat: 30.36,
    lon: 78.09,
    affected: 1,
    trapped: 1,
    injured: 0,
    flags: [],
    minutesAgo: 24,
    status: 'Pending',
    contactName: 'Vikas Pundir',
    phone: '90000 14826',
    description: 'Car stuck under debris, driver talking.',
  },
  {
    id: 'RQ-4830',
    hazard: 'Flood',
    place: 'Doiwala, ward 7',
    lat: 30.176,
    lon: 78.117,
    affected: 5,
    trapped: 0,
    injured: 2,
    flags: ['Elderly', 'Disability'],
    minutesAgo: 9,
    status: 'Pending',
    contactName: 'Sunita Rana',
    phone: '90000 14830',
    description: 'Wheelchair user cannot leave, water rising slowly.',
  },
];

export const volunteers: Volunteer[] = [
  {
    id: 'v1',
    name: 'Ankit Rawat',
    lat: 30.33,
    lon: 78.11,
    verified: ['First Aid', 'Heavy Lifting'],
    unverified: ['Driving'],
    locationAgeMin: 6,
    available: true,
    completed: 4,
    offered: 5,
    withdrawn: 0,
  },
  {
    id: 'v2',
    name: 'Pooja Negi',
    lat: 30.3,
    lon: 78.06,
    verified: ['Swimming', 'First Aid'],
    unverified: [],
    locationAgeMin: 22,
    available: true,
    completed: 2,
    offered: 3,
    withdrawn: 0,
  },
  {
    id: 'v3',
    name: 'Harish Bisht',
    lat: 30.345,
    lon: 78.15,
    verified: ['Heavy Lifting'],
    unverified: ['First Aid'],
    locationAgeMin: 95,
    available: true,
    completed: 0,
    offered: 0,
    withdrawn: 0,
  },
  {
    id: 'v4',
    name: 'Sameer Khan',
    lat: 30.285,
    lon: 78.02,
    verified: ['Boat Handling', 'Swimming', 'Driving'],
    unverified: [],
    locationAgeMin: 14,
    available: true,
    completed: 5,
    offered: 6,
    withdrawn: 1,
  },
  {
    id: 'v5',
    name: 'Neha Joshi',
    lat: 30.2,
    lon: 78.1,
    verified: ['First Aid', 'Local Language Proficiency'],
    unverified: ['Swimming'],
    locationAgeMin: 40,
    available: true,
    completed: 1,
    offered: 4,
    withdrawn: 0,
  },
  {
    id: 'v6',
    name: 'Rohit Semwal',
    lat: 30.37,
    lon: 78.12,
    verified: ['First Aid', 'Heavy Lifting', 'Driving'],
    unverified: [],
    locationAgeMin: 130,
    available: true,
    completed: 3,
    offered: 3,
    withdrawn: 0,
  },
  {
    id: 'v7',
    name: 'Deepak Thapa',
    lat: 30.32,
    lon: 78.04,
    verified: [],
    unverified: ['Swimming', 'First Aid'],
    locationAgeMin: 3,
    available: true,
    completed: 0,
    offered: 0,
    withdrawn: 0,
  },
  {
    id: 'v8',
    name: 'Meenakshi Gusain',
    lat: 30.34,
    lon: 78.13,
    verified: ['First Aid', 'Swimming'],
    unverified: [],
    locationAgeMin: 11,
    available: false,
    completed: 6,
    offered: 7,
    withdrawn: 0,
  },
];

export const teams: Team[] = [
  {
    id: 't1',
    name: 'SDRF Dehradun Unit 2',
    force: 'SDRF',
    lat: 30.325,
    lon: 78.045,
    capabilities: ['Heavy Lifting', 'First Aid', 'Swimming', 'Boat Handling'],
    status: 'Available',
  },
  {
    id: 't2',
    name: 'SDRF Sahastradhara Post',
    force: 'SDRF',
    lat: 30.387,
    lon: 78.132,
    capabilities: ['Heavy Lifting', 'First Aid'],
    status: 'Available',
  },
  {
    id: 't3',
    name: 'NDRF 15 Bn, Team C',
    force: 'NDRF',
    lat: 30.268,
    lon: 77.995,
    capabilities: ['Swimming', 'Boat Handling', 'First Aid', 'Heavy Lifting'],
    status: 'Available',
  },
  {
    id: 't4',
    name: 'SDRF Rishikesh Water Unit',
    force: 'SDRF',
    lat: 30.109,
    lon: 78.292,
    capabilities: ['Boat Handling', 'Swimming'],
    status: 'Deployed',
  },
];

// PRD F7: initial weights are equal until domain-informed values exist.
export const WEIGHTS = {
  w1: 0.25,
  w2: 0.25,
  w3: 0.25,
  w4: 0.25,
  alpha: 1 / 3,
  beta: 1 / 3,
  gamma: 1 / 3,
};

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

const round2 = (n: number) => Math.round(n * 100) / 100;

function scored(parts: [string, number, number][]): Scored {
  const factors = parts.map(([name, value, weight]) => ({
    name,
    value,
    weight,
    contribution: round2(value * weight),
  }));
  // The total is the sum of the displayed contributions, so the breakdown always adds up (PRD AC9).
  return { factors, total: round2(factors.reduce((s, f) => s + f.contribution, 0)) };
}

// PRD F5, provisional points table (D-047).
export function severity(r: Pick<RescueRequest, 'hazard' | 'trapped' | 'injured'>): number {
  const trapped = r.trapped === 0 ? 0 : r.trapped <= 2 ? 2 : r.trapped <= 5 ? 3 : 4;
  const injured = r.injured === 0 ? 0 : r.injured <= 2 ? 1 : r.injured <= 5 ? 2 : 3;
  return Math.min(5, 1 + trapped + injured + (r.hazard === 'Landslide' ? 1 : 0));
}

// PRD F6.
export function priority(r: RescueRequest): Scored {
  return scored([
    ['Severity', (severity(r) - 1) / 4, WEIGHTS.alpha],
    ['Vulnerability', r.flags.length / 4, WEIGHTS.beta],
    ['Waiting', Math.min(r.minutesAgo / 60, 1), WEIGHTS.gamma],
  ]);
}

export type Band = 'Critical' | 'High' | 'Normal';
export const band = (p: number): Band => (p >= 0.7 ? 'Critical' : p >= 0.5 ? 'High' : 'Normal');

export const requiredSkills = (h: Hazard): Skill[] =>
  h === 'Flood' ? ['Swimming', 'Boat Handling', 'First Aid'] : ['Heavy Lifting', 'First Aid'];

export function distanceKm(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const rad = Math.PI / 180;
  const dLat = (bLat - aLat) * rad;
  const dLon = (bLon - aLon) * rad;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(aLat * rad) * Math.cos(bLat * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

const skillMatch = (have: Skill[], need: Skill[]) =>
  need.filter((s) => have.includes(s)).length / need.length;
const proximity = (km: number) => Math.max(0, 1 - km / 25);

export interface Recommendation {
  id: string;
  name: string;
  kind: 'Volunteer' | 'Team';
  km: number;
  skills: { skill: Skill; verified: boolean }[];
  reason: string;
  score: Scored;
}

export function rankVolunteers(r: RescueRequest): Recommendation[] {
  const need = requiredSkills(r.hazard);
  return volunteers
    .filter((v) => v.available && v.verified.length > 0)
    .map((v) => {
      const km = distanceKm(v.lat, v.lon, r.lat, r.lon);
      const counted = v.offered - v.withdrawn;
      const reliability = counted === 0 ? 0.5 : v.completed / counted;
      const matched = need.filter((s) => v.verified.includes(s)).length;
      return {
        id: v.id,
        name: v.name,
        kind: 'Volunteer' as const,
        km,
        skills: [
          ...v.verified.map((skill) => ({ skill, verified: true })),
          ...v.unverified.map((skill) => ({ skill, verified: false })),
        ],
        reason: `${matched} of ${need.length} required skills verified, ${km.toFixed(1)} km away, location ${v.locationAgeMin} min old, ${counted === 0 ? 'no offers yet' : `${v.completed} of ${counted} offers completed`}.`,
        score: scored([
          ['Skill', skillMatch(v.verified, need), WEIGHTS.w1],
          ['Proximity', proximity(km), WEIGHTS.w2],
          ['Freshness', Math.max(0, 1 - v.locationAgeMin / 120), WEIGHTS.w3],
          ['Reliability', reliability, WEIGHTS.w4],
        ]),
      };
    })
    .sort((a, b) => b.score.total - a.score.total)
    .slice(0, 10);
}

export function rankTeams(r: RescueRequest): Recommendation[] {
  const need = requiredSkills(r.hazard);
  const { w1, w2 } = WEIGHTS;
  return teams
    .filter((t) => t.status === 'Available')
    .map((t) => {
      const km = distanceKm(t.lat, t.lon, r.lat, r.lon);
      const matched = need.filter((s) => t.capabilities.includes(s)).length;
      return {
        id: t.id,
        name: t.name,
        kind: 'Team' as const,
        km,
        skills: t.capabilities.map((skill) => ({ skill, verified: true })),
        reason: `${t.force}. Covers ${matched} of ${need.length} required capabilities, base ${km.toFixed(1)} km away.`,
        // PRD F7 team score: (w1·Capability + w2·Proximity) / (w1 + w2).
        score: scored([
          ['Capability', skillMatch(t.capabilities, need), w1 / (w1 + w2)],
          ['Proximity', proximity(km), w2 / (w1 + w2)],
        ]),
      };
    })
    .sort((a, b) => b.score.total - a.score.total)
    .slice(0, 10);
}
