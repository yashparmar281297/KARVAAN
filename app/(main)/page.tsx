import { FittedImage } from "@/components/ui/FittedImage";
import Image from "next/image";
import Link from "next/link";
import { BusinessCard } from "@/components/cards/BusinessCard";
import { ClubCard } from "@/components/cards/ClubCard";
import { EventCard } from "@/components/cards/EventCard";
import { CollectionRail } from "@/components/home/CollectionRail";
import { ExploreTiles } from "@/components/home/ExploreTiles";
import { FinalCTA } from "@/components/home/FinalCTA";
import { Hero } from "@/components/home/Hero";
import { PartnerMarquee, SponsoredShowcase } from "@/components/home/Partners";
import { Icon } from "@/components/ui/Icon";
import { LikeButton } from "@/components/ui/Like";
import { ClubEmblem, VerifiedMark } from "@/components/ui/Monogram";
import { Rail } from "@/components/ui/Rail";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHead } from "@/components/ui/SectionHead";
import { clubMemberProfiles } from "@/lib/permissions";
import { readDb } from "@/lib/store";
import {
  brands,
  businesses,
  cardProps,
  clubStats,
  clubs,
  featuredVehicles,
  getCity,
  getOwner,
  getState,
  owners,
  upcomingEvents,
  vehicles,
} from "@/lib/data";

