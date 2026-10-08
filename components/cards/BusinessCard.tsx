import Link from "next/link";
import { cityName } from "@/lib/data";
import type { Business } from "@/lib/types";
import { Icon } from "../ui/Icon";
import { FittedImage } from "../ui/FittedImage";
import { CardArt, CardChip, CardFooter, CardStats, GameCard } from "./GameCard";

/** Automotive business as a game card: cover, name, rating and reviews. */
export function BusinessCard({ b }: { b: Business }) {
  const where = b.area === cityName(b.city) ? b.area : `${b.area}, ${cityName(b.city)}`;
  return (
    <GameCard>
      <Link href={`/businesses/${b.slug}`} className="absolute inset-0 z-[5]" aria-label={b.name} />
      <CardArt ratio="4 / 3">
        <FittedImage src={b.cover} alt={b.name} sizes="(max-width: 640px) 50vw, 240px" />
      </CardArt>
      <CardChip>{b.categories[0] ?? "Business"}</CardChip>
      {b.verified && (
        <span className="pointer-events-none absolute left-[5cqi] top-[5cqi] z-10 grid h-[8cqi] w-[8cqi] place-items-center rounded-full bg-ivory text-ink" title="Verified business">
          <Icon name="check" size={12} />
        </span>
      )}

      <div className="game-card-body">
        <h3 className="game-display line-clamp-2 h-[1.95em] text-[7cqi] text-ivory" title={b.name}>
          {b.name}
        </h3>
        <p className="game-mono mt-[1.6cqi] flex items-center gap-[1.4cqi] truncate text-[length:max(9px,3.2cqi)] tracking-[0.12em] text-silver">
          <Icon name="pin" size={10} /> {where}
        </p>
        <div className="mt-[3.4cqi]">
          <CardStats
            stats={[
              { k: "RATING", val: b.reviewCount > 0 ? `${b.rating.toFixed(1)}★` : "New", f: b.reviewCount > 0 ? b.rating / 5 : undefined },
              { k: "REVIEWS", val: String(b.reviewCount) },
            ]}
          />
        </div>
        <CardFooter left={<span className="game-mono truncate text-[length:max(9px,3.2cqi)] tracking-[0.14em] text-ember">{b.services.length > 0 ? `${b.services.length} services` : "View business →"}</span>} />
      </div>
    </GameCard>
  );
}
