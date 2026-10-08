import Link from "next/link";
import { capacity, cityName, fromPrice, getRoute, eventHost } from "@/lib/data";
import { dayNum, inr, monthShort, time, weekday } from "@/lib/format";
import type { Event } from "@/lib/types";
import { Icon } from "../ui/Icon";
import { LikeButton } from "../ui/Like";
import { FittedImage } from "../ui/FittedImage";
import { CardArt, CardBadge, CardChip, CardFooter, CardStats, GameCard } from "./GameCard";

/**
 * Event as a physical ticket: cover image stub, perforated tear line,
 * and the "counterfoil" with date, price and capacity.
 */
/**
 * `meta` carries the organiser's name and route from the server — needed when
 * the card renders inside a client component (the browser has no database).
 */
export type EventCardMeta = { host: string; route?: { from: string; to: string } };

export function EventCard({ e, priority, layout = "vertical", meta }: { e: Event; priority?: boolean; layout?: "vertical" | "wide"; meta?: EventCardMeta }) {
  const host = meta ? { name: meta.host } : eventHost(e);
  const route = meta ? meta.route : e.route ? getRoute(e.route) : undefined;
  const cap = capacity(e);
  const left = cap.left;
  const fillingFast = cap.limited && left < 25;
  const price = fromPrice(e);
  const wide = layout === "wide";

  // Grid / rail size: the event as a game card — the date is the big number.
  if (!wide)
    return (
      <GameCard>
        <Link href={`/events/${e.slug}`} className="absolute inset-0 z-[5]" aria-label={e.title} />
        <CardArt ratio="4 / 3">
          <FittedImage src={e.cover} alt={e.title} sizes="(max-width: 640px) 50vw, 240px" preload={priority} />
        </CardArt>
        <CardBadge value={dayNum(e.date)} caption={monthShort(e.date)} />
        <CardChip>{fillingFast ? "Filling fast" : e.category}</CardChip>

        <div className="game-card-body">
          <p className="game-mono truncate text-[length:max(9px,3.2cqi)] tracking-[0.14em] text-ember">
            {weekday(e.date)} · {e.timeTbc ? "Time TBA" : time(e.date)}
          </p>
          <h3 className="game-display mt-[1.4cqi] line-clamp-2 h-[1.95em] text-[7cqi] text-ivory" title={e.title}>
            {e.title}
          </h3>
          <p className="game-mono mt-[1.4cqi] flex items-center gap-[1.4cqi] truncate text-[length:max(9px,3.2cqi)] tracking-[0.12em] text-silver">
            {route ? (
              <>
                {route.from} <Icon name="arrow" size={10} /> {route.to}
              </>
            ) : (
              <>
                <Icon name="pin" size={10} /> {cityName(e.city)}
              </>
            )}
          </p>
          <div className="mt-[3cqi]">
            <CardStats
              stats={[
                { k: price === 0 ? "ENTRY" : "FROM", val: inr(price) },
                cap.limited ? { k: "LEFT", val: String(left), f: 1 - cap.soldPct / 100 } : { k: "SLOTS", val: "Open" },
              ]}
            />
          </div>
          <CardFooter
            left={<span className="truncate text-[length:max(9px,3.4cqi)] text-silver">By {host.name}</span>}
            right={<LikeButton kind="event" id={e.slug} className="text-ivory [&_.readout]:text-[length:max(12px,4cqi)]" />}
          />
        </div>
      </GameCard>
    );

  return (
    <Link
      href={`/events/${e.slug}`}
      className={`group relative flex overflow-hidden bg-graphite hairline ${wide ? "flex-col md:flex-row" : "flex-col"}`}
      style={{ borderRadius: 3 }}
    >
      {/* Stub */}
      <div className={`on-photo relative overflow-hidden ${wide ? "aspect-video md:w-[58%] md:shrink-0 md:self-center" : "aspect-video"}`}>
        <FittedImage src={e.cover} alt={e.title} sizes={wide ? "(max-width: 768px) 100vw, 60vw" : "(max-width: 640px) 85vw, 380px"} preload={priority} />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/20 to-ink/30" />
        <div className="absolute left-4 top-4 flex gap-2">
          <span className="label rounded-full bg-ink/70 px-2.5 py-1 text-ivory backdrop-blur">{e.category}</span>
          {fillingFast && (
            <span className="label flex items-center gap-1.5 rounded-full bg-ember px-2.5 py-1 !text-ink">
              <span className="h-1.5 w-1.5 rounded-full bg-ink" /> Filling fast
            </span>
          )}
        </div>
        {/* Big date block */}
        <div className="absolute bottom-4 left-4 flex items-end gap-3">
          <span className="display text-[4.25rem] leading-[0.8] text-ivory">{dayNum(e.date)}</span>
          <span className="pb-1">
            <span className="label block text-ivory">{monthShort(e.date)}</span>
            <span className="label block">
              {weekday(e.date)} · {e.timeTbc ? "Time TBA" : time(e.date)}
            </span>
          </span>
        </div>
      </div>

      {/* Perforation */}
      <div className={`relative ${wide ? "h-6 md:h-auto md:w-6" : "h-6"}`}>
        <span className={`absolute rounded-full bg-ink ${wide ? "-left-3 top-1/2 h-6 w-6 -translate-y-1/2 md:left-1/2 md:-top-3 md:-translate-x-1/2 md:translate-y-0" : "-left-3 top-1/2 h-6 w-6 -translate-y-1/2"}`} />
        <span className={`absolute rounded-full bg-ink ${wide ? "-right-3 top-1/2 h-6 w-6 -translate-y-1/2 md:left-1/2 md:-bottom-3 md:top-auto md:-translate-x-1/2 md:translate-y-0" : "-right-3 top-1/2 h-6 w-6 -translate-y-1/2"}`} />
        <span className={`absolute border-dashed border-line-strong ${wide ? "inset-x-5 top-1/2 border-t md:inset-x-auto md:inset-y-5 md:left-1/2 md:top-5 md:border-l md:border-t-0" : "inset-x-5 top-1/2 border-t"}`} />
      </div>

      {/* Counterfoil */}
      <div className={`flex flex-1 flex-col px-5 pb-5 ${wide ? "md:justify-center md:py-8 md:pl-2 md:pr-8" : ""}`}>
        <h3 className={`display ${wide ? "text-[clamp(1.6rem,min(2.6vw,3.4svh),2.4rem)]" : "text-[1.3rem]"} text-balance leading-[1.05] [overflow-wrap:anywhere]`}>{e.title}</h3>
        <p className="label mt-3 flex items-center gap-1.5 text-ivory">
          {route ? (
            <>
              {route.from} <Icon name="arrow" size={12} className="text-ember" /> {route.to}
            </>
          ) : (
            <>
              <Icon name="pin" size={12} /> {cityName(e.city)}
            </>
          )}
        </p>
        <p className="label mt-1.5 text-mute [overflow-wrap:anywhere]">By {host.name}</p>

        <div className="mt-5 flex items-end justify-between border-t border-line pt-4">
          <div>
            <p className="label !text-[9px] text-mute">{price === 0 ? "Entry" : "From"}</p>
            <p className="readout text-[1.35rem] text-ivory">{inr(price)}</p>
          </div>
          {cap.limited ? (
            <div className="text-right">
              <p className="label !text-[9px] text-mute">Remaining</p>
              <p className="readout text-[1.35rem] text-ivory">
                {left} <span className="label">spots</span>
              </p>
            </div>
          ) : (
            <div className="text-right">
              <p className="label !text-[9px] text-mute">Capacity</p>
              <p className="readout text-[1.1rem] text-ivory">Open entry</p>
            </div>
          )}
        </div>
        {cap.limited ? (
          <div className="mt-3 h-[3px] w-full bg-line" aria-label={`${cap.soldPct}% sold`}>
            <div className={`h-full ${fillingFast ? "bg-ember" : "bg-ivory"}`} style={{ width: `${cap.soldPct}%` }} />
          </div>
        ) : (
          <p className="label mt-3 !text-[9px] text-mute">{e.participants > 0 ? `${e.participants} registered · no slot limit` : "No slot limit"}</p>
        )}
        <span className="label mt-4 flex items-center gap-2 text-ivory">
          View event <Icon name="arrow" size={13} className="transition group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}
