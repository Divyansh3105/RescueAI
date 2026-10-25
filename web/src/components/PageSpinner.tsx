import { useLang } from '@/i18n/use-lang';

/** The only full-page spinner: the initial app load (DESIGN.md -> Loading States). */
export function PageSpinner() {
  const [, , t] = useLang();
  return (
    <div role="status" className="flex min-h-screen items-center justify-center">
      <span className="border-input size-8 rounded-full border-4 border-t-transparent motion-safe:animate-spin" />
      <span className="sr-only">{t.loading}</span>
    </div>
  );
}
