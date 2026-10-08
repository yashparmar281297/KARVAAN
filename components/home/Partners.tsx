import Link from "next/link";
import type { Brand, Vehicle } from "@/lib/types";
import { Icon } from "../ui/Icon";
import { FittedImage } from "../ui/FittedImage";


export function BrandMark({ b, className = "" }: { b: Brand; className?: string }) {
  return <span className={`display tracking-[0.2em] uppercase text-ivory ${className}`}>{b.name}</span>;
}

export function PartnerMarquee({ brands }: { brands: Brand[] }) {
  const row = [...brands, ...brands];
  return (
    <div className="relative overflow-hidden border-y border-line py-8 [mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)]">
      <div className="flex w-max animate-marquee items-center gap-16 hover:[animation-play-state:paused]">
        {row.map((b, i) => (
          <span key={i} className="flex items-center gap-16 opacity-60 transition hover:opacity-100">
            <BrandMark b={b} />
            <span className="h-1 w-1 rotate-45 bg-mute" />
          </span>
        ))}
      </div>
    </div>
  );
}

/** Sponsored vehicle showcase — ad placement that looks like editorial. */
export function SponsoredShowcase({ brand, vehicle, owner }: { brand: Brand; vehicle: Vehicle; owner: string }) {
  return (
    <Link href={`/vehicles/${vehicle.slug}`} className="group relative mt-10 grid overflow-hidden bg-graphite hairline md:grid-cols-[1.3fr_1fr]" style={{ borderRadius: 3 }}>
      <div className="relative aspect-[16/10] overflow-hidden md:aspect-auto md:min-h-[420px]">
        <FittedImage src={vehicle.image} alt={`${vehicle.make} ${vehicle.model}`} sizes="(max-width: 768px) 100vw, 60vw" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-graphite/90 max-md:bg-gradient-to-t" />
      </div>
      <div className="relative flex flex-col justify-center p-6 md:p-12">
        <div className="flex items-center gap-3">
          <span className="label !text-[9px] text-mute">Sponsored showcase</span>
          <span className="h-px flex-1 bg-line" />
        </div>
        <BrandMark b={brand} className="mt-6 block" />
        <p className="mt-2 text-sm text-silver">{brand.line}</p>
        <h3 className="display mt-8 text-[clamp(1.8rem,min(3vw,3.9svh),2.8rem)]">
          {vehicle.make}
          <br />
          <span className="display-light">{vehicle.model}</span>
        </h3>
        <p className="mt-4 max-w-sm text-sm leading-relaxed text-silver">
          {owner}&apos;s {vehicle.model}, protected with {brand.name} since delivery. {vehicle.history.length} logged milestones in its history.
        </p>
        <span className="label mt-8 flex items-center gap-2 text-ivory">
          See the vehicle <Icon name="arrow" size={14} className="transition group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}
