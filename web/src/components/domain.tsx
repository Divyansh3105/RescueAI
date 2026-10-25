import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import type { Band, Recommendation, Scored } from '@/sample/data';

// docs/DESIGN.md -> Component Patterns. Color never carries meaning alone: every badge has text.

const bandStyle: Record<Band, string> = {
  Critical: 'border-red-700 bg-red-50 text-red-700',
  High: 'border-amber-800 bg-amber-50 text-amber-800',
  Normal: 'border-slate-500 bg-white text-slate-700',
};

export function PriorityBadge({ band, score }: { band: Band; score: number }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap tabular-nums',
        bandStyle[band],
      )}
    >
      {band} · {score.toFixed(2)}
    </span>
  );
}

export type Status =
  | 'Pending'
  | 'In Progress'
  | 'Awaiting approval'
  | 'Approved'
  | 'Sent back'
  | 'Offered'
  | 'Accepted'
  | 'Completed'
  | 'Declined';

const waiting: Status[] = ['Pending', 'Awaiting approval', 'Sent back', 'Offered'];

/** `label` overrides the text, for translated volunteer screens; the color follows `status`. */
export function StatusBadge({ status, label }: { status: Status; label?: string }) {
  const tone = waiting.includes(status)
    ? 'bg-amber-50 text-amber-800'
    : status === 'Approved' || status === 'Completed'
      ? 'bg-green-50 text-green-700'
      : 'bg-slate-100 text-slate-700';
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap',
        tone,
      )}
    >
      {label ?? status}
    </span>
  );
}

export function SkillChip({
  skill,
  verified,
  stateText = verified ? '(verified)' : '(unverified)',
}: {
  skill: string;
  verified: boolean;
  /** Screen-reader state, translated on volunteer screens. */
  stateText?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs whitespace-nowrap',
        verified ? 'border-green-700 text-green-700' : 'border-slate-500 text-slate-600',
      )}
    >
      {verified ? '✓' : '?'} {skill}
      <span className="sr-only">{stateText}</span>
    </span>
  );
}

export function ScoreBreakdown({ reason, score }: { reason: string; score: Scored }) {
  return (
    <div className="space-y-2">
      <p className="text-sm">{reason}</p>
      <table className="w-full text-xs tabular-nums">
        <thead className="text-muted-foreground">
          <tr>
            <th className="py-1 text-left font-normal">Factor</th>
            <th className="py-1 text-right font-normal">Value</th>
            <th className="py-1 text-right font-normal">× Weight</th>
            <th className="hidden w-1/3 py-1 sm:table-cell">
              <span className="sr-only">Bar</span>
            </th>
            <th className="py-1 text-right font-normal">= Points</th>
          </tr>
        </thead>
        <tbody>
          {score.factors.map((f) => (
            <tr key={f.name} className="border-t">
              <td className="py-1">{f.name}</td>
              <td className="py-1 text-right">{f.value.toFixed(2)}</td>
              <td className="py-1 text-right">{f.weight.toFixed(2)}</td>
              <td className="hidden px-2 py-1 sm:table-cell">
                <div className="h-2 rounded-sm bg-slate-100">
                  {/* Bar length is the share of the maximum possible contribution. */}
                  <div
                    className="h-2 rounded-sm bg-slate-600"
                    style={{ width: `${String(Math.round(f.value * 100))}%` }}
                  />
                </div>
              </td>
              <td className="py-1 text-right">{f.contribution.toFixed(2)}</td>
            </tr>
          ))}
          <tr className="border-t border-slate-500 font-semibold">
            <td className="py-1" colSpan={3}>
              Total
            </td>
            <td className="hidden sm:table-cell" />
            <td className="py-1 text-right">{score.total.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export function RecommendationCard({
  rank,
  rec,
  checked,
  onCheckedChange,
}: {
  rank: number;
  rec: Recommendation;
  checked?: boolean;
  onCheckedChange?: (v: boolean) => void;
}) {
  const inputId = `pick-${rec.id}`;
  const selectable = onCheckedChange !== undefined;
  return (
    <li className={cn('rounded-lg border p-4', checked && 'border-primary')}>
      <div className="flex items-start gap-3">
        {selectable && (
          <Checkbox
            id={inputId}
            checked={checked}
            onCheckedChange={(v) => onCheckedChange(v === true)}
            className="mt-1"
          />
        )}
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <label htmlFor={selectable ? inputId : undefined} className="text-base font-semibold">
              <span className="text-muted-foreground mr-2 tabular-nums">#{rank}</span>
              {rec.name}
            </label>
            <span className="text-sm tabular-nums">
              <span className="text-muted-foreground">{rec.km.toFixed(1)} km · score </span>
              <span className="font-semibold">{rec.score.total.toFixed(2)}</span>
            </span>
          </div>
          <div className="flex flex-wrap gap-1">
            {rec.skills.map((s) => (
              <SkillChip key={s.skill} {...s} />
            ))}
          </div>
          <ScoreBreakdown reason={rec.reason} score={rec.score} />
        </div>
      </div>
    </li>
  );
}
