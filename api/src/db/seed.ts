// Local demo data, all synthetic (RULES.md): one account per role plus extra volunteers, their
// profiles and skills, and three rescue teams around Dehradun.
// Usage: SEED_PASSWORD=<at least 8 chars> npm run db:seed
// Re-running resets everything below to these values (passwords, profiles, skills, teams)
// and never duplicates a row. Location times are relative to the run, so re-run to refresh them.
import bcrypt from 'bcryptjs';
import { BCRYPT_COST } from '../auth/sessions.js';
import { closeDb, db } from './client.js';
import { runMigrations } from './migrate.js';
import {
  teamCapabilities,
  teams,
  users,
  volunteerProfiles,
  volunteerSkills,
  type UserRole,
} from './schema.js';

type Skill = (typeof volunteerSkills.$inferInsert)['skill'];
type Status = 'verified' | 'unverified' | 'rejected';

// Dehradun city centre; everything is placed by km offsets from it.
const CENTRE = { lat: 30.3165, lon: 78.0322 };
const place = (kmNorth: number, kmEast: number) => ({
  lat: CENTRE.lat + kmNorth / 111.195,
  lon: CENTRE.lon + kmEast / (111.195 * Math.cos((CENTRE.lat * Math.PI) / 180)),
});

const accounts: { phone: string; name: string; role: UserRole }[] = [
  { phone: '9000000001', name: 'Demo Volunteer', role: 'volunteer' },
  { phone: '9000000002', name: 'Demo On-site Commander', role: 'onsite_commander' },
  { phone: '9000000003', name: 'Demo Office Commander', role: 'office_commander' },
  { phone: '9000000004', name: 'Demo Admin', role: 'admin' },
  { phone: '9000000005', name: 'Demo Volunteer 2', role: 'volunteer' },
  { phone: '9000000006', name: 'Demo Volunteer 3', role: 'volunteer' },
  { phone: '9000000007', name: 'Demo Volunteer 4', role: 'volunteer' },
  { phone: '9000000008', name: 'Demo Volunteer 5', role: 'volunteer' },
  { phone: '9000000009', name: 'Demo Volunteer 6', role: 'volunteer' },
];

// Each one exercises a different part of the F7 ranking, so the shortlist isn't uniform.
const volunteers: {
  phone: string;
  available: boolean;
  km: [number, number];
  ageMin: number;
  counts: [
    offered: number,
    accepted: number,
    declined: number,
    withdrawn: number,
    completed: number,
  ];
  skills: [Skill, Status][];
}[] = [
  // Close, fresh, reliable: should rank first for a flood near the centre.
  {
    phone: '9000000001',
    available: true,
    km: [1, 1],
    ageMin: 10,
    counts: [5, 5, 0, 0, 4],
    skills: [
      ['first_aid', 'verified'],
      ['swimming', 'verified'],
      ['driving', 'unverified'],
    ],
  },
  {
    phone: '9000000005',
    available: true,
    km: [-5, 3],
    ageMin: 45,
    counts: [10, 8, 1, 1, 6],
    skills: [
      ['swimming', 'verified'],
      ['boat_handling', 'verified'],
    ],
  },
  // Stale location and no history: Freshness 0, Reliability 0.5.
  {
    phone: '9000000006',
    available: true,
    km: [12, -9],
    ageMin: 150,
    counts: [0, 0, 0, 0, 0],
    skills: [
      ['heavy_lifting', 'verified'],
      ['first_aid', 'verified'],
    ],
  },
  // Unavailable: never shortlisted (AC7).
  {
    phone: '9000000007',
    available: false,
    km: [2, -2],
    ageMin: 20,
    counts: [3, 3, 0, 0, 3],
    skills: [['first_aid', 'verified']],
  },
  // No verified skill: never shortlisted (AC6).
  {
    phone: '9000000008',
    available: true,
    km: [3, 2],
    ageMin: 5,
    counts: [0, 0, 0, 0, 0],
    skills: [
      ['swimming', 'unverified'],
      ['local_language', 'rejected'],
    ],
  },
  // Beyond 25 km: Proximity 0.
  {
    phone: '9000000009',
    available: true,
    km: [-28, 10],
    ageMin: 20,
    counts: [3, 2, 1, 0, 2],
    skills: [
      ['first_aid', 'verified'],
      ['driving', 'verified'],
    ],
  },
];

// Fixed ids so a re-run updates the same teams instead of adding more.
const seedTeams: (typeof teams.$inferInsert & { capabilities: Skill[] })[] = [
  {
    id: '5eed0000-0000-4000-8000-000000000001',
    name: 'SDRF Team Alpha',
    force: 'sdrf',
    status: 'available',
    ...place(2, -1),
    capabilities: ['swimming', 'boat_handling', 'first_aid'],
  },
  {
    id: '5eed0000-0000-4000-8000-000000000002',
    name: 'NDRF Team Bravo',
    force: 'ndrf',
    status: 'available',
    ...place(-15, 12),
    capabilities: ['heavy_lifting', 'first_aid', 'driving'],
  },
  // Not Available: never shortlisted (AC7).
  {
    id: '5eed0000-0000-4000-8000-000000000003',
    name: 'SDRF Team Charlie',
    force: 'sdrf',
    status: 'unavailable',
    ...place(6, 8),
    capabilities: ['swimming', 'first_aid'],
  },
];

const password = process.env.SEED_PASSWORD ?? '';
if (password.length < 8) {
  console.error('Set SEED_PASSWORD (at least 8 characters) to seed the demo accounts.');
  process.exit(1);
}

await runMigrations();
const passwordHash = await bcrypt.hash(password, BCRYPT_COST);
const idOf = new Map<string, string>();
for (const a of accounts) {
  const [row] = await db
    .insert(users)
    .values({ ...a, passwordHash })
    .onConflictDoUpdate({
      target: users.phone,
      set: { name: a.name, role: a.role, passwordHash, active: true },
    })
    .returning({ id: users.id });
  idOf.set(a.phone, row!.id);
}

const verifier = idOf.get('9000000002')!;
const now = Date.now();
for (const v of volunteers) {
  const userId = idOf.get(v.phone)!;
  const [offeredCount, acceptedCount, declinedCount, withdrawnCount, completedCount] = v.counts;
  const profile = {
    available: v.available,
    ...place(...v.km),
    locationAt: new Date(now - v.ageMin * 60_000),
    offeredCount,
    acceptedCount,
    declinedCount,
    withdrawnCount,
    completedCount,
  };
  await db
    .insert(volunteerProfiles)
    .values({ userId, ...profile })
    .onConflictDoUpdate({ target: volunteerProfiles.userId, set: profile });
  for (const [skill, status] of v.skills) {
    const decided =
      status === 'unverified'
        ? { status, verifiedBy: null, verifiedAt: null }
        : { status, verifiedBy: verifier, verifiedAt: new Date(now) };
    await db
      .insert(volunteerSkills)
      .values({ userId, skill, ...decided })
      .onConflictDoUpdate({
        target: [volunteerSkills.userId, volunteerSkills.skill],
        set: decided,
      });
  }
}

for (const { capabilities, ...t } of seedTeams) {
  await db.insert(teams).values(t).onConflictDoUpdate({ target: teams.id, set: t });
  await db
    .insert(teamCapabilities)
    .values(capabilities.map((skill) => ({ teamId: t.id!, skill })))
    .onConflictDoNothing();
}

console.log(
  `Seeded ${String(accounts.length)} accounts, ${String(volunteers.length)} volunteer profiles and ${String(seedTeams.length)} teams.`,
);
await closeDb();
