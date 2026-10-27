import bcrypt from 'bcryptjs';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { app } from '../app.js';
import { db } from '../db/client.js';
import { rescueRequests, users, type UserRole } from '../db/schema.js';
import { truncateAll } from '../test/reset.js';

const PASSWORD = 'correct-horse';
const hash = await bcrypt.hash(PASSWORD, 4);

async function signIn(role: UserRole, phone: string): Promise<string> {
  await db.insert(users).values({ name: 'Test User', phone, passwordHash: hash, role });
  const res = await request(app).post('/api/auth/login').send({ phone, password: PASSWORD });
  const raw = ([] as string[])
    .concat(res.headers['set-cookie'] ?? [])
    .find((c) => c.startsWith('sid='));
  return raw!.split(';')[0]!;
}

const valid = { lat: 30.32, lon: 78.03, hazard: 'flood', phone: '9876543210' };

interface QueueBody {
  requests: {
    ref: string;
    phone: string;
    severity: number;
    band: string;
    score: { total: number; factors: { contribution: number }[] };
  }[];
}
const queueOf = (res: request.Response) => (res.body as QueueBody).requests;

describe('POST /api/requests', () => {
  beforeEach(truncateAll);

  it('AC1/AC2: a citizen with no session gets 201 and a reference ID, and nothing else', async () => {
    const res = await request(app).post('/api/requests').send(valid);
    expect(res.status).toBe(201);
    expect(Object.keys(res.body as object)).toEqual(['ref']);
    expect((res.body as { ref: string }).ref).toMatch(/^RQ-\d{4,}$/);
  });

  it('AC1: missing location, hazard or phone fails with fields per input', async () => {
    const res = await request(app).post('/api/requests').send({});
    expect(res.status).toBe(400);
    const body = res.body as { error: { code: string; fields: Record<string, string> } };
    expect(body.error.code).toBe('validation_failed');
    expect(Object.keys(body.error.fields).sort()).toEqual(['hazard', 'lat', 'lon', 'phone']);
    expect(await db.select().from(rescueRequests)).toHaveLength(0);
  });

  it('AC1: a phone that is not a 10-digit Indian mobile number is rejected', async () => {
    const res = await request(app)
      .post('/api/requests')
      .send({ ...valid, phone: '12345' });
    expect(res.status).toBe(400);
    expect((res.body as { error: { fields: Record<string, string> } }).error.fields.phone).toEqual(
      expect.any(String),
    );
  });

  it('AC3: the stored severity comes from the F5 rule; a blank count is 0', async () => {
    await request(app).post('/api/requests').send(valid);
    await request(app)
      .post('/api/requests')
      .send({ ...valid, hazard: 'landslide', trapped: 3 });
    const rows = await db.select().from(rescueRequests);
    expect(rows.map((r) => r.severity).sort()).toEqual([1, 5]);
  });

  it('stores the normalized phone and the flags', async () => {
    await request(app)
      .post('/api/requests')
      .send({ ...valid, phone: '+91 98765 43210', flags: ['children', 'elderly'] });
    const [row] = await db.select().from(rescueRequests);
    expect(row).toMatchObject({ phone: '9876543210', flagChildren: true, flagElderly: true });
    expect(row!.flagInjured).toBe(false);
  });

  it('the database rejects an out-of-range severity, latitude or negative count', async () => {
    const row = {
      hazard: 'flood',
      lat: 30,
      lon: 78,
      phone: '9876543210',
      severity: 1,
    } as const;
    await expect(db.insert(rescueRequests).values({ ...row, severity: 6 })).rejects.toThrow();
    await expect(db.insert(rescueRequests).values({ ...row, lat: 91 })).rejects.toThrow();
    await expect(db.insert(rescueRequests).values({ ...row, trapped: -1 })).rejects.toThrow();
  });
});

describe('GET /api/queue', () => {
  beforeEach(truncateAll);

  it('AC18: rejects no session (401), a volunteer and the admin (403)', async () => {
    expect((await request(app).get('/api/queue')).status).toBe(401);
    for (const [role, phone] of [
      ['volunteer', '9000000001'],
      ['admin', '9000000004'],
    ] as const) {
      const sid = await signIn(role, phone);
      expect((await request(app).get('/api/queue').set('Cookie', sid)).status).toBe(403);
    }
  });

  it('AC2/AC14: a commander sees the request just submitted, with its phone number', async () => {
    const sid = await signIn('onsite_commander', '9000000002');
    const created = await request(app).post('/api/requests').send(valid);
    const rows = queueOf(await request(app).get('/api/queue').set('Cookie', sid));
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      ref: (created.body as { ref: string }).ref,
      phone: '9876543210',
    });
  });

  it('AC5: sorted by P(r) descending; equal scores put the older request first', async () => {
    const sid = await signIn('onsite_commander', '9000000002');
    const base = { hazard: 'flood', lat: 30, lon: 78, phone: '9876543210' } as const;
    const ago = (min: number) => new Date(Date.now() - min * 60_000);
    // Both past the Wait cap with equal severity and flags, so their scores tie.
    await db.insert(rescueRequests).values({ ...base, severity: 2, createdAt: ago(120) });
    await db.insert(rescueRequests).values({ ...base, severity: 2, createdAt: ago(300) });
    await db.insert(rescueRequests).values({ ...base, severity: 5, createdAt: ago(120) });
    const rows = queueOf(await request(app).get('/api/queue').set('Cookie', sid));
    expect(rows.map((r) => r.severity)).toEqual([5, 2, 2]);
    expect(rows[1]!.score.total).toBe(rows[2]!.score.total);
    const all = await db.select().from(rescueRequests);
    const oldest = all.find(
      (r) => r.createdAt.getTime() === Math.min(...all.map((x) => x.createdAt.getTime())),
    )!;
    expect(rows[1]!.ref).toBe(`RQ-${String(oldest.seq)}`);
  });

  it('AC9: each row’s factor contributions add up to its score', async () => {
    const sid = await signIn('office_commander', '9000000003');
    await request(app)
      .post('/api/requests')
      .send({ ...valid, trapped: 2, injured: 1, flags: ['children'] });
    const [row] = queueOf(await request(app).get('/api/queue').set('Cookie', sid));
    const sum = row!.score.factors.reduce((s, f) => s + f.contribution, 0);
    expect(row!.score.total).toBeCloseTo(sum, 10);
  });

  it('F6: resolved and cancelled requests are not in the queue', async () => {
    const sid = await signIn('onsite_commander', '9000000002');
    const base = { hazard: 'flood', lat: 30, lon: 78, phone: '9876543210', severity: 1 } as const;
    await db.insert(rescueRequests).values({ ...base, status: 'resolved' });
    await db.insert(rescueRequests).values({ ...base, status: 'cancelled' });
    await db.insert(rescueRequests).values({ ...base, status: 'in_progress' });
    expect(queueOf(await request(app).get('/api/queue').set('Cookie', sid))).toHaveLength(1);
  });
});
