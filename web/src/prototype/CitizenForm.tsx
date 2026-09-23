import { useRef, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { dict, type Lang } from './i18n';
import { LangSwitch } from './parts';

type Coords = { lat: number; lon: number; accuracy: number };
type Errors = Partial<Record<'location' | 'hazard' | 'phone', string>>;

const flagKeys = ['children', 'elderly', 'injuredFlag', 'disability'] as const;

export function CitizenForm() {
  const [lang, setLang] = useState<Lang>('en');
  const t = dict[lang];

  const [coords, setCoords] = useState<Coords | null>(null);
  const [locState, setLocState] = useState<'idle' | 'busy' | 'denied'>('idle');
  const [hazard, setHazard] = useState<'flood' | 'landslide' | ''>('');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [counts, setCounts] = useState({ affected: '', trapped: '', injured: '' });
  const [flags, setFlags] = useState<string[]>([]);
  const [details, setDetails] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [submitted, setSubmitted] = useState(false);
  const [refId, setRefId] = useState<string | null>(null);

  const locRef = useRef<HTMLButtonElement>(null);
  const hazardRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);

  function validate(next = { coords, hazard, phone }): Errors {
    const e: Errors = {};
    if (!next.coords) e.location = t.locationMissing;
    if (!next.hazard) e.hazard = t.hazardMissing;
    if (!/^[6-9]\d{9}$/.test(next.phone.replace(/\s/g, ''))) e.phone = t.phoneBad;
    return e;
  }

  // DESIGN.md -> Forms: validate on submit, then re-validate as the user edits.
  function recheck(next: Partial<{ coords: Coords | null; hazard: typeof hazard; phone: string }>) {
    if (submitted) setErrors(validate({ coords, hazard, phone, ...next }));
  }

  function locate() {
    setLocState('busy');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c = {
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy),
        };
        setCoords(c);
        setLocState('idle');
        recheck({ coords: c });
      },
      () => setLocState('denied'),
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }

  function submit(ev: React.FormEvent) {
    ev.preventDefault();
    setSubmitted(true);
    const e = validate();
    setErrors(e);
    if (e.location) locRef.current?.focus();
    else if (e.hazard) hazardRef.current?.focus();
    else if (e.phone) phoneRef.current?.focus();
    else setRefId(`RQ-${String(4831 + Math.floor(Math.random() * 100))}`);
  }

  if (refId) {
    return (
      <Shell lang={lang} setLang={setLang}>
        <section aria-live="polite" className="space-y-6">
          <div className="space-y-1">
            <p className="text-sm font-medium text-green-700">✓ {t.sentTitle}</p>
            <h1 className="text-2xl font-semibold">{t.sentRef}</h1>
          </div>
          <p className="rounded-lg border-2 border-dashed border-slate-500 py-4 text-center text-4xl font-semibold tracking-widest tabular-nums">
            {refId}
          </p>
          <p className="text-muted-foreground">{t.sentKeep}</p>
          <div>
            <h2 className="mb-3 text-lg font-semibold">{t.nextTitle}</h2>
            <ol className="space-y-3">
              {[t.next1, t.next2, `${t.next3} ${phone}.`].map((line, i) => (
                <li key={line} className="flex gap-3">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full border border-slate-500 text-sm tabular-nums">
                    {i + 1}
                  </span>
                  <span>{line}</span>
                </li>
              ))}
            </ol>
          </div>
          <Button size="lg" variant="outline" onClick={() => setRefId(null)} className="w-full">
            {t.sentAgain}
          </Button>
        </section>
      </Shell>
    );
  }

  const errText = (id: keyof Errors) =>
    errors[id] && (
      <p id={`${id}-error`} className="text-sm text-red-700">
        {errors[id]}
      </p>
    );

  return (
    <Shell lang={lang} setLang={setLang}>
      <h1 className="text-2xl font-semibold">{t.appTitle}</h1>
      <p className="text-muted-foreground">{t.appIntro}</p>

      <form noValidate onSubmit={submit} className="space-y-6">
        <fieldset className="space-y-2">
          <legend className="mb-2 font-medium">{t.location}</legend>
          <Button
            ref={locRef}
            type="button"
            size="lg"
            variant="outline"
            onClick={locate}
            disabled={locState === 'busy'}
            aria-describedby={errors.location ? 'location-error' : undefined}
            className="w-full"
          >
            {locState === 'busy' ? t.locating : t.useLocation}
          </Button>
          {coords && (
            <p className="text-sm text-green-700 tabular-nums">
              ✓ {t.locationSet}: {coords.lat.toFixed(5)}, {coords.lon.toFixed(5)} (±
              {coords.accuracy} m)
            </p>
          )}
          {locState === 'denied' && (
            <Alert variant="destructive">
              <AlertDescription>{t.locationDenied}</AlertDescription>
            </Alert>
          )}
          {errText('location')}
        </fieldset>

        <fieldset
          aria-describedby={errors.hazard ? 'hazard-error' : undefined}
          className="space-y-2"
        >
          <legend className="mb-2 font-medium">{t.hazard}</legend>
          <div className="grid grid-cols-2 gap-2">
            {(['flood', 'landslide'] as const).map((h, i) => (
              <label
                key={h}
                className={cn(
                  'has-focus-visible:ring-ring flex min-h-12 cursor-pointer items-center gap-2 rounded-md border border-slate-500 px-3 has-focus-visible:ring-2',
                  hazard === h && 'border-primary bg-blue-50 font-medium',
                )}
              >
                <input
                  ref={i === 0 ? hazardRef : undefined}
                  type="radio"
                  name="hazard"
                  value={h}
                  checked={hazard === h}
                  onChange={() => {
                    setHazard(h);
                    recheck({ hazard: h });
                  }}
                  className="accent-primary size-4"
                />
                {t[h]}
              </label>
            ))}
          </div>
          {errText('hazard')}
        </fieldset>

        <div className="space-y-2">
          <Label htmlFor="phone" className="text-base">
            {t.phone}
          </Label>
          <Input
            ref={phoneRef}
            id="phone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              recheck({ phone: e.target.value });
            }}
            aria-invalid={errors.phone ? true : undefined}
            aria-describedby={errors.phone ? 'phone-hint phone-error' : 'phone-hint'}
            className="h-11 text-base"
          />
          <p id="phone-hint" className="text-muted-foreground text-sm">
            {t.phoneHint}
          </p>
          {errText('phone')}
        </div>

        <div className="space-y-2">
          <Label htmlFor="name" className="text-base">
            {t.name} <span className="text-muted-foreground font-normal">{t.optional}</span>
          </Label>
          <Input
            id="name"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-11 text-base"
          />
        </div>

        <fieldset>
          <legend className="mb-2 font-medium">
            {t.counts} <span className="text-muted-foreground font-normal">{t.optional}</span>
          </legend>
          <div className="grid grid-cols-3 gap-3">
            {(['affected', 'trapped', 'injured'] as const).map((k) => (
              <div key={k} className="space-y-1">
                <Label htmlFor={k} className="text-muted-foreground text-sm font-normal">
                  {t[k]}
                </Label>
                <Input
                  id={k}
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={counts[k]}
                  onChange={(e) => setCounts({ ...counts, [k]: e.target.value })}
                  className="h-11 text-base tabular-nums"
                />
              </div>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-2 font-medium">
            {t.vulnerable} <span className="text-muted-foreground font-normal">{t.optional}</span>
          </legend>
          <div className="grid grid-cols-2 gap-x-4">
            {flagKeys.map((k) => (
              <div key={k} className="flex min-h-11 items-center gap-2">
                <Checkbox
                  id={k}
                  checked={flags.includes(k)}
                  onCheckedChange={(v) =>
                    setFlags(v === true ? [...flags, k] : flags.filter((f) => f !== k))
                  }
                />
                <Label htmlFor={k} className="text-base font-normal">
                  {t[k]}
                </Label>
              </div>
            ))}
          </div>
        </fieldset>

        <div className="space-y-2">
          <Label htmlFor="details" className="text-base">
            {t.details} <span className="text-muted-foreground font-normal">{t.optional}</span>
          </Label>
          <Textarea
            id="details"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            className="text-base"
          />
        </div>

        <Button type="submit" size="lg" className="h-12 w-full text-base">
          {t.submit}
        </Button>
      </form>
    </Shell>
  );
}

function Shell({
  lang,
  setLang,
  children,
}: {
  lang: Lang;
  setLang: (l: Lang) => void;
  children: React.ReactNode;
}) {
  return (
    <div lang={lang} className="bg-muted flex flex-1 flex-col">
      <main
        id="content"
        className="bg-background mx-auto w-full max-w-lg flex-1 space-y-6 px-4 pt-2 pb-12 sm:border-x"
      >
        <div className="flex items-center justify-between border-b pb-1">
          <span className="font-semibold">RescueAI</span>
          <LangSwitch lang={lang} setLang={setLang} />
        </div>
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{dict[lang].call112}</p>
        {children}
      </main>
    </div>
  );
}
