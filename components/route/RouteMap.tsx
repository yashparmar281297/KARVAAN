"use client";

import { motion, useInView, useReducedMotion } from "motion/react";
import { useMemo, useRef, useState } from "react";
import { duration } from "@/lib/format";
import { elevationPath, projectPath } from "@/lib/geometry";
import { STOP_ICON, STOP_LABEL } from "@/lib/stops";
import type { Route } from "@/lib/types";
import { Icon } from "../ui/Icon";


/**
 * Interactive route plate: the road's true shape drawn over a contour field,
 * stops you can select, and an elevation trace synced to the selection.
 */
export function RouteMap({ route, compact }: { route: Route; compact?: boolean }) {
  // A traced map needs waypoints and coordinates; otherwise show start → end.
  const traced = route.path && route.distanceKm && route.stops.every((s) => s.lat !== undefined && s.lng !== undefined);
  return traced ? <TracedRouteMap route={route} compact={compact} /> : <SimpleRoute route={route} />;
}

function SimpleRoute({ route }: { route: Route }) {
  return (
    <div className="overflow-hidden bg-carbon p-5 hairline md:p-8" style={{ borderRadius: 4 }}>
      <ol className="relative">
        {route.stops.map((s, i) => (
          <li key={s.name} className="relative flex items-start gap-4 pb-8 last:pb-0">
            {i < route.stops.length - 1 && <span className="absolute left-[17px] top-9 h-[calc(100%-28px)] w-[2px] bg-ember/60" />}
            <span className={`relative grid h-9 w-9 shrink-0 place-items-center rounded-full ${s.kind === "end" ? "bg-ember text-ink" : "text-ivory hairline-strong"}`}>
              <Icon name={STOP_ICON[s.kind]} size={16} />
            </span>
            <span className="pt-1">
              <span className="label block !text-[9.5px]">{STOP_LABEL[s.kind]}</span>
              <span className="mt-1 block text-lg text-ivory">{s.name}</span>
              {s.note && <span className="mt-1 block text-sm text-silver">{s.note}</span>}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function TracedRouteMap({ route: r, compact }: { route: Route; compact?: boolean }) {
  // Callers guarantee geometry is present.
  const route = r as Route & { path: [number, number][]; distanceKm: number; durationMin: number; elevation: number[] };
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15% 0px" });
  const W = 1000;
  const H = compact ? 520 : 600;
  const p = useMemo(() => projectPath(route.path, W, H, 80), [route.path, H]);
  const [sel, setSel] = useState(0);
  const stop = route.stops[sel];
  const elev = useMemo(() => elevationPath(route.elevation.length ? route.elevation : [0, 0], 1000, 120), [route.elevation]);
  const selX = ((stop.km ?? 0) / route.distanceKm) * 1000;

  return (
    <div ref={ref} className="overflow-hidden bg-carbon hairline" style={{ borderRadius: 4 }}>
      <div className="grid lg:grid-cols-[1fr_340px]">
        {/* Map */}
        <div className="relative">
          <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img" aria-label={`Map of the route from ${route.from} to ${route.to}`}>
            <defs>
              <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M50 0H0V50" fill="none" className="stroke-ivory" strokeOpacity=".04" />
              </pattern>
              <radialGradient id="glow" cx="50%" cy="50%" r="50%">
                <stop offset="0" className="[stop-color:var(--color-ember)]" stopOpacity=".18" />
                <stop offset="1" className="[stop-color:var(--color-ember)]" stopOpacity="0" />
              </radialGradient>
            </defs>
            <rect width={W} height={H} fill="url(#grid)" />
            {/* Contour field — decorative terrain */}
            {Array.from({ length: 14 }, (_, i) => (
              <path
                key={i}
                d={`M-20 ${40 + i * 44} C ${200 + ((i * 53) % 120)} ${10 + i * 44}, ${420 - ((i * 37) % 140)} ${90 + i * 44}, ${620 + ((i * 29) % 90)} ${40 + i * 44} S ${900} ${70 + i * 44}, ${1020} ${30 + i * 44}`}
                fill="none"
                className="stroke-ivory"
                strokeOpacity={0.035 + (i % 3) * 0.012}
              />
            ))}
            <circle cx={p.points.at(-1)![0]} cy={p.points.at(-1)![1]} r="120" fill="url(#glow)" />
            {/* Road casing + dashes + animated line */}
            <path d={p.d} fill="none" stroke="#000" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" opacity=".7" />
            <path d={p.d} fill="none" className="stroke-steel" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
            <motion.path
              d={p.d}
              fill="none"
              className="stroke-ember"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: reduce ? 1 : 0 }}
              animate={{ pathLength: inView ? 1 : 0 }}
              transition={{ duration: 2.4, ease: [0.65, 0, 0.35, 1] }}
            />
            {/* Stops */}
            {route.stops.map((s, i) => {
              const [x, y] = p.project(s.lat!, s.lng!);
              const on = i === sel;
              return (
                <motion.g
                  key={s.name}
                  initial={{ opacity: reduce ? 1 : 0 }}
                  animate={{ opacity: inView ? 1 : 0 }}
                  transition={{ delay: reduce ? 0 : 0.6 + ((s.km ?? 0) / route.distanceKm) * 1.8 }}
                  onClick={() => setSel(i)}
                  onMouseEnter={() => setSel(i)}
                  className="cursor-pointer"
                  role="button"
                  aria-label={`${STOP_LABEL[s.kind]}: ${s.name}`}
                >
                  <circle cx={x} cy={y} r={on ? 22 : 14} className={on ? "fill-ember stroke-ember" : "fill-ink stroke-ivory"} strokeOpacity={on ? 1 : 0.5} strokeWidth="1.5" style={{ transition: "all .3s" }} />
                  <g transform={`translate(${x - 9} ${y - 9}) scale(.75)`} className={on ? "text-ink" : "text-ivory"}>
                    <Icon name={STOP_ICON[s.kind]} size={24} strokeWidth={1.6} />
                  </g>
                  {(s.kind === "start" || s.kind === "end") && (
                    <text x={x} y={y - 32} textAnchor="middle" className="fill-ivory" style={{ font: "800 22px var(--font-archivo)", fontStretch: "125%", textTransform: "uppercase" }}>
                      {s.kind === "start" ? route.from : route.to}
                    </text>
                  )}
                </motion.g>
              );
            })}
          </svg>
          <div className="pointer-events-none absolute left-4 top-4 flex gap-6 md:left-6 md:top-6">
            <div>
              <p className="readout text-2xl md:text-3xl">{route.distanceKm}</p>
              <p className="label !text-[9px]">KM</p>
            </div>
            <div>
              <p className="readout text-2xl md:text-3xl">{route.durationMin ? duration(route.durationMin) : "—"}</p>
              <p className="label !text-[9px]">Drive time</p>
            </div>
          </div>
          <p className="label pointer-events-none absolute bottom-4 right-4 !text-[9px] text-mute">N ↑ · Not to scale for navigation</p>
        </div>

        {/* Stop list */}
        <div className="border-t border-line lg:border-l lg:border-t-0">
          <ol className="no-scrollbar max-h-[600px] overflow-y-auto">
            {route.stops.map((s, i) => (
              <li key={s.name}>
                <button onClick={() => setSel(i)} className={`flex w-full items-start gap-4 border-b border-line p-4 text-left transition-colors ${i === sel ? "bg-graphite" : "hover:bg-graphite/50"}`}>
                  <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${i === sel ? "bg-ember text-ink" : "text-silver hairline-strong"}`}>
                    <Icon name={STOP_ICON[s.kind]} size={16} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="label flex justify-between !text-[9.5px]">
                      {STOP_LABEL[s.kind]} {s.km !== undefined && <span className="readout text-silver">KM {s.km}</span>}
                    </span>
                    <span className="mt-1 block text-[15px] text-ivory">{s.name}</span>
                    {s.note && i === sel && <span className="mt-1 block text-[13px] text-silver">{s.note}</span>}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* Elevation */}
      <div className="border-t border-line p-4 md:p-6">
        <div className="mb-2 flex items-center justify-between">
          <span className="label">Elevation</span>
          <span className="readout text-xs text-silver">
            {elev.min} – {elev.max} M
          </span>
        </div>
        <svg viewBox="0 0 1000 120" preserveAspectRatio="none" className="h-24 w-full" aria-hidden>
          <defs>
            <linearGradient id="elev" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" className="[stop-color:var(--color-ivory)]" stopOpacity=".18" />
              <stop offset="1" className="[stop-color:var(--color-ivory)]" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={elev.area} fill="url(#elev)" />
          <path d={elev.line} fill="none" className="stroke-ivory" strokeOpacity=".6" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
          <line x1={selX} x2={selX} y1="0" y2="120" className="stroke-ember" strokeWidth="1.5" vectorEffect="non-scaling-stroke" style={{ transition: "all .4s" }} />
        </svg>
        <div className="mt-1 flex justify-between">
          <span className="label !text-[9px] text-mute">{route.from}</span>
          <span className="label !text-[9px] text-mute">{route.to}</span>
        </div>
      </div>
    </div>
  );
}
