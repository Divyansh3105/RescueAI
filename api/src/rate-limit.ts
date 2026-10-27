import type { RequestHandler } from 'express';

/**
 * Fixed-window limit per client IP, in memory (D-036: 30 per 10 minutes on the public form).
 * ponytail: per-process and fixed-window; one Render instance today. Move the counters to
 * the database if the API ever runs on more than one instance.
 */
export function rateLimit(opts: {
  max: number;
  windowMs: number;
  now?: () => number;
}): RequestHandler {
  const now = opts.now ?? Date.now;
  const hits = new Map<string, { count: number; resetAt: number }>();
  return (req, res, next) => {
    const t = now();
    for (const [key, hit] of hits) if (hit.resetAt <= t) hits.delete(key);
    const key = req.ip ?? 'unknown';
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
