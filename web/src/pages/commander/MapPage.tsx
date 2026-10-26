import { lazy, Suspense } from 'react';
import { SampleDataNote } from '@/components/SampleDataNote';
import { navigate } from '@/router';
import { CommanderShell } from '@/shells/CommanderShell';

// Leaflet is loaded only when a commander opens the map, so citizen phones never download it.
const MapView = lazy(() => import('./MapView').then((m) => ({ default: m.MapView })));

/** Requests, available volunteers and team bases on one map (PRD F13). Sample only. */
export function MapPage() {
  return (
    <CommanderShell
      title="Map"
      description="Open requests, available volunteers and team bases."
      fill
    >
      <div className="px-4 pb-3 lg:px-6">
        <SampleDataNote />
      </div>
      <Suspense fallback={<div className="bg-muted min-h-96 flex-1" aria-busy="true" />}>
        <MapView
          statusOf={(r) => r.status}
          onOpen={(id) => navigate(`/commander/queue?r=${encodeURIComponent(id)}`)}
        />
      </Suspense>
    </CommanderShell>
  );
}
