import type { Request, RequestHandler } from 'express';
import type { UserRole } from '../db/schema.js';
import { findSession, type PublicUser } from './sessions.js';

// Types res.locals.user everywhere.
declare module 'express-serve-static-core' {
  interface Locals {
    user?: PublicUser;
  }
}

export const SESSION_COOKIE = 'sid';

/** Reads the session cookie by hand; one cookie doesn't justify cookie-parser. */
export function sessionToken(req: Request): string | undefined {
  for (const part of req.headers.cookie?.split(';') ?? []) {
    const [name, ...rest] = part.trim().split('=');
    if (name === SESSION_COOKIE) return decodeURIComponent(rest.join('='));
  }
  return undefined;
}

/** Sets res.locals.user from the session cookie, if it is valid. */
export const loadSession: RequestHandler = (req, res, next) => {
  const token = sessionToken(req);
  if (!token) {
    next();
    return;
  }
  findSession(token)
    .then((user) => {
      if (user) res.locals.user = user;
      next();
    })
    .catch(next);
};

/** Every non-public route declares its roles with this (RULES.md -> API Rules). */
export function requireRole(...roles: UserRole[]): RequestHandler {
  return (_req, res, next) => {
    const user = res.locals.user;
    if (!user) {
      res.status(401).json({ error: { code: 'unauthenticated', message: 'Sign in first.' } });
      return;
    }
    if (!roles.includes(user.role)) {
      res.status(403).json({ error: { code: 'forbidden', message: 'Your role cannot do this.' } });
      return;
    }
    next();
  };
}
