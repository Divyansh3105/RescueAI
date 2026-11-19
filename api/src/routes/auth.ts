import { Router, type CookieOptions } from 'express';
import { z } from 'zod';
import { normalizePhone, phoneField } from '../auth/phone.js';
import { SESSION_COOKIE, sessionToken } from '../auth/middleware.js';
import { createSession, deleteSession, SESSION_HOURS, verifyLogin } from '../auth/sessions.js';
import { env } from '../env.js';
import { rateLimit } from '../rate-limit.js';
import { validationFailed } from './http.js';

const loginBody = z.object({
  phone: phoneField,
  password: z
    .string({ error: 'Enter your password.' })
    .min(8, 'Password must be at least 8 characters.'),
});

const cookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: env.isProduction,
  path: '/',
};

export const authRouter = Router();

/*
 * D-057: guessing is limited per account first. Indian carriers put many phones behind one
 * IP (D-036), so the per-IP limit is loose and only stops one machine spraying many accounts.
 * Every attempt counts, successful ones included, and a malformed phone isn't counted per
 * account (validation rejects it anyway).
 */
const WINDOW_MS = 15 * 60_000;
const perPhone = rateLimit({
  max: 10,
  windowMs: WINDOW_MS,
  key: (req) => {
    const phone: unknown = (req.body as { phone?: unknown } | undefined)?.phone;
    return typeof phone === 'string' ? (normalizePhone(phone) ?? undefined) : undefined;
  },
});
const perIp = rateLimit({ max: 100, windowMs: WINDOW_MS });

// Public: one of the two public routes (RULES.md -> API Rules).
authRouter.post('/login', perIp, perPhone, async (req, res) => {
  const parsed = loginBody.safeParse(req.body);
  if (!parsed.success) {
    validationFailed(res, parsed.error);
    return;
  }
  const user = await verifyLogin(parsed.data.phone, parsed.data.password);
  if (!user) {
    res.status(401).json({
      error: { code: 'invalid_credentials', message: 'The mobile number or password is wrong.' },
    });
    return;
  }
  const { token } = await createSession(user.id);
  res.cookie(SESSION_COOKIE, token, { ...cookieOptions, maxAge: SESSION_HOURS * 3600 * 1000 });
  res.json({ user });
});

// All users.
authRouter.post('/logout', async (req, res) => {
  const token = sessionToken(req);
  if (token) await deleteSession(token);
  res.clearCookie(SESSION_COOKIE, cookieOptions);
  res.status(204).end();
});

// All users.
authRouter.get('/me', (_req, res) => {
  const user = res.locals.user;
  if (!user) {
    res.status(401).json({ error: { code: 'unauthenticated', message: 'Sign in first.' } });
    return;
  }
  res.json({ user });
});
