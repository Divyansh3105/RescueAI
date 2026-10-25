import { useEffect, type ReactNode } from 'react';
import { useLogout, useSession } from '@/auth/session';
import { Link } from '@/components/Link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { usePath } from '@/router';
import { roleLabel, type Role } from '@/routes';
import { useTitle } from './use-title';

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

const ICONS = {
  list: 'M2.5 4h11M2.5 8h11M2.5 12h7',
  map: 'M1.5 3.5l4-1.5 5 2 4-1.5v10l-4 1.5-5-2-4 1.5zM5.5 2v10M10.5 4v10',
  person: 'M8 7.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM3 14c.5-2.8 2.5-4.5 5-4.5s4.5 1.7 5 4.5',
  shield: 'M8 1.5l5.5 2v4c0 3.5-2.4 6-5.5 7-3.1-1-5.5-3.5-5.5-7v-4z',
  doc: 'M4 1.5h8v13H4zM6.5 5h3M6.5 8h3M6.5 11h2',
  key: 'M10 6.5a3.5 3.5 0 11-1-2.5M9 4l5.5 5.5M12 7.5l1.5-1.5',
  sliders: 'M2 4h7M12 4h2M2 12h2M7 12h7M10.5 2.5v3M5.5 10.5v3',
  db: 'M2.5 3.5c0-1.1 2.5-2 5.5-2s5.5.9 5.5 2v9c0 1.1-2.5 2-5.5 2s-5.5-.9-5.5-2zM2.5 3.5c0 1.1 2.5 2 5.5 2s5.5-.9 5.5-2',
};

type Section = [to: string, label: string, icon: keyof typeof ICONS];

const commanderSections: Section[] = [
  ['/commander/queue', 'Queue', 'list'],
  ['/commander/map', 'Map', 'map'],
  ['/commander/volunteers', 'Volunteers', 'person'],
  ['/commander/teams', 'Teams', 'shield'],
  ['/commander/audit', 'Audit Log', 'doc'],
];

// AC18: the Admin never sees citizen phones or volunteer locations, so no Queue or Map.
const adminSections: Section[] = [
  ['/admin/commanders', 'Commanders', 'shield'],
  ['/admin/users', 'Users', 'key'],
  ['/admin/weights', 'Weights', 'sliders'],
  ['/admin/data', 'Data', 'db'],
  ['/admin/audit', 'Audit Log', 'doc'],
];

const sectionsFor = (role: Role) => (role === 'admin' ? adminSections : commanderSections);

function Nav({ role, path }: { role: Role; path: string }) {
  return (
    <ul className="space-y-1">
      {sectionsFor(role).map(([to, label, ic]) => (
        <li key={to}>
          <Link
            to={to}
            aria-current={path === to ? 'page' : undefined}
            onClick={(e) => e.currentTarget.closest('details')?.removeAttribute('open')}
            className={cn(
              'focus-visible:ring-ring flex items-center gap-3 rounded-md px-3 py-2 focus-visible:ring-2 focus-visible:outline-none',
              path === to
                ? 'bg-background font-medium ring-1 ring-slate-200'
                : 'hover:bg-background',
            )}
          >
            {icon(ICONS[ic])}
            {label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

/**
 * Sidebar shell for commanders and the Admin; English only (DESIGN.md -> Layout).
 * `fill` makes the content fill the viewport, for the queue split view and the map.
 */
export function CommanderShell({
  title,
  description,
  actions,
  fill = false,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  fill?: boolean;
  children: ReactNode;
}) {
  const { user } = useSession();
  const { path } = usePath();
  const logout = useLogout();
  useTitle(title);
  useEffect(() => {
    document.documentElement.lang = 'en';
  }, []);
  if (!user) return null;

  const who = (
    <>
      <p className="font-medium">{user.name}</p>
      <p className="text-muted-foreground text-xs">{roleLabel[user.role]}</p>
    </>
  );

  return (
    <div className={cn('flex min-h-screen text-sm', fill && 'lg:h-screen')}>
      <a
        href="#content"
        className="focus:bg-background sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-2"
      >
        Skip to content
      </a>
      <aside className="bg-muted hidden w-52 shrink-0 flex-col border-r p-3 lg:flex xl:w-56 xl:p-4">
        <p className="mb-6 px-3 text-base font-semibold">RescueAI</p>
        <nav aria-label="Sections">
          <Nav role={user.role} path={path} />
        </nav>
        <div className="mt-auto space-y-3 border-t px-3 pt-4">
          <div>{who}</div>
          <Button variant="outline" className="w-full" onClick={() => logout.mutate()}>
            Sign out
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <details className="border-b px-4 py-2 lg:hidden">
          <summary className="focus-visible:ring-ring flex min-h-11 cursor-pointer items-center gap-2 font-semibold focus-visible:ring-2 focus-visible:outline-none">
            <span aria-hidden="true">☰</span> RescueAI · Menu
          </summary>
          <nav aria-label="Sections" className="pt-2">
            <Nav role={user.role} path={path} />
          </nav>
          <div className="mt-3 flex items-center justify-between gap-3 border-t pt-3">
            <div>{who}</div>
            <Button variant="outline" onClick={() => logout.mutate()}>
              Sign out
            </Button>
          </div>
        </details>

        <main id="content" className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="flex flex-wrap items-end justify-between gap-3 px-4 pt-4 pb-3 lg:px-6">
            <div>
              <h1 className="text-2xl font-semibold">{title}</h1>
              {description && <p className="text-muted-foreground">{description}</p>}
            </div>
            {actions}
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
