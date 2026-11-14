import { randomInt } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { and, asc, eq, inArray } from 'drizzle-orm';
import { BCRYPT_COST } from '../auth/sessions.js';
import { db } from '../db/client.js';
import { sessions, users } from '../db/schema.js';

export const COMMANDER_ROLES = ['onsite_commander', 'office_commander'] as const;
export type CommanderRole = (typeof COMMANDER_ROLES)[number];

/** What the Admin sees of a commander. Never the phone or the hash (AC18). */
const commanderColumns = {
  id: users.id,
  name: users.name,
  role: users.role,
  active: users.active,
  createdAt: users.createdAt,
};

// No 0/O, 1/l/i: the Admin reads the password out over the phone (D-051).
const ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789';

/** A random 10-character password, shown to the Admin once and stored only as a hash. */
export const temporaryPassword = () =>
  Array.from({ length: 10 }, () => ALPHABET[randomInt(ALPHABET.length)]).join('');

export const listCommanders = () =>
  db
    .select(commanderColumns)
    .from(users)
    .where(inArray(users.role, [...COMMANDER_ROLES]))
    .orderBy(asc(users.name));

/** Null when the phone already has an account. */
export async function createCommander(input: { name: string; phone: string; role: CommanderRole }) {
  const password = temporaryPassword();
  const passwordHash = await bcrypt.hash(password, BCRYPT_COST);
  const [user] = await db
    .insert(users)
    .values({ ...input, passwordHash })
    .onConflictDoNothing({ target: users.phone })
    .returning(commanderColumns);
  return user ? { user, temporaryPassword: password } : null;
}

/** Null when the id is not a commander. Deactivating also ends their sessions. */
export async function setCommanderActive(id: string, active: boolean) {
  return db.transaction(async (tx) => {
    const [user] = await tx
      .update(users)
      .set({ active })
      .where(and(eq(users.id, id), inArray(users.role, [...COMMANDER_ROLES])))
      .returning(commanderColumns);
    if (user && !active) await tx.delete(sessions).where(eq(sessions.userId, id));
    return user ?? null;
  });
}
