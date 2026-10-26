import { Router, type CookieOptions } from 'express';
import { z } from 'zod';
import { normalizePhone } from '../auth/phone.js';
import { SESSION_COOKIE, sessionToken } from '../auth/middleware.js';
import { createSession, deleteSession, SESSION_HOURS, verifyLogin } from '../auth/sessions.js';
import { env } from '../env.js';

const loginBody = z.object({
  phone: z.string({ error: 'Enter your mobile number.' }).transform((v, ctx) => {
    const phone = normalizePhone(v);
    if (!phone) {
      ctx.addIssue({ code: 'custom', message: 'Enter a 10-digit mobile number.' });
      return z.NEVER;
    }
    return phone;
  }),
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

// Public: one of the two public routes (RULES.md -> API Rules).
authRouter.post('/login', async (req, res) => {
  const parsed = loginBody.safeParse(req.body);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) fields[String(issue.path[0])] ??= issue.message;
    res.status(400).json({
      error: { code: 'validation_failed', message: 'Check the highlighted fields.', fields },
    });
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
