import { useState } from 'react';
import { SkillChip } from '@/components/domain';
import { SampleDataNote } from '@/components/SampleDataNote';
import { Button } from '@/components/ui/button';
import { volunteers, type Skill } from '@/sample/data';
import { CommanderShell } from '@/shells/CommanderShell';

type Verdict = 'Verified' | 'Rejected';

/** Volunteers and skill verification (PRD F3). Sample only: verdicts stay in memory. */
export function VolunteersPage() {
  const [verdicts, setVerdicts] = useState<Record<string, Verdict | undefined>>({});
  const key = (vId: string, s: Skill) => `${vId}:${s}`;

  return (
    <CommanderShell
      title="Volunteers"
      description="Registered volunteers. Verify each declared skill before it counts for ranking."
    >
      <div className="space-y-4 px-4 pb-6 lg:px-6">
        <SampleDataNote />
        <ul className="divide-y rounded-lg border">
          {volunteers.map((v) => (
            <li key={v.id} className="space-y-3 p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-base font-semibold">{v.name}</p>
                <p className="text-muted-foreground text-xs tabular-nums">
                  {v.available ? 'Available' : 'Unavailable'} · location {v.locationAgeMin} min old
                  · {v.completed} of {v.offered} offers completed
                </p>
              </div>
              <div className="flex flex-wrap gap-1">
                {v.verified.map((s) => (
                  <SkillChip key={s} skill={s} verified />
                ))}
              </div>
              {v.unverified.length > 0 && (
                <ul className="space-y-2">
                  {v.unverified.map((s) => {
                    const verdict = verdicts[key(v.id, s)];
                    return (
                      <li key={s} className="flex flex-wrap items-center gap-2">
                        <span className="min-w-32">{s}</span>
                        {verdict ? (
                          <span
                            className={
                              verdict === 'Verified' ? 'text-green-700' : 'text-muted-foreground'
                            }
                          >
                            {verdict === 'Verified' ? '✓ Verified' : 'Rejected'}
                          </span>
                        ) : (
                          <>
                            <span className="text-amber-800">Unverified</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                setVerdicts((c) => ({ ...c, [key(v.id, s)]: 'Verified' }))
                              }
                            >
                              Verify
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                setVerdicts((c) => ({ ...c, [key(v.id, s)]: 'Rejected' }))
                              }
                            >
                              Reject
                            </Button>
                          </>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </div>
    </CommanderShell>
  );
}
