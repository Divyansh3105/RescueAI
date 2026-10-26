import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useLogin, useSession } from '@/auth/session';
import { LangSwitch } from '@/components/LangSwitch';
import { Link } from '@/components/Link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Dict } from '@/i18n/dictionaries';
import { useLang } from '@/i18n/use-lang';
import { ApiError } from '@/lib/api';
import { normalizePhone } from '@/lib/phone';
import { navigate, usePath } from '@/router';
import { safeNext } from '@/routes';

type Errors = Partial<Record<'phone' | 'password', keyof Dict>>;

/** Sign-in for volunteers, commanders and the Admin (PRD F2, D-037). */
export function LoginPage() {
  const [, , t] = useLang();
  const { user } = useSession();
  const { search } = usePath();
  const login = useLogin();

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Errors>({});

  const phoneRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const alertRef = useRef<HTMLDivElement>(null);

  // Already signed in (or just signed in): go where the user was heading.
  const next = search.get('next');
  useEffect(() => {
    if (user) navigate(safeNext(next, user.role), { replace: true });
  }, [user, next]);

  useEffect(() => {
    document.title = `${t.signIn} · RescueAI`;
  }, [t]);

  function validate(v = { phone, password }): Errors {
    const e: Errors = {};
    if (!normalizePhone(v.phone)) e.phone = 'phoneBad';
    if (v.password.length < 8) e.password = 'passwordShort';
    return e;
  }

  // DESIGN.md -> Forms: validate on submit, then re-validate the edited field.
  function recheck(v: Partial<{ phone: string; password: string }>) {
    if (submitted) setErrors(validate({ phone, password, ...v }));
  }

  function submit(ev: FormEvent) {
    ev.preventDefault();
    setSubmitted(true);
    const e = validate();
    setErrors(e);
    if (e.phone) return phoneRef.current?.focus();
    if (e.password) return passwordRef.current?.focus();
    // On success the session query is set, and the effect above navigates.
    login.mutate(
      { phone: normalizePhone(phone) ?? phone, password },
      { onError: () => requestAnimationFrame(() => alertRef.current?.focus()) },
    );
  }

  // Values are never cleared on failure (DESIGN.md -> Forms).
  const failure =
    login.error instanceof ApiError && login.error.status === 401 ? t.loginWrong : t.networkError;

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col px-4 py-4">
      <header className="flex items-center justify-between">
        <span className="font-semibold">RescueAI</span>
        <LangSwitch />
      </header>

      <main id="content" className="flex flex-1 flex-col justify-center space-y-6 py-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">{t.signInTitle}</h1>
          <p className="text-muted-foreground">{t.signInIntro}</p>
        </div>

        {login.isError && (
          <Alert variant="destructive" ref={alertRef} tabIndex={-1}>
            <AlertTitle>{t.loginWrongTitle}</AlertTitle>
            <AlertDescription>{failure}</AlertDescription>
          </Alert>
        )}

        <form noValidate onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">{t.phone}</Label>
            <p id="phone-hint" className="text-muted-foreground text-sm">
              {t.loginPhoneHint}
            </p>
            <Input
              id="phone"
              ref={phoneRef}
              type="tel"
              inputMode="numeric"
              autoComplete="username"
              className="h-11 text-base"
              value={phone}
              aria-invalid={!!errors.phone}
              aria-describedby={errors.phone ? 'phone-hint phone-error' : 'phone-hint'}
              onChange={(e) => {
                setPhone(e.target.value);
                recheck({ phone: e.target.value });
              }}
            />
            {errors.phone && (
              <p id="phone-error" className="text-destructive text-sm">
                {t[errors.phone]}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{t.password}</Label>
            <div className="flex gap-2">
              <Input
                id="password"
                ref={passwordRef}
                type={show ? 'text' : 'password'}
                autoComplete="current-password"
                className="h-11 text-base"
                value={password}
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? 'password-error' : undefined}
                onChange={(e) => {
                  setPassword(e.target.value);
                  recheck({ password: e.target.value });
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="px-3"
                aria-pressed={show}
                aria-controls="password"
                onClick={() => setShow((s) => !s)}
              >
                {t.showPassword}
              </Button>
            </div>
            {errors.password && (
              <p id="password-error" className="text-destructive text-sm">
                {t[errors.password]}
              </p>
            )}
          </div>

          <Button type="submit" size="lg" className="w-full" disabled={login.isPending}>
            {login.isPending ? t.signingIn : t.signIn}
          </Button>
        </form>

        <div className="space-y-2 text-sm">
          <p>
            {t.registerPrompt}{' '}
            <Link to="/register" className="text-primary underline underline-offset-4">
              {t.registerLink}
            </Link>
          </p>
          <p className="text-muted-foreground">{t.forgotPassword}</p>
          <p>
            <Link to="/" className="text-primary underline underline-offset-4">
              {t.askRescueLink}
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
