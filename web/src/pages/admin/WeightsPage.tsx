import { useState } from 'react';
import { SampleDataNote } from '@/components/SampleDataNote';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { WEIGHTS } from '@/sample/data';
import { CommanderShell } from '@/shells/CommanderShell';
import { freshnessOk, groupSum, sumsToOne, teamWeightsOk } from './weights';

type Key = keyof typeof WEIGHTS;

const groups: { title: string; hint: string; fields: [Key, string][] }[] = [
  {
    title: 'Responder score S(v, r)',
    hint: 'How volunteers and teams are ranked for a request.',
    fields: [
      ['w1', 'w1 · Skill match'],
      ['w2', 'w2 · Proximity'],
      ['w3', 'w3 · Freshness'],
      ['w4', 'w4 · Reliability'],
    ],
  },
  {
    title: 'Request priority P(r)',
    hint: 'How the queue is ordered.',
    fields: [
      ['alpha', 'α · Severity'],
      ['beta', 'β · Vulnerability'],
      ['gamma', 'γ · Waiting time'],
    ],
  },
];

const round = (n: number) => String(Math.round(n * 1000) / 1000);

/** Scoring weights, editable without a redeploy (PRD F7, AC10). Sample only: Save sends nothing. */
export function WeightsPage() {
  const [values, setValues] = useState<Record<Key, string>>(
    () =>
      Object.fromEntries(Object.entries(WEIGHTS).map(([k, v]) => [k, round(v)])) as Record<
        Key,
        string
      >,
  );
  const [freshness, setFreshness] = useState('120');
  const [saved, setSaved] = useState(false);

  const nums = (g: (typeof groups)[number]) => g.fields.map(([k]) => Number(values[k]));
  const teamOk = teamWeightsOk(Number(values.w1), Number(values.w2));
  const freshOk = freshnessOk(Number(freshness));
  const valid = groups.every((g) => sumsToOne(nums(g))) && teamOk && freshOk;

  return (
    <CommanderShell
      title="Weights"
      description="Each group must add up to 1.00. Changes apply to the next ranking."
    >
      <form
        noValidate
        className="max-w-2xl space-y-6 px-4 pb-6 lg:px-6"
        onSubmit={(e) => {
          e.preventDefault();
          if (valid) setSaved(true);
        }}
      >
        <SampleDataNote />
        {saved && (
          <Alert>
            <AlertDescription>Not connected yet. The weights were not saved.</AlertDescription>
          </Alert>
        )}
        {groups.map((g) => {
          const sum = groupSum(nums(g));
          const ok = sumsToOne(nums(g));
          const sumId = `sum-${g.fields[0]![0]}`;
          return (
            <fieldset key={g.title} className="space-y-3 rounded-lg border p-4">
              <legend className="px-1 text-base font-semibold">{g.title}</legend>
              <p className="text-muted-foreground">{g.hint}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {g.fields.map(([k, label]) => (
                  <div key={k} className="space-y-1">
                    <Label htmlFor={k}>{label}</Label>
                    <Input
                      id={k}
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min={0}
                      max={1}
                      value={values[k]}
                      aria-invalid={!ok}
                      aria-describedby={sumId}
                      onChange={(e) => {
                        setSaved(false);
                        setValues((c) => ({ ...c, [k]: e.target.value }));
                      }}
                      className="tabular-nums"
                    />
                  </div>
                ))}
              </div>
              <p
                id={sumId}
                aria-live="polite"
                className={cn('tabular-nums', ok ? 'text-green-700' : 'text-destructive')}
              >
                Total {Number.isFinite(sum) ? sum.toFixed(3) : '—'}
                {ok
                  ? ' ✓'
                  : ' — each weight must be between 0 and 1, and the group must add up to 1.'}
              </p>
              {g.fields[0]![0] === 'w1' && !teamOk && (
                <p aria-live="polite" className="text-destructive">
                  w1 and w2 cannot both be 0: the team score divides by w1 + w2.
                </p>
              )}
            </fieldset>
          );
        })}
        <fieldset className="space-y-3 rounded-lg border p-4">
          <legend className="px-1 text-base font-semibold">Freshness window</legend>
          <p className="text-muted-foreground">
            A volunteer location this many minutes old scores 0 for Freshness. Default 120 (2
            hours).
          </p>
          <div className="max-w-48 space-y-1">
            <Label htmlFor="freshness">Minutes</Label>
            <Input
              id="freshness"
              type="number"
              inputMode="numeric"
              step="1"
              min={1}
              value={freshness}
              aria-invalid={!freshOk}
              aria-describedby={freshOk ? undefined : 'freshness-error'}
              onChange={(e) => {
                setSaved(false);
                setFreshness(e.target.value);
              }}
              className="tabular-nums"
            />
          </div>
          {!freshOk && (
            <p id="freshness-error" aria-live="polite" className="text-destructive">
              Enter a whole number of minutes, 1 or more.
            </p>
          )}
        </fieldset>
        <Button type="submit" disabled={!valid}>
          Save weights
        </Button>
      </form>
    </CommanderShell>
  );
}
