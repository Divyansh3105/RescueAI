import { Router } from 'express';
import { z } from 'zod';
import { phoneField } from '../auth/phone.js';
import { requireRole } from '../auth/middleware.js';
import { rateLimit } from '../rate-limit.js';
import { createRequest, FLAGS, listQueue } from '../services/requests.js';
import { validationFailed } from './http.js';

const count = z
  .number({ error: 'Enter a whole number.' })
  .int('Enter a whole number.')
  .min(0)
  .max(100_000);

const newRequest = z.object({
  lat: z
    .number({ error: 'Choose your location.' })
    .min(-90, 'Choose your location.')
    .max(90, 'Choose your location.'),
  lon: z
    .number({ error: 'Choose your location.' })
    .min(-180, 'Choose your location.')
    .max(180, 'Choose your location.'),
  hazard: z.enum(['flood', 'landslide'], { error: 'Choose flood or landslide.' }),
  phone: phoneField,
  contactName: z.string().trim().max(100).optional(),
  affected: count.optional(),
  trapped: count.optional(),
  injured: count.optional(),
  flags: z.array(z.enum(FLAGS)).default([]),
  description: z.string().trim().max(2000).optional(),
});

export const requestsRouter = Router();

// Public: the only unauthenticated write besides login (RULES.md -> API Rules). D-036: 30 per 10 minutes per IP.
requestsRouter.post('/', rateLimit({ max: 30, windowMs: 10 * 60_000 }), async (req, res) => {
  const parsed = newRequest.safeParse(req.body);
  if (!parsed.success) {
    validationFailed(res, parsed.error);
    return;
  }
  res.status(201).json({ ref: await createRequest(parsed.data) });
});

export const queueRouter = Router();

// On-site and office commanders only: the rows carry the citizen's phone number (AC14, AC18).
queueRouter.get('/', requireRole('onsite_commander', 'office_commander'), async (_req, res) => {
  res.json({ requests: await listQueue(new Date()) });
});
