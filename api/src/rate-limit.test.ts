import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { rateLimit } from './rate-limit.js';

function appWith(now: () => number) {
  const app = express();
  app.use(rateLimit({ max: 2, windowMs: 1000, now }));
  app.get('/', (_req, res) => {
    res.json({ ok: true });
  });
  return app;
}

describe('rateLimit', () => {
  it('allows `max` requests, then 429 rate_limited in the D-035 shape with Retry-After', async () => {
    const app = appWith(() => 0);
    expect((await request(app).get('/')).status).toBe(200);
    expect((await request(app).get('/')).status).toBe(200);
    const res = await request(app).get('/');
    expect(res.status).toBe(429);
    expect((res.body as { error: { code: string } }).error.code).toBe('rate_limited');
    expect(res.headers['retry-after']).toBe('1');
  });

  it('starts a new window once the old one has passed', async () => {
    let t = 0;
    const app = appWith(() => t);
    await request(app).get('/');
    await request(app).get('/');
    expect((await request(app).get('/')).status).toBe(429);
    t = 1000;
    expect((await request(app).get('/')).status).toBe(200);
  });
});
