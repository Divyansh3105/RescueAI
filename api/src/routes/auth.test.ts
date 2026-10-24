import { createHash } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { app } from '../app.js';
import { loadSession, requireRole } from '../auth/middleware.js';
import { db } from '../db/client.js';
import { sessions, users, type UserRole } from '../db/schema.js';
import { truncateAll } from '../test/reset.js';

const PASSWORD = 'correct-horse';
const hash = await bcrypt.hash(PASSWORD, 4);

async function makeUser(role: UserRole = 'volunteer', phone = '9000000001', active = true) {
  const [u] = await db
    .insert(users)
    .values({ name: 'Test User', phone, passwordHash: hash, role, active })
    .returning();
  return u!;
}

function sidFrom(res: request.Response): string {
  const raw = ([] as string[])
    .concat(res.headers['set-cookie'] ?? [])
    .find((c) => c.startsWith('sid='));
  return raw!.split(';')[0]!;
}

interface Body {
  user: Record<string, string>;
  error: { code: string; fields: Record<string, string> };
}
const body = (res: request.Response) => res.body as Body;

async function login(phone = '9000000001', password = PASSWORD) {
  return request(app).post('/api/auth/login').send({ phone, password });
}

describe('auth', () => {
  beforeEach(truncateAll);

  it('AC18: login with the right password sets an httpOnly SameSite=Lax sid cookie and returns only id, name, role', async () => {
    const u = await makeUser();
    const res = await login();
    expect(res.status).toBe(200);
    expect(Object.keys(body(res).user as object).sort()).toEqual(['id', 'name', 'role']);
    expect(body(res).user).toEqual({ id: u.id, name: 'Test User', role: 'volunteer' });
    const cookie = ([] as string[]).concat(res.headers['set-cookie'] ?? []).join(';');
    expect(cookie).toMatch(/sid=/);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Lax/i);
    expect(cookie).toMatch(/Max-Age=43200/i);
  });

  it('login accepts +91 and spaces in the phone number', async () => {
    await makeUser();
    expect((await login('+91 90000 00001')).status).toBe(200);
  });

  it('wrong password, unknown phone and deactivated user return the same 401 invalid_credentials body', async () => {
    await makeUser();
    await makeUser('volunteer', '9000000002', false);
    const wrong = await login('9000000001', 'wrong-password');
    const unknown = await login('9999999999');
    const inactive = await login('9000000002');
    for (const res of [wrong, unknown, inactive]) {
      expect(res.status).toBe(401);
      expect(res.body).toEqual(wrong.body);
      expect(res.headers['set-cookie']).toBeUndefined();
    }
    expect(body(wrong).error.code).toBe('invalid_credentials');
  });

  it('missing or 7-character password returns 400 validation_failed with fields.password', async () => {
    for (const input of [{ phone: '9000000001' }, { phone: '9000000001', password: '1234567' }]) {
      const res = await request(app).post('/api/auth/login').send(input);
      expect(res.status).toBe(400);
      expect(body(res).error.code).toBe('validation_failed');
      expect(body(res).error.fields.password).toEqual(expect.any(String));
    }
  });

  it('bad phone returns 400 validation_failed with fields.phone', async () => {
    const res = await login('12345');
    expect(res.status).toBe(400);
    expect(body(res).error.fields.phone).toEqual(expect.any(String));
  });

  it('me returns the user with the cookie and 401 unauthenticated without it', async () => {
    await makeUser('admin');
    const sid = sidFrom(await login());
    const me = await request(app).get('/api/auth/me').set('Cookie', sid);
    expect(me.status).toBe(200);
    expect(body(me).user.role).toBe('admin');
    const anon = await request(app).get('/api/auth/me');
    expect(anon.status).toBe(401);
    expect(body(anon).error.code).toBe('unauthenticated');
  });

  it('an expired session returns 401', async () => {
    await makeUser();
    const sid = sidFrom(await login());
    await db.update(sessions).set({ expiresAt: new Date(Date.now() - 1000) });
    expect((await request(app).get('/api/auth/me').set('Cookie', sid)).status).toBe(401);
  });

  it('a session of a user deactivated after login returns 401', async () => {
    const u = await makeUser();
    const sid = sidFrom(await login());
    await db.update(users).set({ active: false }).where(eq(users.id, u.id));
    expect((await request(app).get('/api/auth/me').set('Cookie', sid)).status).toBe(401);
  });

  it('logout deletes the session; the old cookie then gets 401 from me', async () => {
    await makeUser();
    const sid = sidFrom(await login());
    const out = await request(app).post('/api/auth/logout').set('Cookie', sid);
    expect(out.status).toBe(204);
    expect(([] as string[]).concat(out.headers['set-cookie'] ?? []).join(';')).toMatch(/sid=;/);
    expect(await db.select().from(sessions)).toHaveLength(0);
    expect((await request(app).get('/api/auth/me').set('Cookie', sid)).status).toBe(401);
  });

  it('the sessions table stores a hash, not the cookie value', async () => {
    await makeUser();
    const token = sidFrom(await login()).slice('sid='.length);
    const [row] = await db.select().from(sessions);
    expect(row!.tokenHash).not.toBe(token);
    expect(row!.tokenHash).toBe(createHash('sha256').update(token).digest('hex'));
  });

  it('requireRole returns 403 forbidden for the wrong role and 401 without a session', async () => {
    await makeUser('volunteer');
    const sid = sidFrom(await login());
    const probe = express();
    probe.use(loadSession);
    probe.get('/admin-only', requireRole('admin'), (_req, res) => {
      res.json({ ok: true });
    });
    const wrongRole = await request(probe).get('/admin-only').set('Cookie', sid);
    expect(wrongRole.status).toBe(403);
    expect(body(wrongRole).error.code).toBe('forbidden');
    expect((await request(probe).get('/admin-only')).status).toBe(401);
  });
});
