import { SampleDataNote } from '@/components/SampleDataNote';
import { skillName } from '@/i18n/dictionaries';
import { useLang } from '@/i18n/use-lang';
import { volunteers } from '@/sample/data';
import { VolunteerShell } from '@/shells/VolunteerShell';

const me = volunteers[0]!;

/** The volunteer's skills and their verification state (PRD F2). Sample only. */
export function ProfilePage() {
  const [, , t] = useLang();
  const skills = [
    ...me.verified.map((s) => [s, true] as const),
    ...me.unverified.map((s) => [s, false] as const),
  ];
  return (
    <VolunteerShell title={t.profile}>
      <h1 className="text-2xl font-semibold">{me.name}</h1>
      <SampleDataNote text={t.sampleNote} />
      <section className="space-y-2">
        <h2 className="text-lg font-semibold">{t.mySkills}</h2>
        <p className="text-muted-foreground text-sm">{t.profileSkillsHint}</p>
        <ul>
          {skills.map(([s, ok]) => (
            <li key={s} className="flex items-center justify-between gap-4 border-b py-3">
              <span>{skillName(t, s)}</span>
              <span className={ok ? 'text-sm text-green-700' : 'text-muted-foreground text-sm'}>
                {ok ? `✓ ${t.verified}` : t.unverifiedLabel}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </VolunteerShell>
  );
}
