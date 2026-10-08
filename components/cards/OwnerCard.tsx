import Image from "next/image";
import Link from "next/link";
import { presentOwner, vehiclesByOwner } from "@/lib/data";
import type { Owner } from "@/lib/types";
import { Icon } from "../ui/Icon";
import { CardArt, CardChip, CardFooter, CardStats, GameCard } from "./GameCard";
import { PrivateField } from "./VehicleCard";

/** Owner (or club member) as a game card: portrait, name, garage count. */
export function OwnerCard({ o, viewerClubs = [] }: { o: Owner; viewerClubs?: string[] }) {
  const view = presentOwner(o, viewerClubs);
  const garage = vehiclesByOwner(o.handle);
  const cars = garage.filter((v) => v.kind === "car").length;
  const bikes = garage.length - cars;
  return (
    <GameCard>
      {view.href && <Link href={view.href} className="absolute inset-0 z-[5]" aria-label={view.name} />}
      <CardArt ratio="1 / 1.05">{view.portrait ? <Image src={view.portrait} alt={view.name} fill sizes="(max-width: 640px) 50vw, 240px" className="object-cover" /> : <PrivateField />}</CardArt>
      <CardChip>{view.revealed ? "Owner" : view.privacy === "private" ? "Private" : "Club only"}</CardChip>

      <div className="game-card-body">
        <h3 className="game-display line-clamp-2 h-[1.95em] text-[7.4cqi] text-ivory" title={view.name}>
          {view.name}
        </h3>
        <p className="game-mono mt-[1.6cqi] flex items-center gap-[1.4cqi] truncate text-[length:max(9px,3.2cqi)] tracking-[0.14em] text-silver">
          <Icon name="pin" size={10} /> {view.location || "India"}
        </p>
        <div className="mt-[3.4cqi]">
          <CardStats
            stats={[
              { k: "CARS", val: String(cars).padStart(2, "0") },
              { k: "BIKES", val: String(bikes).padStart(2, "0") },
            ]}
          />
        </div>
        <CardFooter left={<span className="game-mono text-[length:max(9px,3.2cqi)] tracking-[0.14em] text-ember">{view.href ? "View garage →" : "Hidden profile"}</span>} />
      </div>
    </GameCard>
  );
}
