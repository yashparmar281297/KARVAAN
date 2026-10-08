import type { ReactNode } from "react";

/**
 * The shared trading-card shell every card uses: a small card in the site's
 * own colours (graphite card, hairline border — follows the light/dark theme).
 * Everything inside is sized in `cqi` (a percentage of the card's width), so a
 * card looks identical — just smaller or larger — whether it's 150px wide on a
 * phone or 240px on a desktop.
 *
 * The card is as tall as its content (no empty space). Put the card's main link
 * first as `absolute inset-0 z-[5]`; the body above it lets clicks through
 * except on its buttons.
 */
export function GameCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`@container relative h-full w-full max-w-[300px] ${className}`}>
      <div className="game-card group/card">{children}</div>
    </div>
  );
}

/** Photo at the top of the card (fixed shape), fading into the card body. */
export function CardArt({ children, ratio = "1 / 1" }: { children: ReactNode; ratio?: string }) {
  return (
    <div className="relative w-full shrink-0" style={{ aspectRatio: ratio }}>
      {children}
      <div className="game-art-fade absolute" />
    </div>
  );
}

/** Big number in the top-left corner (rating, date…), with a small caption. */
export function CardBadge({ value, caption, children }: { value: ReactNode; caption: string; children?: ReactNode }) {
  return (
    <div className="pointer-events-none absolute left-[5cqi] top-[4.5cqi] z-10 flex flex-col items-center text-center leading-none">
      <span className="game-display text-[13cqi] text-white drop-shadow-[0_2px_6px_#000]">{value}</span>
      <span className="game-mono mt-[1cqi] text-[length:max(9px,3.2cqi)] tracking-[0.18em] text-white/85 drop-shadow-[0_1px_3px_#000]">{caption}</span>
      {children}
    </div>
  );
}

/** Small chip in the top-right corner (class, category…). */
export function CardChip({ children }: { children: ReactNode }) {
  return (
    <span className="game-mono pointer-events-none absolute right-[4.5cqi] top-[5cqi] z-10 max-w-[55%] truncate rounded-full bg-black/60 px-[2.6cqi] py-[1.2cqi] text-[length:max(9px,3.1cqi)] tracking-[0.14em] text-white backdrop-blur-sm">
      {children}
    </span>
  );
}

/**
 * Stats in boxes: each value sits directly above its own label and the boxes
 * are separated by a line, so a number can never be read as the next one's.
 * Optional fill bar (f = 0–1) under the label.
 */
export function CardStats({ stats }: { stats: { k: string; val: string; unit?: string; f?: number; label?: string }[] }) {
  return (
    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-[2.4cqi] bg-line hairline">
      {stats.map((s) => (
        <div key={s.k} className="flex min-w-0 flex-col-reverse bg-graphite px-[3cqi] py-[2.4cqi]" title={s.label ? `${s.label}: ${s.val} ${s.unit ?? ""}` : undefined}>
          {s.f !== undefined && (
            <div className="order-first mt-[1.6cqi] h-[1cqi] overflow-hidden rounded-full bg-line">
              <div className="h-full rounded-full bg-ivory/80" style={{ width: `${Math.max(4, Math.round(s.f * 100))}%` }} />
            </div>
          )}
          <dt className="game-mono mt-[1.4cqi] truncate text-[length:max(9px,2.9cqi)] tracking-[0.12em] text-mute">{s.k}</dt>
          <dd className="game-mono truncate text-[length:max(12px,5.2cqi)] font-semibold leading-none text-ivory">
            {s.val}
            {s.unit && s.val !== "—" && <span className="ml-[0.8cqi] text-[length:max(9px,3cqi)] font-normal text-mute">{s.unit}</span>}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** Bottom strip: left and right slots, separated from the body by a hairline. */
export function CardFooter({ left, right }: { left: ReactNode; right?: ReactNode }) {
  return (
    <div className="mt-auto flex items-center justify-between gap-[2cqi] border-t border-line pt-[2.6cqi]">
      <div className="flex min-w-0 items-center gap-[2cqi]">{left}</div>
      {right && <div className="pointer-events-auto relative flex shrink-0 items-center gap-[2cqi]">{right}</div>}
    </div>
  );
}
