import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { CitizenForm } from './prototype/CitizenForm';
import { CommanderQueue, type Decision } from './prototype/CommanderQueue';
import { VolunteerHome } from './prototype/VolunteerHome';

/**
 * UI prototype for Progress Report 1: every role's main screen, on sample data,
 * with no API behind it. Phase 3 replaces this with real routes per role.
 */
const views = [
  ['citizen', 'Citizen'],
  ['volunteer', 'Volunteer'],
  ['onsite', 'On-site commander'],
  ['office', 'Office commander'],
] as const;
type View = (typeof views)[number][0];

// Unknown hashes (the #content skip link) leave the current screen alone.
const fromHash = (): View | undefined => views.find(([k]) => `#${k}` === window.location.hash)?.[0];

export default function App() {
  const [view, setView] = useState<View>(() => fromHash() ?? 'citizen');
  // Shared so a selection sent by the on-site commander shows up for the office commander.
  const [decisions, setDecisions] = useState<Record<string, Decision | undefined>>({});

  useEffect(() => {
    const onHash = () => setView((cur) => fromHash() ?? cur);
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const label = views.find(([k]) => k === view)?.[1] ?? '';
  useEffect(() => {
    document.title = `${label} · RescueAI`;
  }, [label]);

  const commander = view === 'onsite' || view === 'office';

  return (
    // Commander screens fill the viewport so the list and the detail scroll on their own.
    <div className={cn('flex min-h-screen flex-col', commander && 'lg:h-screen')}>
      <a
        href="#content"
        className="focus:bg-background sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-2"
      >
        Skip to content
      </a>
      <nav
        aria-label="Prototype screens"
        className="flex flex-wrap items-center gap-x-1 border-b border-slate-700 bg-slate-800 px-2 text-xs text-slate-200"
      >
        <span className="px-2 py-2 font-medium text-white">Prototype · sample data</span>
        {views.map(([k, label]) => (
          <a
            key={k}
            href={`#${k}`}
            aria-current={view === k ? 'page' : undefined}
            className={cn(
              'rounded px-2 py-2 hover:text-white focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none',
              view === k && 'bg-slate-700 text-white',
            )}
          >
            {label}
          </a>
        ))}
      </nav>
      {view === 'citizen' && <CitizenForm />}
      {view === 'volunteer' && <VolunteerHome />}
      {commander && (
        <CommanderQueue
          key={view}
          role={view}
          decisions={decisions}
          setDecision={(id, d) => setDecisions((cur) => ({ ...cur, [id]: d }))}
        />
      )}
    </div>
  );
}
