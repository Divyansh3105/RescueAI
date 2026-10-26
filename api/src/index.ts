import { app } from './app.js';
import { runMigrations } from './db/migrate.js';
import { env } from './env.js';

await runMigrations();

app.listen(env.port, () => {
  console.log(`api listening on ${String(env.port)}`);
});
