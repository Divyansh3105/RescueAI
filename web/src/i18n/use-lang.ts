import { useEffect, useSyncExternalStore } from 'react';
import { dict, type Lang } from './dictionaries';

// The chosen language, shared by every citizen, volunteer and sign-in screen. Remembered
// per browser; storage can be blocked, so every access is guarded.

const listeners = new Set<() => void>();

function stored(): Lang {
  try {
    return localStorage.getItem('lang') === 'hi' ? 'hi' : 'en';
  } catch {
    return 'en';
  }
}

let current: Lang = stored();
document.documentElement.lang = current;

export function setLang(lang: Lang): void {
  current = lang;
  try {
    localStorage.setItem('lang', lang);
  } catch {
    // Not remembered; still applies to this page.
  }
  document.documentElement.lang = lang;
  listeners.forEach((f) => f());
}

function subscribe(f: () => void) {
  listeners.add(f);
  return () => listeners.delete(f);
}

/** [lang, setLang, t] where t is that language's dictionary. */
export function useLang() {
  const lang = useSyncExternalStore(subscribe, () => current);
  // English-only commander screens set <html lang="en">; put it back on arrival here.
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  return [lang, setLang, dict[lang]] as const;
}
