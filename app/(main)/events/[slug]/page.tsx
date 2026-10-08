import { OwnerEdit } from "@/components/admin/OwnerEdit";
import { MobileActionBar } from "@/components/nav/MobileActionBar";
import type { Metadata } from "next";
import { AdminEdit } from "@/components/admin/AdminEdit";
import Link from "next/link";
import { notFound } from "next/navigation";
import { VehicleCard } from "@/components/cards/VehicleCard";
import { BrandMark } from "@/components/home/Partners";
import { RouteMap } from "@/components/route/RouteMap";
import { FollowButton, SaveButton, ShareButton } from "@/components/ui/Actions";
import { getViewer } from "@/lib/auth";
import { canManageEvent, canSeeEvent } from "@/lib/permissions";
import { readDb } from "@/lib/store";
import { Icon } from "@/components/ui/Icon";
import { JsonLd } from "@/components/ui/JsonLd";
import { LikeButton } from "@/components/ui/Like";
import { ClubEmblem } from "@/components/ui/Monogram";
import { LineReveal } from "@/components/ui/Reveal";
import { SectionHead } from "@/components/ui/SectionHead";
import { attendeesOf, capacity, cardProps, cityLine, eventHost, fromPrice, getAnyEvent, getBrand, getRoute, getVehicle, ticketLeft } from "@/lib/data";
import { duration } from "@/lib/format";
import { STOP_ICON, STOP_LABEL } from "@/lib/stops";
import type { StopKind } from "@/lib/types";
import { inr, longDate, time } from "@/lib/format";
import { SITE } from "@/lib/site";
import { CoverHero } from "@/components/ui/CoverHero";


export async function generateMetadata({ params }: PageProps<"/events/[slug]">): Promise<Metadata> {
  const e = getAnyEvent((await params).slug);
  if (!e) return {};
  return { title: e.title, description: e.summary, openGraph: { images: [e.cover] } };
}

