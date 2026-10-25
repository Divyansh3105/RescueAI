import { StatusBadge } from '@/components/domain';
import { SampleDataNote } from '@/components/SampleDataNote';
import { useLang } from '@/i18n/use-lang';
import { serviceHistory, volunteers } from '@/sample/data';
import { VolunteerShell } from '@/shells/VolunteerShell';

const me = volunteers[0]!;

/** Past offers and their outcomes (PRD F10). Sample only. */
export function HistoryPage() {
  const [, , t] = useLang();
  const totals: [string, number][] = [
    [t.offers, me.offered],
    [t.acceptedCount, me.completed],
    [t.completedCount, me.completed],
  ];
  return (
    <VolunteerShell title={t.history}>
      <h1 className="text-2xl font-semibold">{t.history}</h1>
      <SampleDataNote text={t.sampleNote} />
      <dl className="grid grid-cols-3 rounded-lg border">
        {totals.map(([label, n]) => (
          <div key={label} className="border-r px-3 py-2 last:border-r-0">
            <dt className="text-muted-foreground text-xs">{label}</dt>
            <dd className="text-lg font-semibold tabular-nums">{n}</dd>
          </div>
        ))}
      </dl>
      {serviceHistory.length === 0 ? (
        <p className="text-muted-foreground">{t.noHistory}</p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {serviceHistory.map((h) => (
            <li key={h.id} className="flex items-start justify-between gap-3 p-4">
              <div>
                <p className="font-medium">
                  {t[h.hazard === 'Flood' ? 'flood' : 'landslide']} · {h.place}
                </p>
                <p className="text-muted-foreground text-xs tabular-nums">
                  <time dateTime={h.date}>{h.date}</time> · {h.id}
                </p>
              </div>
              <StatusBadge
                status={h.outcome}
                label={h.outcome === 'Completed' ? t.statusCompleted : t.statusDeclined}
              />
            </li>
          ))}
        </ul>
      )}
    </VolunteerShell>
  );
}
