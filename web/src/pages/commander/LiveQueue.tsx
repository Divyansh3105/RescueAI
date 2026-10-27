import { useQuery } from '@tanstack/react-query';
import { PriorityBadge, ScoreBreakdown, StatusBadge } from '@/components/domain';
import { ApiError, apiFetch } from '@/lib/api';
import { cn } from '@/lib/utils';
import { navigate, usePath } from '@/router';
import type { Band, Scored } from '@/sample/data';
import { CommanderShell } from '@/shells/CommanderShell';

// One row of GET /api/queue. The server does all the scoring; this screen only shows it.
interface QueueRow {
  ref: string;
  hazard: 'flood' | 'landslide';
  lat: number;
  lon: number;
  affected: number | null;
  trapped: number | null;
  injured: number | null;
  flags: string[];
  description: string | null;
  contactName: string | null;
  phone: string;
  status: 'pending' | 'in_progress';
  severity: number;
  createdAt: string;
  score: Scored;
  band: Band;
}

const POLL_MS = 5000; // ARCHITECTURE.md -> API Architecture: polling, about every 5 s.

const waited = (m: number) =>
  m < 60 ? `${String(m)} min` : `${String(Math.floor(m / 60))} h ${String(m % 60)} min`;
const minutesSince = (iso: string) =>
  Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60_000));
const hazardLabel = (h: QueueRow['hazard']) => (h === 'flood' ? 'Flood' : 'Landslide');
const statusLabel = (s: QueueRow['status']) => (s === 'pending' ? 'Pending' : 'In Progress');
const count = (n: number | null) => (n === null ? '-' : n);

/**
 * The on-site commander's prioritized queue, from the API (PRD F6). Recommendations and the
 * selection step are not connected yet; the office commander's screen is still sample data.
 */
