import { lazy, Suspense, useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
  band,
  priority,
  rankTeams,
  rankVolunteers,
  requests,
  requiredSkills,
  severity,
  teams,
  volunteers,
  type RescueRequest,
} from './data';
import {
  PriorityBadge,
  RecommendationCard,
  ScoreBreakdown,
  SkillChip,
  StatusBadge,
  type Status,
} from './parts';

export type Role = 'onsite' | 'office';
export interface Decision {
  status: 'Awaiting approval' | 'Approved' | 'Sent back';
  picked: string[];
  note?: string;
  // Who did what, when. Mirrors the two audit-log entries AC22 requires.
  selectedBy: string;
  selectedAt: string;
  decidedBy?: string;
  decidedAt?: string;
}
type Decisions = Record<string, Decision | undefined>;

// Sample accounts. AC22: the selector and the approver are different users.
const people: Record<Role, { name: string; title: string }> = {
  onsite: { name: 'Insp. Anil Rawat', title: 'On-site commander, SDRF' },
  office: { name: 'Dy. Cmdt. Priya Sharma', title: 'Office commander, District EOC' },
};

const clock = () =>
  new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });

// PRD AC5: sort by P(r) descending; on a tie the older request ranks higher.
const queue = requests
  .map((r) => ({ r, p: priority(r) }))
  .sort((a, b) => b.p.total - a.p.total || b.r.minutesAgo - a.r.minutesAgo);

// Leaflet is loaded only when a commander opens the map, so citizen phones never download it.
const MapView = lazy(() => import('./MapView').then((m) => ({ default: m.MapView })));

type Section = 'Queue' | 'Map' | 'Volunteers' | 'Teams' | 'Audit Log';

const icon = (d: string) => (
  <svg
    viewBox="0 0 16 16"
    aria-hidden="true"
    className="size-4 shrink-0"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d={d} />
  </svg>
);

const sections: [Section, React.ReactNode, boolean][] = [
  ['Queue', icon('M2.5 4h11M2.5 8h11M2.5 12h7'), true],
  ['Map', icon('M1.5 3.5l4-1.5 5 2 4-1.5v10l-4 1.5-5-2-4 1.5zM5.5 2v10M10.5 4v10'), true],
  [
    'Volunteers',
    icon('M8 7.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM3 14c.5-2.8 2.5-4.5 5-4.5s4.5 1.7 5 4.5'),
    false,
  ],
  ['Teams', icon('M8 1.5l5.5 2v4c0 3.5-2.4 6-5.5 7-3.1-1-5.5-3.5-5.5-7v-4z'), false],
  ['Audit Log', icon('M4 1.5h8v13H4zM6.5 5h3M6.5 8h3M6.5 11h2'), false],
];

