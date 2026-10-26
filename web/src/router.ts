import { useSyncExternalStore } from 'react';

// A minimal History-API router. RULES.md adopts no router library, and the app needs
// only a path, a query string and links (components/Link.tsx).

function subscribe(onChange: () => void) {
  window.addEventListener('popstate', onChange);
  return () => window.removeEventListener('popstate', onChange);
}

const snapshot = () => window.location.pathname + window.location.search;

/** The current path and query string; re-renders on navigation. */
export function usePath(): { path: string; search: URLSearchParams } {
  const url = useSyncExternalStore(subscribe, snapshot);
  const [path = '/', query = ''] = url.split('?');
  return { path, search: new URLSearchParams(query) };
}

export function navigate(to: string, opts: { replace?: boolean } = {}): void {
  if (to === snapshot()) return;
  if (opts.replace) window.history.replaceState(null, '', to);
  else window.history.pushState(null, '', to);
  window.dispatchEvent(new PopStateEvent('popstate'));
  window.scrollTo(0, 0);
}
