import { existsSync } from 'node:fs';
import path from 'node:path';
import express, { type ErrorRequestHandler } from 'express';
import { loadSession } from './auth/middleware.js';
import { pingDb } from './db/client.js';
import { env } from './env.js';
import { authRouter } from './routes/auth.js';
import { queueRouter, requestsRouter } from './routes/requests.js';

export const app = express();

// Behind Render's proxy req.ip is the proxy unless this is set; the rate limit keys on it.
// ponytail: assumes one proxy hop. Check X-Forwarded-For on the deployed site before relying on D-036.
if (env.isProduction) app.set('trust proxy', 1);

app.use(express.json());
app.use('/api', loadSession);
app.use('/api/auth', authRouter);
app.use('/api/requests', requestsRouter);
app.use('/api/queue', queueRouter);

app.get('/api/health', (_req, res) => {
  void pingDb().then((db) => res.json({ status: 'ok', db: db ? 'up' : 'down' }));
});

/*
 * In a built image the SPA sits next to the compiled API and is served from the
 * same origin, so the session cookie stays SameSite=Lax (see Dockerfile, D-044).
 * The directory does not exist during local `npm run dev` or in tests; there the
 * Vite dev server proxies /api here instead.
 */
const spaDir = path.resolve(import.meta.dirname, '../public');
const spaIndex = path.join(spaDir, 'index.html');

if (existsSync(spaIndex)) {
  app.use(express.static(spaDir));
  app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api/')) {
      next();
      return;
    }
    res.sendFile(spaIndex);
  });
}

// Every error response uses this shape (D-035). Never leak stack traces.
app.use((_req, res) => {
  res.status(404).json({ error: { code: 'not_found', message: 'Route not found.' } });
});

const onError: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: { code: 'internal_error', message: 'Something went wrong.' } });
};
app.use(onError);
