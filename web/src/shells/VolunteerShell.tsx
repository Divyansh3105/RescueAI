import type { ReactNode } from 'react';
import { useLogout } from '@/auth/session';
import { LangSwitch } from '@/components/LangSwitch';
import { Link } from '@/components/Link';
import { useLang } from '@/i18n/use-lang';
import { cn } from '@/lib/utils';
import { usePath } from '@/router';
import { useTitle } from './use-title';

/** Mobile-first column with a top app bar and a menu (DESIGN.md -> Layout: Volunteer). */
export function VolunteerShell({ title, children }: { title: string; children: ReactNode }) {
  const [, , t] = useLang();
  const { path } = usePath();
  const logout = useLogout();
  useTitle(title);

  const items: [string, string][] = [
    ['/volunteer', t.home],
    ['/volunteer/profile', t.profile],
    ['/volunteer/history', t.history],
  ];

  return (
    <div className="bg-muted flex min-h-screen flex-col">
      <a
        href="#content"
        className="focus:bg-background sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-2"
      >
        {t.skipToContent}
      </a>
      <div className="bg-background mx-auto w-full max-w-lg flex-1 sm:border-x">
        <header className="flex items-center justify-between gap-2 border-b px-4">
          <details className="group relative">
            <summary className="focus-visible:ring-ring flex min-h-11 cursor-pointer items-center gap-2 font-semibold focus-visible:ring-2 focus-visible:outline-none">
              <span aria-hidden="true">☰</span>
              <span>
                {t.menu}
                <span className="sr-only"> · {title}</span>
              </span>
            </summary>
            <nav
              aria-label={t.menu}
              className="bg-background absolute left-0 z-20 mt-1 w-56 rounded-md border p-1 shadow-md"
            >
              <ul>
                {items.map(([to, label]) => (
                  <li key={to}>
                    <Link
                      to={to}
                      aria-current={path === to ? 'page' : undefined}
                      onClick={(e) => e.currentTarget.closest('details')?.removeAttribute('open')}
                      className={cn(
                        'focus-visible:ring-ring flex min-h-11 items-center rounded-md px-3 focus-visible:ring-2 focus-visible:outline-none',
                        path === to ? 'bg-muted font-medium' : 'hover:bg-muted',
                      )}
                    >
                      {label}
                    </Link>
                  </li>
                ))}
                <li className="mt-1 border-t pt-1">
                  <button
                    type="button"
                    onClick={() => logout.mutate()}
                    className="focus-visible:ring-ring hover:bg-muted flex min-h-11 w-full items-center rounded-md px-3 text-left focus-visible:ring-2 focus-visible:outline-none"
                  >
                    {t.signOut}
                  </button>
                </li>
              </ul>
            </nav>
          </details>
          <LangSwitch />
        </header>
        <main id="content" className="space-y-6 px-4 py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
