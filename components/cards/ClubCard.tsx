import Link from "next/link";
import { cityName, clubStats } from "@/lib/data";
import type { Club } from "@/lib/types";
import { Icon } from "../ui/Icon";
import { FollowerCount } from "../ui/Actions";
import { LikeButton } from "../ui/Like";
import { ClubEmblem } from "../ui/Monogram";
import { FittedImage } from "../ui/FittedImage";
import { CardArt, CardChip, CardFooter, CardStats, GameCard } from "./GameCard";

/** Club as a game card: cover photo, crest, name and its numbers. */
export function ClubCard({ c, priority }: { c: Club; priority?: boolean }) {
  return (
    <GameCard>
      <Link href={`/clubs/${c.slug}`} className="absolute inset-0 z-[5]" aria-label={c.name} />
      <CardArt ratio="4 / 3">
        <FittedImage src={c.hero} alt={c.name} sizes="(max-width: 640px) 50vw, 240px" preload={priority} />
      </CardArt>
      <CardChip>{c.category}</CardChip>
      {c.verified && (
        <span className="pointer-events-none absolute left-[5cqi] top-[5cqi] z-10 grid h-[8cqi] w-[8cqi] place-items-center rounded-full bg-ivory text-ink" title="Verified club">
          <Icon name="check" size={12} />
        </span>
      )}

      <div className="game-card-body">
        <div className="w-fit rounded-full ring-[1.2cqi] ring-graphite">
          <ClubEmblem club={c} size={44} />
        </div>
        <h3 className="game-display mt-[2.4cqi] line-clamp-2 h-[1.95em] text-[7cqi] text-ivory" title={c.name}>
          {c.name}
        </h3>
        <p className="game-mono mt-[1.6cqi] flex items-center gap-[1.4cqi] truncate text-[length:max(9px,3.2cqi)] tracking-[0.14em] text-silver">
          <Icon name="pin" size={10} /> {cityName(c.city)}
        </p>
        <div className="mt-[3.4cqi]">
          <CardStats stats={clubStats(c).slice(0, 2).map(([k, val]) => ({ k: k.toUpperCase(), val }))} />
        </div>
        <CardFooter
          left={
            <span className="game-mono truncate text-[length:max(9px,3.2cqi)] tracking-[0.12em] text-silver">
              <FollowerCount kind="club" id={c.slug} base={c.followers} className="font-semibold text-ivory" /> followers
            </span>
          }
          right={<LikeButton kind="club" id={c.slug} className="text-ivory [&_.readout]:text-[length:max(12px,4cqi)]" />}
        />
      </div>
    </GameCard>
  );
}
