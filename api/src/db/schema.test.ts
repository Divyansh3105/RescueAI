import { beforeEach, describe, expect, it } from 'vitest';
import { db } from './client.js';
import { users } from './schema.js';
import { truncateAll } from '../test/reset.js';

const user = { name: 'Test', phone: '9000000001', passwordHash: 'x', role: 'volunteer' as const };

describe('users table', () => {
  beforeEach(truncateAll);

  it('rejects a second user with the same phone', async () => {
    await db.insert(users).values(user);
    await expect(db.insert(users).values(user)).rejects.toThrow();
  });
});
