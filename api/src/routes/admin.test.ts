import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { app } from '../app.js';
import { db } from '../db/client.js';
import { users, type UserRole } from '../db/schema.js';
import { truncateAll } from '../test/reset.js';

const PASSWORD = 'correct-horse';
const hash = await bcrypt.hash(PASSWORD, 4);

const cookieOf = (res: request.Response) =>
  ([] as string[])
    .concat(res.headers['set-cookie'] ?? [])
    .find((c) => c.startsWith('sid='))
    ?.split(';')[0];

async function signIn(role: UserRole, phone: string): Promise<string> {
  await db.insert(users).values({ name: `Test ${role}`, phone, passwordHash: hash, role });
  const res = await request(app).post('/api/auth/login').send({ phone, password: PASSWORD });
  return cookieOf(res)!;
}

const login = (phone: string, password: string) =>
  request(app).post('/api/auth/login').send({ phone, password });

const URL = '/api/admin/commanders';
const newCommander = { name: 'Asha Rawat', phone: '9876500001', role: 'onsite_commander' };

interface Created {
  user: { id: string; name: string; role: string; active: boolean };
  temporaryPassword: string;
}

describe('/api/admin/commanders', () => {
  beforeEach(truncateAll);

  it('AC18: only the Admin may list, create or change commanders', async () => {
    const anyId = '00000000-0000-4000-8000-000000000000';
    const calls = (sid?: string) => {
      const withCookie = (r: request.Test) => (sid ? r.set('Cookie', sid) : r);
      return [
        withCookie(request(app).get(URL)),
        withCookie(request(app).post(URL).send(newCommander)),
        withCookie(request(app).patch(`${URL}/${anyId}`).send({ active: false })),
      ];
    };
    for (const res of await Promise.all(calls())) expect(res.status).toBe(401);
    for (const [role, phone] of [
      ['volunteer', '9000000001'],
      ['onsite_commander', '9000000002'],
      ['office_commander', '9000000003'],
    ] as const) {
      const sid = await signIn(role, phone);
      for (const res of await Promise.all(calls(sid))) expect(res.status).toBe(403);
    }
    expect(await db.select().from(users)).toHaveLength(3);
  });

  it('AC18: the Admin creates a commander, who can sign in with the temporary password', async () => {
    const admin = await signIn('admin', '9000000004');
    const res = await request(app).post(URL).set('Cookie', admin).send(newCommander);
    expect(res.status).toBe(201);
    const body = res.body as Created;
    expect(body.user).toMatchObject({ name: 'Asha Rawat', role: 'onsite_commander', active: true });
    expect(body.user).not.toHaveProperty('phone');
    expect(body.user).not.toHaveProperty('passwordHash');
    expect(body.temporaryPassword.length).toBeGreaterThanOrEqual(10);

    expect((await login(newCommander.phone, body.temporaryPassword)).status).toBe(200);
    const list = await request(app).get(URL).set('Cookie', admin);
    expect(list.body).toEqual({
      commanders: [expect.objectContaining({ id: body.user.id, name: 'Asha Rawat' })],
    });
    expect(JSON.stringify(list.body)).not.toContain(newCommander.phone);
  });

  it('lists only commanders, not volunteers or the Admin', async () => {
    const admin = await signIn('admin', '9000000004');
    await signIn('volunteer', '9000000001');
    await signIn('office_commander', '9000000003');
    const res = await request(app).get(URL).set('Cookie', admin);
    const roles = (res.body as { commanders: { role: string }[] }).commanders.map((c) => c.role);
    expect(roles).toEqual(['office_commander']);
  });

  it('rejects another role, a bad phone, a blank name and a taken phone', async () => {
    const admin = await signIn('admin', '9000000004');
    const bad = await request(app)
      .post(URL)
      .set('Cookie', admin)
      .send({ name: ' ', phone: '12345', role: 'admin' });
    expect(bad.status).toBe(400);
    expect(Object.keys((bad.body as { error: { fields: object } }).error.fields).sort()).toEqual([
      'name',
      'phone',
      'role',
    ]);

    const taken = await request(app)
      .post(URL)
      .set('Cookie', admin)
      .send({ ...newCommander, phone: '9000000004' });
    expect(taken.status).toBe(409);
    expect((taken.body as { error: { code: string } }).error.code).toBe('phone_taken');
  });

  it('deactivating signs the commander out at once; reactivating lets them sign in again', async () => {
    const admin = await signIn('admin', '9000000004');
    const commander = await signIn('office_commander', '9000000003');
    const [row] = await db.select().from(users).where(eq(users.phone, '9000000003'));
    expect((await request(app).get('/api/queue').set('Cookie', commander)).status).toBe(200);

    const off = await request(app)
      .patch(`${URL}/${row!.id}`)
      .set('Cookie', admin)
      .send({ active: false });
    expect(off.status).toBe(200);
    expect((off.body as Created).user.active).toBe(false);
    expect((await request(app).get('/api/queue').set('Cookie', commander)).status).toBe(401);
    expect((await login('9000000003', PASSWORD)).status).toBe(401);

    await request(app).patch(`${URL}/${row!.id}`).set('Cookie', admin).send({ active: true });
    expect((await login('9000000003', PASSWORD)).status).toBe(200);
  });

  it('cannot deactivate a volunteer, the Admin or an unknown id', async () => {
    const admin = await signIn('admin', '9000000004');
    await signIn('volunteer', '9000000001');
    const others = await db.select({ id: users.id }).from(users);
    for (const { id } of others) {
      const res = await request(app)
        .patch(`${URL}/${id}`)
        .set('Cookie', admin)
        .send({ active: false });
      expect(res.status).toBe(404);
    }
    const junk = await request(app)
      .patch(`${URL}/not-a-uuid`)
      .set('Cookie', admin)
      .send({ active: false });
    expect(junk.status).toBe(404);
  });
});
