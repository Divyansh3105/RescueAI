import { existsSync } from 'node:fs';
import path from 'node:path';
import express, { type ErrorRequestHandler } from 'express';
import { pingDb } from './db/client.js';

export const app = express();

app.use(express.json());

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
