import { createHash, randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { and, eq, gt } from 'drizzle-orm';
import { db } from '../db/client.js';
import { sessions, users, type UserRole } from '../db/schema.js';

/** The only user shape any response carries. Never the phone or the hash. */
export interface PublicUser {
  id: string;
  name: string;
  role: UserRole;
}

export const SESSION_HOURS = 12; // D-037
export const BCRYPT_COST = 12;

// Compared against when the phone is unknown, so response time doesn't reveal which
// phones have accounts.
const DUMMY_HASH = bcrypt.hashSync('timing-equalizer', BCRYPT_COST);

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

const toPublic = (u: PublicUser): PublicUser => ({ id: u.id, name: u.name, role: u.role });

/** The user for a correct phone + password on an active account, else null. */
export async function verifyLogin(phone: string, password: string): Promise<PublicUser | null> {
  const [u] = await db.select().from(users).where(eq(users.phone, phone));
  const ok = await bcrypt.compare(password, u?.passwordHash ?? DUMMY_HASH);
  return u && ok && u.active ? toPublic(u) : null;
}

export async function createSession(userId: string): Promise<{ token: string; expiresAt: Date }> {
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + SESSION_HOURS * 3600 * 1000);
  await db.insert(sessions).values({ tokenHash: hashToken(token), userId, expiresAt });
  return { token, expiresAt };
}

/** The signed-in user for a cookie token: null if unknown, expired or deactivated. */
export async function findSession(token: string): Promise<PublicUser | null> {
  const [row] = await db
    .select({ id: users.id, name: users.name, role: users.role })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(
      and(
        eq(sessions.tokenHash, hashToken(token)),
        gt(sessions.expiresAt, new Date()),
        eq(users.active, true),
      ),
    );
  return row ? toPublic(row) : null;
}

export async function deleteSession(token: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.tokenHash, hashToken(token)));
}
