import { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { distanceKm, requests, requiredSkills, volunteers } from './data';
import { dict, type Lang } from './i18n';
import { LangSwitch, SkillChip, StatusBadge } from './parts';

const me = volunteers[0]!;
const offer = requests[0]!;
// PRD AC18: the volunteer sees the request place and needs, never the citizen's phone.
const km = distanceKm(me.lat, me.lon, offer.lat, offer.lon);

type OfferState = 'offered' | 'accepted' | 'completed' | 'declined';

export function VolunteerHome() {
  const [lang, setLang] = useState<Lang>('en');
  const t = dict[lang];
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
  const history: [string, number][] = [
    [t.offers, me.offered + 1],
    [t.acceptedCount, me.completed + (state === 'offered' || state === 'declined' ? 0 : 1)],
    [t.completedCount, me.completed + (state === 'completed' ? 1 : 0)],
  ];

  return (
    <div lang={lang} className="bg-muted flex flex-1 flex-col">
      <div className="bg-background mx-auto w-full max-w-lg flex-1 sm:border-x">
        <header className="flex items-center justify-between border-b px-4">
          <span className="font-semibold">RescueAI · {t.home}</span>
          <LangSwitch lang={lang} setLang={setLang} />
        </header>

        <main id="content" className="space-y-6 px-4 py-6">
          <div>
            <h1 className="text-2xl font-semibold">{me.name}</h1>
            <p className="text-muted-foreground text-sm tabular-nums">
              {t.locationAge}: {sharedNow ? t.justNow : `${String(me.locationAgeMin)} ${t.minAgo}`}
            </p>
          </div>

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
                  <StatusBadge status={state === 'completed' ? 'Completed' : 'Accepted'} />
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
                    {requiredSkills(offer.hazard).map((s) => (
                      <SkillChip key={s} skill={s} verified={me.verified.includes(s)} />
                    ))}
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

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">{t.mySkills}</h2>
            <ul>
              {[
                ...me.verified.map((s) => [s, true] as const),
                ...me.unverified.map((s) => [s, false] as const),
              ].map(([s, ok]) => (
                <li key={s} className="flex items-center justify-between border-b py-2">
                  <span>{s}</span>
                  <span className={ok ? 'text-sm text-green-700' : 'text-muted-foreground text-sm'}>
                    {ok ? `✓ ${t.verified}` : t.unverifiedLabel}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">{t.history}</h2>
            <dl className="grid grid-cols-3 rounded-lg border">
              {history.map(([label, n]) => (
                <div key={label} className="border-r px-3 py-2 last:border-r-0">
                  <dt className="text-muted-foreground text-xs">{label}</dt>
                  <dd className="text-lg font-semibold tabular-nums">{n}</dd>
                </div>
              ))}
            </dl>
          </section>
        </main>
      </div>
    </div>
  );
}