export default async function EventPage({ params }: PageProps<"/events/[slug]">) {
  const e = getAnyEvent((await params).slug);
  const viewer = await getViewer();
  if (!e || !canSeeEvent(readDb(), e, viewer)) notFound();
  const host = eventHost(e);
  const club = host.club;
  const manage = canManageEvent(readDb(), e, viewer);
  const route = e.route ? getRoute(e.route) : undefined;
  const cap = capacity(e);
  const left = cap.left;
  const price = fromPrice(e);
  const sponsors = e.sponsors.map(getBrand).filter((b) => !!b);
  const vehicles = e.attendingVehicles.map(getVehicle).filter((v) => !!v);
  const attendees = attendeesOf(e.slug);
  const soldOutAll = e.tickets.every((t) => ticketLeft(t) <= 0);

  return (
    <>
      <AdminEdit tab="event" id={e.slug} />
      <OwnerEdit href={`/events/${e.slug}/manage`} label="Manage event" show={!viewer?.admin && manage} />
      {(e.status ?? "published") === "draft" && (
        <div className="fixed inset-x-0 top-14 z-40 bg-ember px-4 py-2 text-center text-sm text-ink lg:top-[84px]">Draft — only you (the organiser) can see this event. Publish it from Manage event.</div>
      )}
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Event",
          name: e.title,
          startDate: e.timeTbc ? e.date.slice(0, 10) : e.date,
          eventStatus: "https://schema.org/EventScheduled",
          eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
          location: { "@type": "Place", name: e.venue, address: cityLine(e.city) },
          image: [e.cover],
          description: e.summary,
          organizer: club ? { "@type": "Organization", name: club.name } : { "@type": "Person", name: host.personName ?? "KARVAAN member" },
          offers: e.tickets.map((t) => ({ "@type": "Offer", name: t.name, price: t.price, priceCurrency: "INR", availability: ticketLeft(t) > 0 ? "https://schema.org/InStock" : "https://schema.org/SoldOut", url: `${SITE.url}/events/${e.slug}` })),
        }}
      />
      {/* Hero */}
      <CoverHero src={e.cover} alt={e.title} overlay={
          <>
        {sponsors[0] && (
          <div className="absolute right-4 top-4 flex items-center gap-3 md:right-6">
            <span className="label !text-[9px] text-mute">Presented by</span>
            <BrandMark b={sponsors[0]} className="text-[13px]" />
          </div>
        )}
          </>
        }>
        <div className="flex flex-wrap gap-2">
          <span className="label rounded-full bg-ink/70 px-3 py-1.5 text-ivory backdrop-blur">{e.category}</span>
          <span className="label rounded-full bg-ink/70 px-3 py-1.5 text-ivory backdrop-blur">{e.kind === "mixed" ? "Cars & bikes" : e.kind === "car" ? "Cars" : "Bikes"}</span>
        </div>
        <h1 className="display mt-[clamp(0.6rem,2.5svh,1.5rem)] text-[clamp(2rem,min(5.5vw,8svh),5.5rem)]">
          <LineReveal lines={e.title.split(" ").length > 2 ? [e.title.split(" ").slice(0, 2).join(" "), e.title.split(" ").slice(2).join(" ")] : [e.title]} />
        </h1>
        {route && (
          <p className="display-light mt-5 flex items-center gap-3 text-[clamp(1.2rem,min(2.4vw,3.1svh),2rem)]">
            {route.from} <Icon name="arrow" size={26} className="text-ember" /> {route.to}
          </p>
        )}
        <div className="mt-[clamp(1rem,3.5svh,2rem)] grid gap-6 border-t border-line pt-6 sm:grid-cols-3">
          <div>
            <p className="label">When</p>
            <p className="mt-1.5">{longDate(e.date)}</p>
            <p className="readout text-sm text-silver">
              {e.timeTbc ? "Time TBA" : `${time(e.date)}${e.endTime ? ` – ${e.endTime}` : ""} IST`}
            </p>
          </div>
          <div>
            <p className="label">Where</p>
            <p className="mt-1.5">{e.venue}</p>
            <p className="text-sm text-silver">{cityLine(e.city)}</p>
          </div>
          <div className="flex items-center gap-3">
            {club && <ClubEmblem club={club} size={48} />}
            <span className="min-w-0">
              <span className="label block">Organiser</span>
              {host.person ? (
                <Link href={`/owners/${host.person.handle}`} className="mt-1 block hover:underline">
                  {host.person.name}
                </Link>
              ) : (
                club && !host.personName ? (
                  <Link href={`/clubs/${club.slug}`} className="mt-1 block hover:underline">
                    {club.name}
                  </Link>
                ) : (
                  <span className="mt-1 block">{host.personName ?? "KARVAAN"}</span>
                )
              )}
              {/* "Hosted by" only when a person organised it for the club (else the club IS the organiser line). */}
              {club && host.personName && (
                <Link href={`/clubs/${club.slug}`} className="label mt-1 block !text-[9.5px] hover:text-ivory">
                  Hosted by {club.name}
                </Link>
              )}
            </span>
          </div>
        </div>
      </CoverHero>

      <div className="container-x mt-16 grid gap-16 lg:grid-cols-[1fr_380px]">
        <div className="min-w-0 space-y-24">
          {/* About */}
          <section>
            <p className="label mb-5 flex items-center gap-3">
              <span className="text-ember">01</span> <span className="h-px w-8 bg-line-strong" /> The plan
            </p>
            <p className="text-[clamp(1.2rem,min(2vw,2.6svh),1.6rem)] leading-snug text-ivory">{e.summary}</p>
            {/* Who's coming — enthusiasts who registered (first name + initial only). */}
            <div className="mt-10 bg-graphite p-5 hairline sm:p-6" style={{ borderRadius: 3 }}>
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <p className="label">Who&apos;s coming</p>
                {cap.limited && <p className="label text-ember">{left > 0 ? `${left} spots left` : "Sold out"}</p>}
              </div>
              {attendees.length ? (
                <>
                  <p className="readout mt-3 text-[clamp(1.6rem,6vw,2.4rem)] leading-none">
                    {e.participants} <span className="label">registered</span>
                  </p>
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {attendees.map((a) => (
                      <li key={a.key} className="chip normal-case !tracking-normal">
                        {a.name}
                        {a.qty > 1 && <span className="readout opacity-60">+{a.qty - 1}</span>}
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="mt-3 text-silver">No one has registered yet — be the first.</p>
              )}
            </div>
          </section>

          {/* Route */}
          {route && (
            <section>
              <SectionHead index="02" eyebrow="Route" title={["The", "road"]} />
              <p className="-mt-4 mb-8 max-w-2xl leading-relaxed text-silver">{route.summary}</p>
              {(route.distanceKm || route.durationMin || route.difficulty || route.bestTime) && (
              <dl className="mb-6 grid grid-cols-2 gap-px bg-line hairline md:grid-cols-4">
                {(
                  [
                    ["Distance", route.distanceKm ? `${route.distanceKm} km` : undefined],
                    ["Drive time", route.durationMin ? duration(route.durationMin) : undefined],
                    ["Difficulty", route.difficulty],
                    ["Best time", route.bestTime],
                  ].filter(([, v]) => v) as [string, string][]
                ).map(([k, val]) => (
                  <div key={k} className="bg-ink p-4">
                    <dt className="label !text-[9.5px]">{k}</dt>
                    <dd className="mt-1.5 text-[15px]">{val}</dd>
                  </div>
                ))}
              </dl>
              )}
              <RouteMap route={route} compact />
              {route.stops.some((s) => !["start", "end"].includes(s.kind)) && (
              <div className="mt-6 grid grid-cols-2 gap-px bg-line hairline md:grid-cols-4">
                {(["fuel", "food", "scenic", "photo"] as StopKind[]).map((k) => (
                  <div key={k} className="flex items-center gap-3 bg-ink p-4">
                    <Icon name={STOP_ICON[k]} size={16} className="text-silver" />
                    <span className="readout text-lg">{route.stops.filter((s) => s.kind === k).length}</span>
                    <span className="label !text-[9.5px]">{STOP_LABEL[k]}</span>
                  </div>
                ))}
              </div>
              )}
              {route.surface && <p className="label mt-4 !text-[9.5px] text-mute">Surface · {route.surface}</p>}
            </section>
          )}

          {/* Vehicles */}
          {vehicles.length > 0 && (
            <section>
              <SectionHead index="03" eyebrow="On the grid" title={["Who's", "coming"]} />
              <div className="card-grid">
                {vehicles.map((v) => (
                  <VehicleCard key={v.slug} {...cardProps(v)} />
                ))}
              </div>
            </section>
          )}

          {/* Rules */}
          {e.rules.length > 0 && (
          <section>
            <SectionHead index="04" eyebrow="Rules" title={["Before you", "roll"]} />
            <ol className="divide-y divide-line border-y border-line">
              {e.rules.map((r, i) => (
                <li key={r} className="flex gap-5 py-4">
                  <span className="readout text-sm text-ember">{String(i + 1).padStart(2, "0")}</span>
                  <span className="text-silver">{r}</span>
                </li>
              ))}
            </ol>
          </section>
          )}

          {/* Sponsors */}
          {sponsors.length > 0 && (
            <section>
              <p className="label mb-6">Event partners</p>
              <div className="grid grid-cols-2 gap-px bg-line hairline md:grid-cols-3">
                {sponsors.map((b) => (
                  <div key={b.slug} className="flex flex-col gap-2 bg-ink p-6">
                    <BrandMark b={b} />
                    <span className="text-xs text-mute">{b.line}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Booking panel */}
        <aside id="tickets" className="lg:sticky lg:top-24 lg:self-start">
          <div className="chamfer bg-graphite p-6" style={{ ["--cut" as string]: "18px" }}>
            <p className="label flex items-center justify-between">
              Tickets
              {cap.limited ? (
                <span className={`flex items-center gap-1.5 ${left < 25 ? "text-ember" : ""}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${left < 25 ? "animate-pulse-dot bg-ember" : "bg-silver"}`} /> {left} left
                </span>
              ) : (
                <span>Open entry</span>
              )}
            </p>
            <ul className="mt-5 space-y-3">
              {e.tickets.map((t) => {
                const rem = ticketLeft(t);
                return (
                  <li key={t.id} className="p-4 hairline" style={{ borderRadius: 2 }}>
                    <div className="flex items-baseline justify-between">
                      <span className="display text-lg">{t.name}</span>
                      <span className="readout text-lg">{inr(t.price)}</span>
                    </div>
                    <ul className="mt-2 space-y-1">
                      {t.perks.map((p) => (
                        <li key={p} className="flex items-center gap-2 text-[13px] text-silver">
                          <Icon name="check" size={12} className="text-ember" /> {p}
                        </li>
                      ))}
                    </ul>
                    {t.total !== undefined ? (
                      <>
                        <div className="mt-3 h-[2px] bg-line">
                          <div className="h-full bg-ivory" style={{ width: `${(t.sold / t.total) * 100}%` }} />
                        </div>
                        <p className="label mt-2 !text-[9px] text-mute">{rem > 0 ? `${rem} of ${t.total} remaining` : "Sold out"}</p>
                      </>
                    ) : (
                      <p className="label mt-3 !text-[9px] text-mute">No slot limit{t.sold > 0 ? ` · ${t.sold} registered` : ""}</p>
                    )}
                  </li>
                );
              })}
            </ul>
            {soldOutAll ? (
              <button disabled className="btn btn-ghost chamfer mt-6 w-full">
                Sold out
              </button>
            ) : (
              <Link href={`/events/${e.slug}/register`} className="btn btn-primary chamfer mt-6 w-full">
                {price === 0 ? "Reserve free spot" : "Get tickets"} <Icon name="arrow" size={15} />
              </Link>
            )}
            <p className="label mt-4 text-center !text-[9px] text-mute">Digital QR ticket · Instant confirmation</p>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <SaveButton kind="event" id={e.slug} />
            <FollowButton kind="event" id={e.slug} />
            <LikeButton kind="event" id={e.slug} className="btn btn-ghost chamfer" />
            <ShareButton title={e.title} className="flex-1" />
          </div>
          {manage && (
            <Link href={`/events/${e.slug}/manage`} className="btn btn-primary chamfer mt-3 w-full">
              <Icon name="wrench" size={14} /> Manage event
            </Link>
          )}
        </aside>
      </div>

      {/* Mobile sticky booking bar */}
      {!soldOutAll && (
        <MobileActionBar>
          <div className="flex-1 pl-1">
            <p className="label !text-[9px] text-mute">{price === 0 ? "Entry" : "From"}</p>
            <p className="readout text-lg leading-tight">{inr(price)}</p>
          </div>
          <Link href={`/events/${e.slug}/register`} className="btn btn-primary chamfer !h-11">
            {price === 0 ? "Reserve" : "Get tickets"}
          </Link>
        </MobileActionBar>
      )}
    </>
  );
}
