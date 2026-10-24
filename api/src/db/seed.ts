// Demo accounts, one per role, with synthetic phone numbers (RULES.md: synthetic data only).
// Usage: SEED_PASSWORD=<at least 8 chars> npm run db:seed
// Re-running updates the password and never duplicates an account.
import bcrypt from 'bcryptjs';
import { BCRYPT_COST } from '../auth/sessions.js';
import { closeDb, db } from './client.js';
import { runMigrations } from './migrate.js';
import { users, type UserRole } from './schema.js';

const accounts: { phone: string; name: string; role: UserRole }[] = [
  { phone: '9000000001', name: 'Demo Volunteer', role: 'volunteer' },
  { phone: '9000000002', name: 'Demo On-site Commander', role: 'onsite_commander' },
  { phone: '9000000003', name: 'Demo Office Commander', role: 'office_commander' },
  { phone: '9000000004', name: 'Demo Admin', role: 'admin' },
];

const password = process.env.SEED_PASSWORD ?? '';
if (password.length < 8) {
  console.error('Set SEED_PASSWORD (at least 8 characters) to seed the demo accounts.');
  process.exit(1);
}

await runMigrations();
const passwordHash = await bcrypt.hash(password, BCRYPT_COST);
for (const a of accounts) {
  await db
    .insert(users)
    .values({ ...a, passwordHash })
    .onConflictDoUpdate({
      target: users.phone,
      set: { name: a.name, role: a.role, passwordHash, active: true },
    });
}
console.log(`Seeded ${String(accounts.length)} demo accounts.`);
await closeDb();
