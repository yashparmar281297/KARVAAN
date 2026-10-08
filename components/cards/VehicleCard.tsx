import Image from "next/image";
import Link from "next/link";
import type { OwnerView } from "@/lib/data";
import { vehicleStats } from "@/lib/cardTier";
import { pad } from "@/lib/format";
import type { Vehicle } from "@/lib/types";
import { Icon } from "../ui/Icon";
import { LikeButton } from "../ui/Like";
import { CardArt, CardBadge, CardChip, CardFooter, CardStats, GameCard } from "./GameCard";

export interface VehicleCardProps {
  v: Vehicle;
  owner: OwnerView | null;
  clubName?: string;
  rto: string;
  garageCount?: number;
  priority?: boolean;
  /** Kept for older callers — game cards don't tilt. */
  tilt?: boolean;
}

/**
 * The vehicle as a game card: rarity frame from its class (Supercar = Legendary,
 * Sleeper = Epic…), overall rating, photo, name, four stat bars and the owner.
 * The whole card opens the vehicle page.
 */
export function VehicleCard({ v, owner, rto, priority }: VehicleCardProps) {
  const { stats, ovr } = vehicleStats(v);
  const name = [v.year, v.make, v.model].filter(Boolean).join(" ");
  return (
    <GameCard>
      <Link href={`/vehicles/${v.slug}`} className="absolute inset-0 z-[5]" aria-label={name} />
      <CardArt>
        <Image src={v.image} alt={name} fill sizes="(max-width: 640px) 50vw, 240px" quality={75} priority={priority} className="object-cover" />
      </CardArt>
      <CardBadge value={ovr} caption="OVR">
        <Icon name={v.kind === "bike" ? "bolt" : "gauge"} size={14} className="mt-[1.6cqi] text-silver" />
      </CardBadge>
      <CardChip>{v.class}</CardChip>

      <div className="game-card-body">
        <p className="game-mono truncate text-[length:max(9px,3.4cqi)] tracking-[0.2em] text-ember" title={v.make}>
          {v.make}
        </p>
        <h3 className="game-display mt-[1cqi] line-clamp-2 h-[1.95em] text-[7.4cqi] text-ivory" title={v.model}>
          {v.model}
        </h3>
        <div className="mt-[3cqi]">
          <CardStats stats={stats} />
        </div>
        <CardFooter
          left={
            <>
              {owner?.portrait ? (
                <span className="relative h-[7cqi] w-[7cqi] shrink-0 overflow-hidden rounded-full ring-1 ring-line-strong">
                  <Image src={owner.portrait} alt="" fill sizes="24px" className="object-cover" />
                </span>
              ) : (
                <span className="game-mono shrink-0 text-[length:max(9px,3cqi)] text-mute">No.{pad(v.serial)}</span>
              )}
              <span className="truncate text-[length:max(9px,3.6cqi)] text-silver" title={owner?.name}>
                {owner?.portrait ? owner.name : rto}
              </span>
            </>
          }
          right={<LikeButton kind="vehicle" id={v.slug} className="text-ivory [&_.readout]:text-[length:max(12px,4cqi)]" />}
        />
      </div>
    </GameCard>
  );
}

/** Stand-in for a hidden portrait: a machined contour field, never a face. */
export function PrivateField() {
  return (
    <div className="absolute inset-0 bg-graphite">
      <svg className="absolute inset-0 h-full w-full opacity-40" preserveAspectRatio="none" viewBox="0 0 100 140" aria-hidden>
        {Array.from({ length: 22 }, (_, i) => (
          <path key={i} d={`M-5 ${10 + i * 6} Q 25 ${4 + i * 6 + (i % 3) * 3} 50 ${10 + i * 6} T 105 ${10 + i * 6}`} fill="none" className="stroke-ivory" strokeWidth=".15" />
        ))}
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="grid h-20 w-20 place-items-center rounded-full bg-ink/70 text-silver hairline-strong">
          <Icon name="lock" size={26} />
        </div>
      </div>
    </div>
  );
}
