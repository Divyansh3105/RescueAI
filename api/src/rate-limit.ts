import type { Request, RequestHandler } from 'express';

const allCounters = new Set<Map<string, unknown>>();

/** Test-only: forget every limiter's counts, so one test's logins don't block the next. */
export function resetRateLimits(): void {
  for (const hits of allCounters) hits.clear();
}

/**
 * Fixed-window limit, in memory, keyed by client IP unless `key` says otherwise
 * (D-036: 30 per 10 minutes on the public form; D-057: login, per phone and per IP).
 * A `key` that returns undefined lets the request through uncounted.
 * ponytail: per-process and fixed-window; one Render instance today. Move the counters to
 * the database if the API ever runs on more than one instance.
 */
export function rateLimit(opts: {
  max: number;
  windowMs: number;
  key?: (req: Request) => string | undefined;
  now?: () => number;
}): RequestHandler {
  const now = opts.now ?? Date.now;
  const keyOf = opts.key ?? ((req: Request) => req.ip ?? 'unknown');
  const hits = new Map<string, { count: number; resetAt: number }>();
  allCounters.add(hits);
  return (req, res, next) => {
    const t = now();
    for (const [key, hit] of hits) if (hit.resetAt <= t) hits.delete(key);
    const key = keyOf(req);
    if (key === undefined) {
      next();
      return;
    }
    const hit = hits.get(key) ?? { count: 0, resetAt: t + opts.windowMs };
    hits.set(key, hit);
    if (hit.count >= opts.max) {
      res.set('Retry-After', String(Math.ceil((hit.resetAt - t) / 1000)));
      res.status(429).json({
        error: { code: 'rate_limited', message: 'Too many requests. Try again in a few minutes.' },
      });
      return;
    }
    hit.count += 1;
    next();
  };
}