function Nav({ current, onGo }: { current: Section; onGo: (s: Section) => void }) {
  return (
    <ul className="space-y-1 text-sm">
      {sections.map(([s, ic, built]) => (
        <li key={s}>
          {built ? (
            <button
              type="button"
              aria-current={current === s ? 'page' : undefined}
              onClick={() => onGo(s)}
              className={cn(
                'focus-visible:ring-ring flex w-full items-center gap-3 rounded-md px-3 py-2 text-left focus-visible:ring-2 focus-visible:outline-none',
                current === s
                  ? 'bg-background font-medium ring-1 ring-slate-200'
                  : 'hover:bg-background',
              )}
            >
              {ic}
              {s}
            </button>
          ) : (
            <span
              className="text-muted-foreground flex items-center gap-3 px-3 py-2"
              title="Not in this prototype"
            >
              {ic}
              {s}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

const waited = (m: number) =>
  m < 60 ? `${String(m)} min` : `${String(Math.floor(m / 60))} h ${String(m % 60)} min`;

export function CommanderQueue({
  role,
  decisions,
  setDecision,
}: {
  role: Role;
  decisions: Decisions;
  setDecision: (id: string, d: Decision) => void;
}) {
  const [section, setSection] = useState<Section>('Queue');
  const awaitingCount = queue.filter(
    ({ r }) => decisions[r.id]?.status === 'Awaiting approval',
  ).length;
  const [filter, setFilter] = useState<'all' | 'awaiting'>('all');
  const activeFilter = role === 'office' ? 'awaiting' : filter;
  // The office commander also keeps the selections they already decided, so the outcome stays visible.
  const rows = queue.filter(({ r }) =>
    role === 'office'
      ? decisions[r.id] !== undefined
      : activeFilter === 'all' || decisions[r.id]?.status === 'Awaiting approval',
  );
  // On a wide screen the split view opens on the top request instead of an empty pane.
  const [selectedId, setSelectedId] = useState<string | null>(() =>
    window.matchMedia('(min-width: 1024px)').matches ? (rows[0]?.r.id ?? null) : null,
  );
  const selected = rows.find(({ r }) => r.id === selectedId) ?? null;

  const statusOf = (r: RescueRequest): Status => decisions[r.id]?.status ?? r.status;
  const me = people[role];

  const openInQueue = (id: string) => {
    setFilter('all');
    setSelectedId(id);
    setSection('Queue');
  };

  const summary: [string, string | number, string?][] = [
    ['Open requests', queue.length],
    ['Critical', queue.filter(({ p }) => band(p.total) === 'Critical').length, 'text-red-700'],
    ['High', queue.filter(({ p }) => band(p.total) === 'High').length, 'text-amber-800'],
    ['Awaiting approval', awaitingCount],
    [
      'Volunteers ready',
      `${String(volunteers.filter((v) => v.available && v.verified.length > 0).length)} / ${String(volunteers.length)}`,
    ],
    [
      'Teams available',
      `${String(teams.filter((t) => t.status === 'Available').length)} / ${String(teams.length)}`,
    ],
  ];

  return (
    <div className="flex min-h-0 flex-1 text-sm">
      <aside className="bg-muted hidden w-48 shrink-0 flex-col border-r p-3 lg:flex xl:w-56 xl:p-4">
        <p className="px-3 text-base font-semibold">RescueAI</p>
        <p className="text-muted-foreground mb-6 px-3 text-xs">
          Dehradun district · Flood response
        </p>
        <nav aria-label="Sections">
          <Nav current={section} onGo={setSection} />
        </nav>
        <div className="mt-auto border-t px-3 pt-4">
          <p className="font-medium">{me.name}</p>
          <p className="text-muted-foreground text-xs">{me.title}</p>
        </div>
      </aside>

      <main id="content" className="flex min-w-0 flex-1 flex-col">
        <details className="border-b px-4 py-2 lg:hidden">
          <summary className="cursor-pointer py-1 font-semibold">RescueAI · {me.name}</summary>
          <nav aria-label="Sections" className="pt-2">
            <Nav current={section} onGo={setSection} />
          </nav>
        </details>

        <div className="flex flex-wrap items-end justify-between gap-3 px-4 pt-4 pb-3 lg:px-6">
          <div>
            <h1 className="text-2xl font-semibold">{section}</h1>
            <p className="text-muted-foreground">
              {section === 'Map'
                ? 'Open requests, available volunteers and team bases.'
                : role === 'onsite'
                  ? 'Pending and in-progress requests, highest priority first.'
                  : 'Selections sent by on-site commanders, waiting for your approval.'}
            </p>
          </div>
          {section === 'Queue' && role === 'onsite' && (
            <div role="group" aria-label="Filter" className="border-input flex rounded-md border">
              {(
                [
                  ['all', `All open (${String(queue.length)})`],
                  ['awaiting', `Awaiting approval (${String(awaitingCount)})`],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={filter === key}
                  onClick={() => setFilter(key)}
                  className={cn(
                    'focus-visible:ring-ring px-3 py-1.5 first:rounded-l-md last:rounded-r-md focus-visible:ring-2 focus-visible:outline-none',
                    filter === key ? 'bg-muted font-medium' : 'text-muted-foreground',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        <dl className="grid grid-cols-3 border-y sm:grid-cols-6">
          {summary.map(([label, value, tone]) => (
            <div key={label} className="border-r px-4 py-2 last:border-r-0 lg:px-6">
              <dt className="text-muted-foreground text-xs">{label}</dt>
              <dd className={cn('text-lg font-semibold tabular-nums', tone)}>{value}</dd>
            </div>
          ))}
        </dl>

        {section === 'Map' ? (
          <Suspense fallback={<div className="bg-muted min-h-96 flex-1" aria-busy="true" />}>
            <MapView statusOf={statusOf} onOpen={openInQueue} />
          </Suspense>
        ) : (
          <div className="grid min-h-0 flex-1 lg:grid-cols-2 xl:grid-cols-5">
            <section
              aria-label="Requests"
              className={cn(
                'border-r lg:overflow-y-auto xl:col-span-2',
                selected && 'hidden lg:block',
              )}
            >
              {rows.length === 0 ? (
                <p className="text-muted-foreground p-6">
                  {activeFilter === 'awaiting'
                    ? 'No selections waiting for approval.'
                    : 'No pending requests.'}
                </p>
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
                    {rows.map(({ r, p }) => (
                      <tr
                        key={r.id}
                        tabIndex={0}
                        aria-selected={r.id === selectedId}
                        onClick={() => setSelectedId(r.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') setSelectedId(r.id);
                        }}
                        className={cn(
                          'focus-visible:ring-ring cursor-pointer border-t border-l-4 border-l-transparent align-top hover:bg-slate-50 focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset',
                          r.id === selectedId && 'border-l-primary bg-muted',
                        )}
                      >
                        <td className="w-full px-4 py-3">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span className="font-semibold whitespace-nowrap">{r.id}</span>
                            <PriorityBadge band={band(p.total)} score={p.total} />
                          </div>
                          <div className="text-muted-foreground mt-1 line-clamp-2 text-xs">
                            {r.hazard} · {r.place}
                          </div>
                        </td>
                        <td className="px-2 py-3 text-right">{severity(r)}</td>
                        <td className="hidden px-2 py-3 text-right xl:table-cell">
                          {r.flags.length}/4
                        </td>
                        <td className="px-2 py-3 text-right whitespace-nowrap">
                          {waited(r.minutesAgo)}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={statusOf(r)} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>

            <section
              aria-label="Request detail"
              className="min-w-0 lg:overflow-y-auto xl:col-span-3"
            >
              {selected ? (
                <Detail
                  key={selected.r.id}
                  request={selected.r}
                  role={role}
                  status={statusOf(selected.r)}
                  decision={decisions[selected.r.id]}
                  onBack={() => setSelectedId(null)}
                  setDecision={(d) => setDecision(selected.r.id, d)}
                />
              ) : (
                <p className="text-muted-foreground hidden p-6 lg:block">
                  Select a request to see its details and recommendations.
                </p>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

function Detail({
  request: r,
  role,
  status,
  decision,
  onBack,
  setDecision,
}: {
  request: RescueRequest;
  role: Role;
  status: Status;
  decision: Decision | undefined;
  onBack: () => void;
  setDecision: (d: Decision) => void;
}) {
  const p = priority(r);
  const vols = rankVolunteers(r);
  const tms = rankTeams(r);
  const [picked, setPicked] = useState<string[]>(decision?.picked ?? []);
  const [sendingBack, setSendingBack] = useState(false);
  const [note, setNote] = useState('');
  const locked = decision?.status === 'Awaiting approval' || decision?.status === 'Approved';
  const readOnly = role === 'office';

  const toggle = (id: string, on: boolean) =>
    setPicked((cur) => (on ? [...cur, id] : cur.filter((x) => x !== id)));

  const show = (list: typeof vols) =>
    list
      .map((rec, i) => ({ rec, rank: i + 1 }))
      .filter(({ rec }) => !readOnly || picked.includes(rec.id));

  const pickedRecs = [...vols, ...tms].filter((x) => picked.includes(x.id));
  const decide = (d: Pick<Decision, 'status' | 'note'>) =>
    decision &&
    setDecision({ ...decision, ...d, decidedBy: people.office.name, decidedAt: clock() });

  return (
    <div className="flex min-h-full flex-col">
      <div className="flex-1 space-y-6 p-4 lg:p-6">
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
              {r.id} · {r.hazard}
            </h2>
            <PriorityBadge band={band(p.total)} score={p.total} />
            <StatusBadge status={status} />
          </div>
          <p className="text-muted-foreground">
            {r.place} · reported <time>{r.minutesAgo} min ago</time>
          </p>
        </header>

        {decision && (
          <ol className="bg-muted space-y-1 rounded-lg border px-4 py-3 text-xs">
            <li>
              <span className="tabular-nums">{decision.selectedAt}</span> ·{' '}
              <span className="font-medium">{decision.selectedBy}</span> selected{' '}
              {decision.picked.length} responder{decision.picked.length === 1 ? '' : 's'} and sent
              them for approval
            </li>
            {decision.decidedBy && (
              <li>
                <span className="tabular-nums">{decision.decidedAt}</span> ·{' '}
                <span className="font-medium">{decision.decidedBy}</span>{' '}
                {decision.status === 'Approved' ? 'approved the selection' : 'sent it back'}
              </li>
            )}
          </ol>
        )}

        <div className="grid gap-4 xl:grid-cols-3">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4 xl:col-span-2">
            {(
              [
                ['Severity', `${String(severity(r))} of 5`],
                ['Trapped', r.trapped],
                ['Injured', r.injured],
                ['Affected', r.affected],
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
          {/* AC14/AC18: only commander screens ever receive the citizen's phone number. */}
          <div className="rounded-lg border px-4 py-3">
            <p className="text-muted-foreground text-xs">Contact · commanders only</p>
            <p className="font-medium">{r.contactName || 'Name not given'}</p>
            <p className="tabular-nums">{r.phone}</p>
          </div>
        </div>
        {r.description && (
          <blockquote className="border-l-2 border-slate-500 pl-3">“{r.description}”</blockquote>
        )}

        <section className="space-y-2">
          <h3 className="text-base font-semibold">Why this priority</h3>
          <ScoreBreakdown
            reason={`Severity ${String(severity(r))} from the rule table, ${String(r.flags.length)} of 4 vulnerability flags, waiting ${waited(r.minutesAgo)}.`}
            score={p}
          />
        </section>

        <section className="space-y-2">
          <h3 className="text-base font-semibold">Required skills</h3>
          <div className="flex flex-wrap items-center gap-1">
            {requiredSkills(r.hazard).map((s) => (
              <SkillChip key={s} skill={s} verified />
            ))}
            <span className="text-muted-foreground ml-1 text-xs">
              Default for {r.hazard.toLowerCase()}. Only verified skills count.
            </span>
          </div>
        </section>

        {(
          [
            [
              'Volunteers',
              show(vols),
              'No available volunteers with the required verified skills.',
            ],
            ['Rescue teams', show(tms), 'No available teams.'],
          ] as const
        ).map(([title, list, empty]) => (
          <section key={title} className="space-y-2">
            <h3 className="text-base font-semibold">
              {readOnly ? `Selected ${title.toLowerCase()}` : title}{' '}
              <span className="text-muted-foreground font-normal tabular-nums">
                ({list.length})
              </span>
            </h3>
            {list.length === 0 ? (
              <p className="text-muted-foreground">{readOnly ? 'None selected.' : empty}</p>
            ) : (
              <ol className="space-y-3">
                {list.map(({ rec, rank }) => (
                  <RecommendationCard
                    key={rec.id}
                    rank={rank}
                    rec={rec}
                    checked={picked.includes(rec.id)}
                    onCheckedChange={readOnly || locked ? undefined : (v) => toggle(rec.id, v)}
                  />
                ))}
              </ol>
            )}
          </section>
        ))}
      </div>

      <div className="bg-background sticky bottom-0 border-t p-4 lg:px-6" aria-live="polite">
        {decision?.status === 'Sent back' && decision.note && !readOnly && (
          <p className="mb-3 text-amber-800">
            Sent back by {decision.decidedBy}: “{decision.note}”
          </p>
        )}
        {readOnly ? (
          sendingBack ? (
            <div className="space-y-2">
              <Label htmlFor="sendback">Reason for sending back (required)</Label>
              <Textarea id="sendback" value={note} onChange={(e) => setNote(e.target.value)} />
              <div className="flex flex-wrap justify-end gap-2">
                <Button variant="outline" onClick={() => setSendingBack(false)}>
                  Cancel
                </Button>
                <Button
                  disabled={note.trim() === ''}
                  onClick={() => decide({ status: 'Sent back', note: note.trim() })}
                >
                  Send back
                </Button>
              </div>
            </div>
          ) : decision?.status === 'Awaiting approval' ? (
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button variant="outline" onClick={() => setSendingBack(true)}>
                Send back
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button>
                    Approve {picked.length} responder{picked.length === 1 ? '' : 's'}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Approve dispatch for {r.id}?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Volunteers get an offer they can accept or decline. Teams get a deployment
                      order. This is recorded in the audit log.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <ul className="divide-y rounded-lg border text-sm">
                    {pickedRecs.map((x) => (
                      <li key={x.id} className="flex justify-between gap-4 px-3 py-2">
                        <span className="font-medium">{x.name}</span>
                        <span className="text-muted-foreground">
                          {x.kind} · {x.km.toFixed(1)} km
                        </span>
                      </li>
                    ))}
                  </ul>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => decide({ status: 'Approved' })}>
                      Approve {picked.length}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ) : (
            <p className="flex items-center gap-2">
              {decision && <StatusBadge status={decision.status} />}
              <span className="text-muted-foreground">
                {decision?.status === 'Approved'
                  ? 'Offers and deployment orders have gone out.'
                  : 'Returned to the on-site commander.'}
              </span>
            </p>
          )
        ) : locked ? (
          <p className="flex items-center gap-2">
            <StatusBadge status={decision.status} />
            <span className="text-muted-foreground">
              {decision.status === 'Approved'
                ? `${decision.decidedBy ?? 'The office commander'} approved this selection.`
                : `Waiting for ${people.office.name} to approve.`}
            </span>
          </p>
        ) : (
          <div className="flex flex-wrap items-center justify-end gap-2">
            <span className="text-muted-foreground mr-auto">
              {picked.length === 0
                ? 'Tick the responders to send.'
                : `${String(picked.length)} selected`}
            </span>
            <Button variant="outline" disabled title="Not in this prototype">
              Reject
            </Button>
            <Button
              disabled={picked.length === 0}
              onClick={() =>
                setDecision({
                  status: 'Awaiting approval',
                  picked,
                  selectedBy: people.onsite.name,
                  selectedAt: clock(),
                })
              }
            >
              {picked.length === 0
                ? 'Send for approval'
                : `Send ${String(picked.length)} for approval`}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
