import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { app } from '../app.js';
import { truncateAll } from '../test/reset.js';

// Own file: the limiter's counters live in the module, so this must not share them with other tests.
describe('POST /api/requests rate limit', () => {
  beforeEach(truncateAll);

  it('D-036: the 31st request from one IP in the window gets 429 rate_limited', async () => {
    const body = { lat: 30.32, lon: 78.03, hazard: 'flood', phone: '9876543210' };
    for (let i = 0; i < 30; i++) {
      expect((await request(app).post('/api/requests').send(body)).status).toBe(201);
    }
    const res = await request(app).post('/api/requests').send(body);
    expect(res.status).toBe(429);
    expect((res.body as { error: { code: string } }).error.code).toBe('rate_limited');
  });
});
