import { useQuery } from '@tanstack/react-query';

type Health = { status: string; db: string };

/**
 * Phase 1 placeholder (PLAN.md): proves the SPA, the API and the database are
 * wired together over HTTPS. Replaced by the real role shells in Phase 2.
 */
export default function App() {
  const health = useQuery({
    queryKey: ['health'],
    queryFn: async (): Promise<Health> => {
      const res = await fetch('/api/health');
      if (!res.ok) throw new Error('health check failed');
      return (await res.json()) as Health;
    },
  });

  return (
    <main className="mx-auto max-w-2xl space-y-6 px-4 py-12 lg:px-6">
      <h1 className="text-2xl font-semibold">RescueAI</h1>
      <p className="text-muted-foreground text-sm">
        Disaster response decision support. Setup in progress &mdash; no features are built yet.
      </p>
      <dl className="rounded-lg border p-4 text-sm tabular-nums">
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">API</dt>
          <dd>
            {health.isPending ? 'checking…' : health.isError ? 'unreachable' : health.data.status}
          </dd>
        </div>
        <div className="mt-2 flex justify-between gap-2">
          <dt className="text-muted-foreground">Database</dt>
          <dd>{health.isPending ? 'checking…' : health.isError ? 'unknown' : health.data.db}</dd>
        </div>
      </dl>
    </main>
  );
}