export function LiveQueue() {
  const { path, search } = usePath();
  const q = useQuery({
    queryKey: ['queue'],
    queryFn: () => apiFetch<{ requests: QueueRow[] }>('/api/queue').then((r) => r.requests),
    refetchInterval: POLL_MS,
  });
  const rows = q.data ?? [];
  const selectedRef = search.get('r');
  const selected = rows.find((r) => r.ref === selectedRef) ?? null;
  const select = (ref: string | null) =>
    navigate(ref ? `${path}?r=${ref}` : path, { replace: true });

  const summary: [string, number, string?][] = [
    ['Open requests', rows.length],
    ['Critical', rows.filter((r) => r.band === 'Critical').length, 'text-red-700'],
    ['High', rows.filter((r) => r.band === 'High').length, 'text-amber-800'],
  ];

  return (
    <CommanderShell
      title="Queue"
      description="Pending and in-progress requests, highest priority first."
      fill
    >
      <dl className="grid grid-cols-3 border-y">
        {summary.map(([label, value, tone]) => (
          <div key={label} className="border-r px-4 py-2 last:border-r-0 lg:px-6">
            <dt className="text-muted-foreground text-xs">{label}</dt>
            <dd className={cn('text-lg font-semibold tabular-nums', tone)}>{value}</dd>
          </div>
        ))}
      </dl>

      <div className="grid min-h-0 flex-1 lg:grid-cols-2 xl:grid-cols-5">
        <section
          aria-label="Requests"
          className={cn('border-r lg:overflow-y-auto xl:col-span-2', selected && 'hidden lg:block')}
        >
          {q.isPending ? (
            <p className="text-muted-foreground p-6">Loading the queue…</p>
          ) : q.error && !q.data ? (
            <p role="alert" className="p-6 text-red-700">
              {q.error instanceof ApiError ? q.error.message : 'Could not load the queue.'}
            </p>
          ) : rows.length === 0 ? (
            <p className="text-muted-foreground p-6">No pending requests.</p>
          ) : (
            <table className="w-full tabular-nums">
              <thead className="bg-muted text-muted-foreground sticky top-0 text-xs">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">Request</th>
                  <th className="px-2 py-2 text-right font-medium">Sev</th>
                  <th className="hidden px-2 py-2 text-right font-medium xl:table-cell">Vul</th>
                  <th className="px-2 py-2 text-right font-medium">Waiting</th>
                  <th className="px-4 py-2 text-left font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.ref}
                    tabIndex={0}
                    aria-selected={r.ref === selectedRef}
                    onClick={() => select(r.ref)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') select(r.ref);
                    }}
                    className={cn(
                      'focus-visible:ring-ring cursor-pointer border-t border-l-4 border-l-transparent align-top hover:bg-slate-50 focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset',
                      r.ref === selectedRef && 'border-l-primary bg-muted',
                    )}
                  >
                    <td className="w-full px-4 py-3">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="font-semibold whitespace-nowrap">{r.ref}</span>
                        <PriorityBadge band={r.band} score={r.score.total} />
                      </div>
                      <div className="text-muted-foreground mt-1 text-xs">
                        {hazardLabel(r.hazard)} · {r.lat.toFixed(4)}, {r.lon.toFixed(4)}
                      </div>
                    </td>
                    <td className="px-2 py-3 text-right">{r.severity}</td>
                    <td className="hidden px-2 py-3 text-right xl:table-cell">
                      {r.flags.length}/4
                    </td>
                    <td className="px-2 py-3 text-right whitespace-nowrap">
                      {waited(minutesSince(r.createdAt))}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={statusLabel(r.status)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section aria-label="Request detail" className="min-w-0 lg:overflow-y-auto xl:col-span-3">
          {selected ? (
            <Detail key={selected.ref} r={selected} onBack={() => select(null)} />
          ) : (
            <p className="text-muted-foreground hidden p-6 lg:block">
              Select a request to see its details.
            </p>
          )}
        </section>
      </div>
    </CommanderShell>
  );
}

function Detail({ r, onBack }: { r: QueueRow; onBack: () => void }) {
  const minutes = minutesSince(r.createdAt);
  return (
    <div className="space-y-6 p-4 lg:p-6">
      <button
        type="button"
        onClick={onBack}
        className="text-primary underline-offset-4 hover:underline lg:hidden"
      >
        ← Back to queue
      </button>

      <header className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-semibold">
            {r.ref} · {hazardLabel(r.hazard)}
          </h2>
          <PriorityBadge band={r.band} score={r.score.total} />
          <StatusBadge status={statusLabel(r.status)} />
        </div>
        <p className="text-muted-foreground">
          <a
            className="text-primary underline-offset-4 hover:underline"
            href={`https://www.openstreetmap.org/?mlat=${String(r.lat)}&mlon=${String(r.lon)}#map=15/${String(r.lat)}/${String(r.lon)}`}
            target="_blank"
            rel="noreferrer"
          >
            {r.lat.toFixed(5)}, {r.lon.toFixed(5)}
          </a>{' '}
          · reported <time dateTime={r.createdAt}>{waited(minutes)} ago</time>
        </p>
      </header>

      <div className="grid gap-4 xl:grid-cols-3">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4 xl:col-span-2">
          {(
            [
              ['Severity', `${String(r.severity)} of 5`],
              ['Trapped', count(r.trapped)],
              ['Injured', count(r.injured)],
              ['Affected', count(r.affected)],
            ] as const
          ).map(([k, v]) => (
            <div key={k}>
              <dt className="text-muted-foreground text-xs">{k}</dt>
              <dd className="text-base font-medium tabular-nums">{v}</dd>
            </div>
          ))}
          <div className="col-span-2 sm:col-span-4">
            <dt className="text-muted-foreground text-xs">Vulnerable people</dt>
            <dd>{r.flags.length ? r.flags.join(', ') : 'None reported'}</dd>
          </div>
        </dl>
        {/* AC14/AC18: the API only sends the citizen's phone number to commander roles. */}
        <div className="rounded-lg border px-4 py-3">
          <p className="text-muted-foreground text-xs">Contact · commanders only</p>
          <p className="font-medium">{r.contactName ?? 'Name not given'}</p>
          <p className="tabular-nums">{r.phone}</p>
        </div>
      </div>
      {r.description && (
        <blockquote className="border-l-2 border-slate-500 pl-3">“{r.description}”</blockquote>
      )}

      <section className="space-y-2">
        <h3 className="text-base font-semibold">Why this priority</h3>
        <ScoreBreakdown
          reason={`Severity ${String(r.severity)} from the rule table, ${String(r.flags.length)} of 4 vulnerability flags, waiting ${waited(minutes)}.`}
          score={r.score}
        />
      </section>

      <p className="text-muted-foreground bg-muted rounded-md border px-3 py-2 text-sm">
        Responder recommendations and the selection step are not connected yet.
      </p>
    </div>
  );
}
