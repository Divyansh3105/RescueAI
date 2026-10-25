import { useRef, useState, type FormEvent } from 'react';
import { Link } from '@/components/Link';
import { SampleDataNote } from '@/components/SampleDataNote';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { skillName } from '@/i18n/dictionaries';
import { useLang } from '@/i18n/use-lang';
import { normalizePhone } from '@/lib/phone';
import type { Skill } from '@/sample/data';
import { CitizenShell } from '@/shells/CitizenShell';

const SKILLS: Skill[] = [
  'First Aid',
  'Swimming',
  'Boat Handling',
  'Heavy Lifting',
  'Driving',
  'Local Language Proficiency',
];

type Errors = Partial<Record<'name' | 'phone' | 'password', string>>;

/** Volunteer self-registration (PRD F2). Sample only: nothing is sent yet. */
export function RegisterPage() {
  const [, , t] = useLang();
  const [v, setV] = useState({ name: '', phone: '', password: '' });
  const [skills, setSkills] = useState<Skill[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [done, setDone] = useState(false);
  const refs = {
    name: useRef<HTMLInputElement>(null),
    phone: useRef<HTMLInputElement>(null),
    password: useRef<HTMLInputElement>(null),
  };

  function validate(x = v): Errors {
    const e: Errors = {};
    if (!x.name.trim()) e.name = t.nameMissing;
    if (!normalizePhone(x.phone)) e.phone = t.phoneBad;
    if (x.password.length < 8) e.password = t.passwordShort;
    return e;
  }

  function change(key: keyof typeof v, value: string) {
    const next = { ...v, [key]: value };
    setV(next);
    if (submitted) setErrors(validate(next));
  }

  function submit(ev: FormEvent) {
    ev.preventDefault();
    setSubmitted(true);
    const e = validate();
    setErrors(e);
    const first = (['name', 'phone', 'password'] as const).find((k) => e[k]);
    if (first) refs[first].current?.focus();
    else setDone(true);
  }

  const field = (
    key: keyof typeof v,
    label: string,
    props: React.ComponentProps<typeof Input>,
    hint?: string,
  ) => {
    const describedBy = [hint && `${key}-hint`, errors[key] && `${key}-error`]
      .filter(Boolean)
      .join(' ');
    return (
      <div className="space-y-2">
        <Label htmlFor={key} className="text-base">
          {label}
        </Label>
        {hint && (
          <p id={`${key}-hint`} className="text-muted-foreground text-sm">
            {hint}
          </p>
        )}
        <Input
          id={key}
          ref={refs[key]}
          value={v[key]}
          onChange={(e) => change(key, e.target.value)}
          aria-invalid={!!errors[key]}
          aria-describedby={describedBy || undefined}
          className="h-11 text-base"
          {...props}
        />
        {errors[key] && (
          <p id={`${key}-error`} className="text-destructive text-sm">
            {errors[key]}
          </p>
        )}
      </div>
    );
  };

  return (
    <CitizenShell title={t.registerTitle}>
      <h1 className="text-2xl font-semibold">{t.registerTitle}</h1>
      <p className="text-muted-foreground">{t.registerIntro}</p>
      <SampleDataNote text={t.sampleNote} />

      {done && (
        <Alert>
          <AlertDescription>{t.registerNotConnected}</AlertDescription>
        </Alert>
      )}

      <form noValidate onSubmit={submit} className="space-y-6">
        {field('name', t.fullName, { autoComplete: 'name' })}
        {field(
          'phone',
          t.phone,
          { type: 'tel', inputMode: 'numeric', autoComplete: 'tel-national' },
          t.loginPhoneHint,
        )}
        {field(
          'password',
          t.newPassword,
          { type: 'password', autoComplete: 'new-password' },
          t.passwordHint,
        )}

        <fieldset aria-describedby="skills-hint">
          <legend className="mb-1 font-medium">
            {t.skillsLegend} <span className="text-muted-foreground font-normal">{t.optional}</span>
          </legend>
          <p id="skills-hint" className="text-muted-foreground mb-2 text-sm">
            {t.skillsHint}
          </p>
          <div className="grid gap-x-4 sm:grid-cols-2">
            {SKILLS.map((s) => (
              <div key={s} className="flex min-h-11 items-center gap-2">
                <Checkbox
                  id={`skill-${s}`}
                  checked={skills.includes(s)}
                  onCheckedChange={(on) =>
                    setSkills((cur) => (on === true ? [...cur, s] : cur.filter((x) => x !== s)))
                  }
                />
                <Label htmlFor={`skill-${s}`} className="text-base font-normal">
                  {skillName(t, s)}
                </Label>
              </div>
            ))}
          </div>
        </fieldset>

        <Button type="submit" size="lg" className="w-full">
          {t.register}
        </Button>
      </form>

      <p className="text-sm">
        <Link to="/login" className="text-primary underline underline-offset-4">
          {t.haveAccount}
        </Link>
      </p>
    </CitizenShell>
  );
}
