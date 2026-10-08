import Link from "next/link";
import { getRoute, eventHost } from "@/lib/data";
import { dayNum, duration, monthShort } from "@/lib/format";
import { projectPath } from "@/lib/geometry";
import type { Event } from "@/lib/types";
import { Icon } from "../ui/Icon";
import { FittedImage } from "../ui/FittedImage";

/**
 * A Drive / Ride / Road Trip event shown through its route: the road's real
 * shape traced over the cover. Routes only exist as part of these events.
 */
export function DriveCard({ e, priority }: { e: Event; priority?: boolean }) {
  const r = e.route ? getRoute(e.route) : undefined;
  if (!r) return null;
  const host = eventHost(e);
  // No waypoints yet: draw a clean start → end line.
  const p = projectPath(r.path ?? [[0, 0], [0.35, 1]], 400, 260, 36);
  const start = p.points[0];
  const end = p.points[p.points.length - 1];
  return (
    <Link href={`/events/${e.slug}`} className="group relative block overflow-hidden bg-graphite hairline" style={{ borderRadius: 3 }}>
      <div className="on-photo relative aspect-video overflow-hidden">
        <FittedImage src={e.cover} alt={`${r.from} to ${r.to}`} sizes="(max-width: 768px) 85vw, 400px" preload={priority} className="opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/70 via-ink/10 to-ink" />
        <svg viewBox={`0 0 ${p.width} ${p.height}`} className="absolute inset-x-0 top-[14%] w-full" aria-hidden>
          <path d={p.d} fill="none" className="stroke-ink" strokeWidth="7" strokeLinecap="round" opacity=".6" />
          <path d={p.d} fill="none" className="stroke-ember" strokeOpacity=".45" strokeWidth="2" strokeLinecap="round" />
          {/* Bright pass that draws the road in on hover */}
          <path
            d={p.d}
            pathLength={1}
            fill="none"
            strokeWidth="2.75"
            strokeLinecap="round"
            className="stroke-ember [stroke-dasharray:1] [stroke-dashoffset:1] transition-[stroke-dashoffset] duration-[1.6s] ease-[cubic-bezier(.16,1,.3,1)] group-hover:[stroke-dashoffset:0]"
          />
          <circle cx={start[0]} cy={start[1]} r="5" className="fill-ink stroke-ivory" strokeWidth="1.5" />
          <circle cx={end[0]} cy={end[1]} r="6" className="fill-ember" />
        </svg>
        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-4">
          <span className="label rounded-full bg-ink/70 px-2.5 py-1 text-ivory backdrop-blur">{e.category}</span>
          <span className="text-right">
            <span className="display block text-2xl leading-none">{dayNum(e.date)}</span>
            <span className="label">{monthShort(e.date)}</span>
          </span>
        </div>
        <div className="absolute inset-x-0 bottom-0 p-5">
          <p className="label text-silver">{r.from}</p>
          <h3 className="display mt-1 flex items-center gap-2 text-[1.9rem]">
            <Icon name="arrow" size={18} className="text-ember" /> {r.to}
          </h3>
          <p className="label mt-2 !text-[9.5px] text-mute [overflow-wrap:anywhere]">
            {e.title} · {host.name}
          </p>
          <div className="mt-4 flex items-center gap-5 border-t border-line pt-3">
            {r.distanceKm ? (
              <span className="readout text-lg">
                {r.distanceKm} <span className="label">KM</span>
              </span>
            ) : null}
            {r.durationMin ? <span className="readout text-lg">{duration(r.durationMin)}</span> : <span className="label">{e.category}</span>}
            <span className="ml-auto grid h-9 w-9 place-items-center rounded-full hairline-strong transition group-hover:bg-ivory group-hover:text-ink">
              <Icon name="arrowUpRight" size={14} />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
