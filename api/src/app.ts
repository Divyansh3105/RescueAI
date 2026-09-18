import express, { type ErrorRequestHandler } from 'express';
import { pingDb } from './db/client.js';

export const app = express();

app.use(express.json());

app.get('/api/health', (_req, res) => {
  void pingDb().then((db) => res.json({ status: 'ok', db: db ? 'up' : 'down' }));
});

// Every error response uses this shape (D-035). Never leak stack traces.
app.use((_req, res) => {
  res.status(404).json({ error: { code: 'not_found', message: 'Route not found.' } });
});

const onError: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: { code: 'internal_error', message: 'Something went wrong.' } });
};
app.use(onError);
