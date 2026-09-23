import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { band, priority, requests, teams, volunteers, type Band } from './data';
import { PriorityBadge, StatusBadge, type Status } from './parts';

/*
 * Marker shapes are a prototype choice (DESIGN.md lists them as Not established).
 * Every marker differs by shape and letter as well as color, so color is never the only signal:
 *   request = circle with the band letter, volunteer = small square "V", team base = diamond "T".
 */
const bandFill: Record<Band, string> = {
  Critical: 'var(--destructive)',
  High: 'var(--warning)',
  Normal: 'var(--muted-foreground)',
};

const requestIcon = (b: Band, selected: boolean) =>
  L.divIcon({
    className: '',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    html: `<div style="width:28px;height:28px;border-radius:9999px;background:${bandFill[b]};color:#fff;display:grid;place-items:center;font:600 12px system-ui;border:2px solid #fff;box-shadow:0 0 0 ${selected ? '3px var(--primary)' : '1px var(--foreground)'}">${b[0] ?? ''}</div>`,
  });

const volunteerIcon = L.divIcon({
  className: '',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
  html: '<div style="width:18px;height:18px;background:#fff;border:2px solid var(--foreground);color:var(--foreground);display:grid;place-items:center;font:600 10px system-ui">V</div>',
});

const teamIcon = L.divIcon({
  className: '',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
  html: '<div style="width:16px;height:16px;margin:3px;background:var(--foreground);transform:rotate(45deg);display:grid;place-items:center"><span style="transform:rotate(-45deg);color:#fff;font:600 9px system-ui">T</span></div>',
});

export function MapView({
  statusOf,
  onOpen,
}: {
  statusOf: (r: (typeof requests)[number]) => Status;
  onOpen: (id: string) => void;
}) {
  const el = useRef<HTMLDivElement>(null);
  const layer = useRef<L.LayerGroup | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!el.current) return;
    const m = L.map(el.current, { scrollWheelZoom: true }).setView([30.25, 78.1], 10);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(m);
    layer.current = L.layerGroup().addTo(m);
    return () => {
      m.remove();
    };
  }, []);

  useEffect(() => {
    const g = layer.current;
    if (!g) return;
    g.clearLayers();
    for (const v of volunteers.filter((x) => x.available)) {
      L.marker([v.lat, v.lon], { icon: volunteerIcon, title: `Volunteer ${v.name}` }).addTo(g);
    }
    for (const t of teams) {
      L.marker([t.lat, t.lon], { icon: teamIcon, title: `${t.name} (${t.status})` }).addTo(g);
    }
    for (const r of requests) {
      const b = band(priority(r).total);
      const sel = r.id === selectedId;
      if (sel) {
        // PRD F7: volunteers beyond 25 km get zero proximity.
        L.circle([r.lat, r.lon], {
          radius: 25000,
          color: '#1d4ed8' /* --primary; Leaflet paths need a literal */,
          weight: 1,
          dashArray: '4 4',
          fill: false,
        }).addTo(g);
      }
      L.marker([r.lat, r.lon], {
        icon: requestIcon(b, sel),
        title: `${r.id}, ${b} priority`,
        zIndexOffset: sel ? 1000 : 500,
        keyboard: true,
      })
        .on('click', () => setSelectedId(r.id))
        .addTo(g);
    }
  }, [selectedId]);

  const sel = requests.find((r) => r.id === selectedId);
  const p = sel ? priority(sel) : null;

  return (
    <div className="grid min-h-0 flex-1 lg:grid-cols-4">
      <div ref={el} className="z-0 min-h-96 lg:col-span-3" />
      <aside className="space-y-6 border-l p-4 lg:overflow-y-auto">
        <section>
          <h2 className="mb-2 text-base font-semibold">Legend</h2>
          <ul className="space-y-2">
            {(['Critical', 'High', 'Normal'] as const).map((b) => (
              <li key={b} className="flex items-center gap-2">
                <span
                  className="grid size-5 place-items-center rounded-full text-xs font-semibold text-white"
                  style={{ background: bandFill[b] }}
                  aria-hidden="true"
                >
                  {b[0]}
                </span>
                {b} request
              </li>
            ))}
            <li className="flex items-center gap-2">
              <span
                className="grid size-5 place-items-center border-2 border-slate-900 text-xs font-semibold"
                aria-hidden="true"
              >
                V
              </span>
              Available volunteer
            </li>
            <li className="flex items-center gap-2">
              <span className="grid size-5 place-items-center" aria-hidden="true">
                <span className="size-3.5 rotate-45 bg-slate-900" />
              </span>
              Team base
            </li>
          </ul>
        </section>

        <section aria-live="polite">
          {sel && p ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-semibold">{sel.id}</h2>
                <PriorityBadge band={band(p.total)} score={p.total} />
                <StatusBadge status={statusOf(sel)} />
              </div>
              <p>
                {sel.hazard} · {sel.place}
              </p>
              <p className="text-muted-foreground tabular-nums">
                {sel.trapped} trapped · {sel.injured} injured · {sel.minutesAgo} min ago
              </p>
              <p className="text-muted-foreground text-xs">
                The dashed circle is the 25 km proximity radius.
              </p>
              <Button onClick={() => onOpen(sel.id)}>Open in queue</Button>
            </div>
          ) : (
            <p className="text-muted-foreground">
              Select a request marker to see it here. The same requests are listed in the Queue.
            </p>
          )}
        </section>
      </aside>
    </div>
  );
}
