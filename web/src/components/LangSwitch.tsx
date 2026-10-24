import { useLang } from '@/i18n/use-lang';
import { cn } from '@/lib/utils';

/** English / हिन्दी switch for citizen, volunteer and sign-in screens (AC24). */
export function LangSwitch() {
  const [lang, setLang] = useLang();
  return (
    <div role="group" aria-label="Language / भाषा" className="flex text-sm">
      {(
        [
          ['en', 'English'],
          ['hi', 'हिन्दी'],
        ] as const
      ).map(([key, label]) => (
        <button
          key={key}
          type="button"
          lang={key}
          aria-pressed={lang === key}
          onClick={() => setLang(key)}
          className={cn(
            'focus-visible:ring-ring min-h-11 px-3 focus-visible:ring-2 focus-visible:outline-none',
            lang === key ? 'font-semibold underline underline-offset-4' : 'text-muted-foreground',
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
