import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { OwnerCard } from "@/components/cards/OwnerCard";
import { ExploreTiles } from "@/components/home/ExploreTiles";
import { PartnerMarquee } from "@/components/home/Partners";
import { Icon } from "@/components/ui/Icon";
import { PageIntro } from "@/components/ui/PageIntro";
import { Rail } from "@/components/ui/Rail";
import { SectionHead } from "@/components/ui/SectionHead";
import { brands, businesses, cities, clubs, events, getState, isOwnerProfile, owners, upcomingEvents, vehicles } from "@/lib/data";
import { SearchLauncher } from "./SearchLauncher";

export const metadata: Metadata = { title: "Explore", description: "Explore India's automotive community — by category, city, owner and club." };

export default function ExplorePage() {
  // Small counts on the Explore tiles — only when there is something to count.
  const plural = (n: number, one: string, many: string) => (n > 0 ? `${n} ${n === 1 ? one : many}` : undefined);
  const tileCounts = {
    "/cars": plural(vehicles.filter((v) => v.kind === "car").length, "car", "cars"),
    "/bikes": plural(vehicles.filter((v) => v.kind === "bike").length, "bike", "bikes"),
    "/clubs": plural(clubs.length, "club", "clubs"),
    "/events": plural(upcomingEvents().length, "upcoming", "upcoming"),
  };
  // "Meet the owners": people with at least one publicly visible vehicle shown under
  // their name — enthusiasts without a vehicle (or owners who hide their identity) aren't listed.
  const publicOwners = owners.filter((o) => o.privacy !== "private" && isOwnerProfile(o) && vehicles.some((v) => v.owner === o.handle && !v.ownerHidden));
  const cityCounts = cities
    .map((c) => ({ c, n: vehicles.filter((v) => v.city === c.slug).length + clubs.filter((k) => k.city === c.slug).length * 3 + events.filter((e) => e.city === c.slug).length * 2 }))
    .filter((x) => x.n > 0)
    .sort((a, b) => b.n - a.n);

  return (
    <>
      <PageIntro eyebrow="Explore" title={["Enter the", "culture"]} blurb="Search anything — or wander by category, city and the people behind the machines.">
        <SearchLauncher />
      </PageIntro>

      <section className="container-x">
        <ExploreTiles counts={tileCounts} />
      </section>

      <section className="container-x mt-28">
        <SectionHead index="01" eyebrow="By city" title={["Where it's", "happening"]} />
        <div className="grid grid-cols-2 gap-px bg-line hairline md:grid-cols-3 xl:grid-cols-4">
          {cityCounts.map(({ c, n }, i) => (
            <Link key={c.slug} href={`/search?q=${encodeURIComponent(c.name)}`} className="group relative flex items-end justify-between bg-ink p-5 transition hover:bg-graphite md:p-6">
              <div>
                <p className="label !text-[9px] text-mute">
                  {String(i + 1).padStart(2, "0")} · {getState(c.state)?.name}
                </p>
                <p className="display mt-2 text-2xl md:text-3xl">{c.name}</p>
              </div>
              <span className="rounded-[2px] bg-ivory px-1.5 py-[3px] font-mono text-[9.5px] font-semibold text-ink">{c.rto}</span>
              <span className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-ember transition duration-500 group-hover:scale-x-100" style={{ width: `${Math.min(100, n * 8)}%` }} />
            </Link>
          ))}
        </div>
      </section>

      {publicOwners.length > 0 && (
      <section className="container-x mt-28">
        <SectionHead index="02" eyebrow="Owners" title={["Meet the", "owners"]} />
        <Rail label="Owners" itemClass="w-[var(--card-w)]">
          {publicOwners.map((o, i) => (
            <OwnerCard key={i} o={o} />
          ))}
        </Rail>
      </section>
      )}

      {businesses.length > 0 && (
      <section className="container-x mt-28">
        <SectionHead index="03" eyebrow="Services" title={["Look after", "the machine"]} href="/businesses" cta="Directory" />
        <div className="flex flex-wrap gap-2">
          {[...new Set(businesses.flatMap((b) => b.categories))].map((c) => (
            <Link key={c} href={`/businesses?category=${encodeURIComponent(c)}`} className="chip">
              {c} <Icon name="arrowUpRight" size={11} />
            </Link>
          ))}
        </div>
        <div className="mt-8 grid gap-3 md:grid-cols-3">
          {businesses.slice(0, 3).map((b) => (
            <Link key={b.slug} href={`/businesses/${b.slug}`} className="group relative aspect-video overflow-hidden hairline" style={{ borderRadius: 3 }}>
              <Image src={b.cover} alt={b.name} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover opacity-70 transition duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink to-transparent" />
              <div className="absolute bottom-0 p-5">
                <p className="label">{b.categories[0]}</p>
                <p className="display mt-1 text-xl">{b.name}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
      )}

      <section id="partners" className="mt-28">
        <div className="container-x">
          <SectionHead index="04" eyebrow="Advertise" title={["Partner", "with us"]} />
          <p className="-mt-4 mb-10 max-w-xl text-silver">
            Homepage hero, city, category, club and event sponsorships — placements designed to read like editorial, never banners. Sponsored showcases feature real owners&apos; vehicles.
          </p>
        </div>
        {brands.length > 0 && <PartnerMarquee brands={brands} />}
      </section>
    </>
  );
}
