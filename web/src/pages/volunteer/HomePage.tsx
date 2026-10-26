import { useState } from 'react';
import { StatusBadge, SkillChip } from '@/components/domain';
import { SampleDataNote } from '@/components/SampleDataNote';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { skillName } from '@/i18n/dictionaries';
import { useLang } from '@/i18n/use-lang';
import { distanceKm, requests, requiredSkills, volunteers } from '@/sample/data';
import { VolunteerShell } from '@/shells/VolunteerShell';

const me = volunteers[0]!;
const offer = requests[0]!;
// PRD AC18: the volunteer sees the request place and needs, never the citizen's phone.
const km = distanceKm(me.lat, me.lon, offer.lat, offer.lon);

type OfferState = 'offered' | 'accepted' | 'completed' | 'declined';

/** Volunteer home: location banner, availability, current offer or assignment. Sample only. */
export function HomePage() {
  const [, , t] = useLang();
  const [asked, setAsked] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [sharedNow, setSharedNow] = useState(false);
  const [available, setAvailable] = useState(true);
  const [state, setState] = useState<OfferState>('offered');

  function share() {
    setSharing(true);
    navigator.geolocation.getCurrentPosition(
      () => {
        setAsked(false);
        setSharing(false);
        setSharedNow(true);
      },
      () => setSharing(false),
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }

  const hazard = t[offer.hazard === 'Flood' ? 'flood' : 'landslide'];

  return (
    <VolunteerShell title={t.home}>
      <div>
        <h1 className="text-2xl font-semibold">{me.name}</h1>
        <p className="text-muted-foreground text-sm tabular-nums">
          {t.locationAge}: {sharedNow ? t.justNow : `${String(me.locationAgeMin)} ${t.minAgo}`}
        </p>
      </div>
      <SampleDataNote text={t.sampleNote} />

      {asked ? (
        <Alert>
          <AlertTitle>{t.bannerTitle}</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>{t.bannerBody}</p>
            <Button size="lg" onClick={share} disabled={sharing}>
              {t.shareLocation}
            </Button>
          </AlertDescription>
        </Alert>
      ) : (
        <p role="status" className="text-sm text-green-700">
          ✓ {t.sharedOk}
        </p>
      )}

      <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
        <div>
          <label htmlFor="avail" className="text-base font-semibold">
            {available ? t.available : t.unavailable}
          </label>
          <p className="text-muted-foreground text-sm">
            {available ? t.availableHint : t.unavailableHint}
          </p>
        </div>
        <Switch
          id="avail"
          checked={available}
          onCheckedChange={setAvailable}
          disabled={state === 'accepted'}
          className="scale-125"
        />
      </div>

      <section aria-live="polite">
        {state === 'accepted' || state === 'completed' ? (
          <div className="space-y-4 rounded-lg border p-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-semibold">{t.assignment}</h2>
              <StatusBadge
                status={state === 'completed' ? 'Completed' : 'Accepted'}
                label={state === 'completed' ? t.statusCompleted : t.statusAccepted}
              />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">{t.goTo}</p>
              <p className="text-base font-medium">
                {hazard} · {offer.place}
              </p>
              <p className="text-muted-foreground tabular-nums">
                {km.toFixed(1)} km · {offer.id}
              </p>
            </div>
            {state === 'accepted' ? (
              <Button size="lg" className="w-full" onClick={() => setState('completed')}>
                {t.markDone}
              </Button>
            ) : (
              <p className="text-green-700">✓ {t.completed}</p>
            )}
          </div>
        ) : !available ? (
          <p className="text-muted-foreground rounded-lg border border-dashed p-4">
            {t.unavailableHint}
          </p>
        ) : state === 'declined' ? (
          <p className="text-muted-foreground rounded-lg border border-dashed p-4">
            {t.declined} {t.noOffers}
          </p>
        ) : (
          <div className="space-y-4 rounded-lg border-2 border-amber-800 p-4">
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="text-lg font-semibold">{t.offerTitle}</h2>
              <span className="text-muted-foreground text-xs tabular-nums">{offer.id}</span>
            </div>
            <div>
              <p className="text-base font-medium">
                {hazard} · {offer.place}
              </p>
              <p className="text-muted-foreground tabular-nums">
                {km.toFixed(1)} km {t.offerAway} · {t.trapped}: {offer.trapped} · {t.injured}:{' '}
                {offer.injured}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1 text-sm">{t.offerNeeds}</p>
              <div className="flex flex-wrap gap-1">
                {requiredSkills(offer.hazard).map((s) => {
                  const ok = me.verified.includes(s);
                  return (
                    <SkillChip
                      key={s}
                      skill={skillName(t, s)}
                      verified={ok}
                      stateText={`(${ok ? t.verified : t.unverifiedLabel})`}
                    />
                  );
                })}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button size="lg" variant="outline" onClick={() => setState('declined')}>
                {t.decline}
              </Button>
              <Button size="lg" onClick={() => setState('accepted')}>
                {t.accept}
              </Button>
            </div>
          </div>
        )}
      </section>
    </VolunteerShell>
  );
}
