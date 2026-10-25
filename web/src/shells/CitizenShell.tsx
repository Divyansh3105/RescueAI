import type { ReactNode } from 'react';
import { LangSwitch } from '@/components/LangSwitch';
import { Link } from '@/components/Link';
import { useLang } from '@/i18n/use-lang';
import { useTitle } from './use-title';

/** One centered column, no navigation (DESIGN.md -> Layout: Citizen). */
export function CitizenShell({ title, children }: { title: string; children: ReactNode }) {
  const [, , t] = useLang();
  useTitle(title);
  return (
    <div className="bg-muted flex min-h-screen flex-col">
      <main
        id="content"
        className="bg-background mx-auto w-full max-w-lg flex-1 space-y-6 px-4 pt-2 pb-12 sm:border-x"
      >
        <div className="flex items-center justify-between border-b pb-1">
          <span className="font-semibold">RescueAI</span>
          <LangSwitch />
        </div>
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{t.call112}</p>
        {children}
        <p className="border-t pt-4 text-sm">
          <Link to="/login" className="text-primary underline underline-offset-4">
            {t.staffSignIn}
          </Link>
        </p>
      </main>
    </div>
  );
}
