import { useSession } from '@/auth/session';
import { LangSwitch } from '@/components/LangSwitch';
import { Link } from '@/components/Link';
import { useLang } from '@/i18n/use-lang';
import { homeFor } from '@/routes';
import { useTitle } from '@/shells/use-title';

/** Citizens can land here, so it follows the chosen language (AC24). */
export function NotFoundPage() {
  const { user } = useSession();
  const [, , t] = useLang();
  useTitle(t.notFoundTitle);
  return (
    <main id="content" className="mx-auto max-w-lg space-y-4 px-4 py-8">
      <div className="flex justify-end">
        <LangSwitch />
      </div>
      <h1 className="text-2xl font-semibold">{t.notFoundTitle}</h1>
      <p className="text-muted-foreground">{t.notFoundBody}</p>
      <Link
        to={user ? homeFor(user.role) : '/'}
        className="text-primary underline underline-offset-4"
      >
        {user ? t.goHome : t.askRescueLink}
      </Link>
    </main>
  );
}