export default function Home() {
  const featured = featuredVehicles();
  // Hero stats: real sign-ups on KARVAAN — people who joined (profiles), vehicle
  // cards created (cars + bikes together) and clubs registered. Zeros are left out.
  const stats = [
    { k: owners.length === 1 ? "Member" : "Members", n: owners.length },
    { k: vehicles.length === 1 ? "Vehicle" : "Vehicles", n: vehicles.length },
    { k: clubs.length === 1 ? "Club" : "Clubs", n: clubs.length },
  ]
    .filter((x) => x.n > 0)
    .map((x) => ({ k: x.k, v: String(x.n) }));

  const events = upcomingEvents();

  // Small counts on the Explore tiles — only when there is something to count.
  const plural = (n: number, one: string, many: string) => (n > 0 ? `${n} ${n === 1 ? one : many}` : undefined);
  const tileCounts = {
    "/cars": plural(vehicles.filter((v) => v.kind === "car").length, "car", "cars"),
    "/bikes": plural(vehicles.filter((v) => v.kind === "bike").length, "bike", "bikes"),
    "/clubs": plural(clubs.length, "club", "clubs"),
    "/events": plural(upcomingEvents().length, "upcoming", "upcoming"),
  };

  const spotlight = clubs[0];
  const spotlightCity = spotlight ? getCity(spotlight.city) : undefined;
  const spotlightMembers = spotlight ? clubMemberProfiles(readDb(), spotlight.slug).filter((o) => o.privacy === "public") : [];
  const showcaseBrand = brands[0];
  const showcase = featured[0];

  let n = 0;
  const idx = () => String(++n).padStart(2, "0");

  return (
    <>
      <Hero stats={stats} />

      <section className="container-x mt-24 md:mt-32">
        <SectionHead index={idx()} eyebrow="Explore" title={["Choose your", "corner of the culture"]} />
        <ExploreTiles counts={tileCounts} />
      </section>

      {featured.length > 0 && (
        <section className="container-x mt-28 md:mt-40">
          <CollectionRail index={idx()} cards={featured.map((v) => cardProps(v))} />
        </section>
      )}

      {spotlight && (
        <section className="container-x mt-28 md:mt-40">
          <SectionHead index={idx()} eyebrow="Clubs" title={["Clubs that", "own the road"]} href="/clubs" cta="Club directory" />
          <Reveal>
            <Link href={`/clubs/${spotlight.slug}`} className="group relative mb-6 grid overflow-hidden bg-graphite hairline lg:grid-cols-[1.4fr_1fr]" style={{ borderRadius: 3 }}>
              <div className="relative aspect-video overflow-hidden lg:self-center">
                <FittedImage src={spotlight.hero} alt={spotlight.name} sizes="(max-width: 1024px) 100vw, 60vw" />
                <div className="absolute inset-0 bg-gradient-to-t from-graphite via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:via-transparent lg:to-graphite" />
                <span className="label absolute left-5 top-5 rounded-full bg-ink/70 px-3 py-1.5 text-ivory backdrop-blur">{spotlight.category} club</span>
              </div>
              <div className="relative flex flex-col p-5 md:p-10">
                <div className="flex items-center gap-4">
                  <ClubEmblem club={spotlight} size={72} />
                  <div>
                    {spotlight.verified && <VerifiedMark />}
                    <p className="label mt-2">
                      India → {spotlightCity ? `${getState(spotlightCity.state)?.name} → ${spotlightCity.name}` : "—"}
                    </p>
                  </div>
                </div>
                <h3 className="display mt-[clamp(1rem,3svh,2rem)] text-[clamp(2rem,min(3.4vw,4.4svh),3.2rem)]">{spotlight.name}</h3>
                {spotlight.tagline && <p className="display-light mt-2 text-lg text-ivory/85">{spotlight.tagline}</p>}
                <p className="mt-4 line-clamp-2 max-w-md text-sm leading-relaxed text-silver md:line-clamp-none">{spotlight.about}</p>
                {(() => {
                  const figures = [...clubStats(spotlight), ...(spotlight.founded ? [["Founded", String(spotlight.founded)] as [string, string]] : [])].slice(0, 3);
                  return (
                <dl className="mt-[clamp(1rem,3svh,2rem)] grid gap-px bg-line" style={{ gridTemplateColumns: `repeat(${figures.length}, minmax(0, 1fr))` }}>
                  {figures.map(([k, v]) => (
                    <div key={k} className="bg-graphite px-4 py-3 first:pl-0">
                      <dd className="readout text-2xl md:text-3xl">{v}</dd>
                      <dt className="label mt-1 !text-[9.5px]">{k}</dt>
                    </div>
                  ))}
                </dl>
                  );
                })()}
                <div className="mt-auto flex items-center justify-between pt-[clamp(1rem,3svh,2rem)]">
                  <div className="flex -space-x-3">
                    {spotlightMembers.map((o) => (
                      <span key={o.handle} className="relative h-10 w-10 overflow-hidden rounded-full ring-2 ring-graphite">
                        <Image src={o.portrait} alt={o.name} fill sizes="40px" className="object-cover" />
                      </span>
                    ))}
                    {spotlight.members > spotlightMembers.length && (
                      <span className="readout grid h-10 w-10 place-items-center rounded-full bg-charcoal text-[11px] ring-2 ring-graphite">+{spotlight.members - spotlightMembers.length}</span>
                    )}
                  </div>
                  <span className="flex items-center gap-5">
                    <LikeButton kind="club" id={spotlight.slug} className="text-ivory" />
                    <span className="label flex items-center gap-2 text-ivory">
                      Visit club <Icon name="arrow" size={14} />
                    </span>
                  </span>
                </div>
              </div>
            </Link>
          </Reveal>

        </section>
      )}

      {clubs.length > 1 && (
        <section className="container-x mt-16 md:mt-24">
          <p className="label mb-6 flex items-center gap-3">
            <span className="h-px w-8 bg-line-strong" /> More clubs
          </p>
          <Rail label="More clubs" itemClass="w-[var(--card-w)]">
            {clubs.slice(1).map((c) => (
              <ClubCard key={c.slug} c={c} />
            ))}
          </Rail>
        </section>
      )}

      <section className="container-x mt-28 md:mt-40">
        <SectionHead index={idx()} eyebrow="Events" title={["Where the", "community meets"]} href={events.length ? "/events" : undefined} cta="All events" />
        {events.length > 0 ? (
          <>
            <Reveal>
              <EventCard e={events[0]} layout="wide" />
            </Reveal>
            {events.length > 1 && (
              <div className="mt-6">
                <Rail label="Upcoming events" itemClass="w-[var(--card-w)]">
                  {events.slice(1).map((e) => (
                    <EventCard key={e.slug} e={e} />
                  ))}
                </Rail>
              </div>
            )}
          </>
        ) : (
          <div className="chamfer flex flex-col gap-6 bg-graphite p-6 md:flex-row md:items-center md:justify-between md:p-10" style={{ ["--cut" as string]: "18px" }}>
            <div>
              <p className="display text-2xl">No events on the calendar yet</p>
              <p className="mt-2 max-w-lg text-sm text-silver">Club admins host drives, rides, meets and track days here — with or without ticket slots. Drives and rides come with their route.</p>
            </div>
            <Link href="/studio?tab=event" className="btn btn-primary chamfer shrink-0">
              <Icon name="plus" size={15} /> Host an event
            </Link>
          </div>
        )}
      </section>

      {businesses.length > 0 && (
        <section className="container-x mt-28 md:mt-40">
          <SectionHead index={idx()} eyebrow="Businesses" title={["Trusted by", "the garage"]} href="/businesses" cta="Directory" />
          <div className="card-grid">
            {businesses.slice(0, 6).map((b) => (
              <BusinessCard key={b.slug} b={b} />
            ))}
          </div>
        </section>
      )}

      {brands.length > 0 && (
        <section id="partners" className="mt-28 md:mt-40">
          <div className="container-x">
            <SectionHead index={idx()} eyebrow="Partners" title={["Brands in", "the paddock"]} />
          </div>
          <PartnerMarquee brands={brands} />
          {showcaseBrand && showcase && (
            <div className="container-x">
              <SponsoredShowcase brand={showcaseBrand} vehicle={showcase} owner={getOwner(showcase.owner)?.name ?? ""} />
            </div>
          )}
        </section>
      )}

      <FinalCTA images={(featured[0]?.gallery ?? []).slice(0, 3)} />
    </>
  );
}
