import bcrypt from 'bcryptjs';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { app } from '../app.js';
import { db } from '../db/client.js';
import { users } from '../db/schema.js';
import { truncateAll } from '../test/reset.js';

const PASSWORD = 'correct-horse';

const login = (phone: string, password: string) =>
  request(app).post('/api/auth/login').send({ phone, password });

describe('POST /api/auth/login rate limit', () => {
  beforeEach(truncateAll);

  it('D-057: the 11th attempt on one phone in the window gets 429, even with the right password', async () => {
    const passwordHash = await bcrypt.hash(PASSWORD, 4);
    await db.insert(users).values([
      { name: 'Target', phone: '9000000001', passwordHash, role: 'onsite_commander' },
      { name: 'Other', phone: '9000000002', passwordHash, role: 'volunteer' },
    ]);
    for (let i = 0; i < 10; i++) {
      // Spelled differently each time: still one account.
      const phone = i % 2 ? '+91 90000 00001' : '9000000001';
      expect((await login(phone, 'wrong-password')).status).toBe(401);
    }
    const res = await login('9000000001', PASSWORD);
    expect(res.status).toBe(429);
    expect((res.body as { error: { code: string } }).error.code).toBe('rate_limited');
    expect(Number(res.headers['retry-after'])).toBeGreaterThan(0);

    // Another account from the same IP is unaffected.
    expect((await login('9000000002', PASSWORD)).status).toBe(200);
  });

  it('D-057: the 101st attempt from one IP in the window gets 429, whatever the phone', async () => {
    for (let i = 0; i < 100; i++) {
      expect((await login('not-a-phone', 'short')).status).toBe(400);
    }
    expect((await login('9000000003', PASSWORD)).status).toBe(429);
  });
});
