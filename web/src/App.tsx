import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type Health = { status: string; db: string };

type LocationState =
  | { kind: 'idle' }
  | { kind: 'checking' }
  | { kind: 'granted'; lat: number; lon: number; accuracy: number }
  | { kind: 'failed'; reason: string };

/**
 * Phase 1 placeholder (PLAN.md). Two jobs, both temporary:
 *  1. prove the SPA, the API and the database are wired together;
 *  2. let a real phone grant location permission over HTTPS, which is the
 *     last unmet Phase 1 exit criterion. Nothing else in the app asks for
 *     location yet, so without this there is nothing for a phone to grant.
 *
 * F1 and F2 replace all of this in Phase 3, with proper en/hi strings.
 */
export default function App() {
  const health = useQuery({
    queryKey: ['health'],
    queryFn: async (): Promise<Health> => {
      const res = await fetch('/api/health');
      if (!res.ok) throw new Error('health check failed');
      return (await res.json()) as Health;
    },
  });

  const [location, setLocation] = useState<LocationState>({ kind: 'idle' });

  function checkLocation() {
    if (!('geolocation' in navigator)) {
      setLocation({ kind: 'failed', reason: 'This browser has no location support.' });
      return;
    }
    setLocation({ kind: 'checking' });
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setLocation({
          kind: 'granted',
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy),
        }),
      (err) =>
        setLocation({
          kind: 'failed',
          reason:
            err.code === err.PERMISSION_DENIED
              ? 'Permission was refused. Allow location for this site in your browser settings, then try again.'
              : 'Your location could not be read. Move somewhere with a clearer view of the sky and try again.',
        }),
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }

  return (
    <main className="mx-auto max-w-2xl space-y-6 px-4 py-12 lg:px-6">
      <h1 className="text-2xl font-semibold">RescueAI</h1>
      <p className="text-muted-foreground text-base">
        Disaster response decision support. Setup in progress &mdash; no features are built yet.
      </p>

      <dl className="rounded-lg border p-4 text-base tabular-nums">
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">API</dt>
          <dd>
            {health.isPending ? 'checking…' : health.isError ? 'unreachable' : health.data.status}
          </dd>
        </div>
        <div className="mt-2 flex justify-between gap-2">
          <dt className="text-muted-foreground">Database</dt>
          <dd>{health.isPending ? 'checking…' : health.isError ? 'unknown' : health.data.db}</dd>
        </div>
        <div className="mt-2 flex justify-between gap-2">
          <dt className="text-muted-foreground">Location</dt>
          <dd>
            {location.kind === 'granted'
              ? `±${String(location.accuracy)} m`
              : location.kind === 'checking'
                ? 'checking…'
                : location.kind === 'failed'
                  ? 'blocked'
                  : 'not checked'}
          </dd>
        </div>
      </dl>

      <Button
        size="lg"
        onClick={checkLocation}
        disabled={location.kind === 'checking'}
        className="w-full sm:w-auto"
      >
        {location.kind === 'checking' ? 'Checking location…' : 'Share location'}
      </Button>

      {location.kind === 'granted' && (
        <p className="text-base tabular-nums">
          Location shared: {location.lat.toFixed(5)}, {location.lon.toFixed(5)}
        </p>
      )}

      {location.kind === 'failed' && (
        <Alert variant="destructive">
          <AlertTitle>Location not shared</AlertTitle>
          <AlertDescription>{location.reason}</AlertDescription>
        </Alert>
      )}
    </main>
  );
}
