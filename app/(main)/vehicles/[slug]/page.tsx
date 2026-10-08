import { OwnerEdit } from "@/components/admin/OwnerEdit";
import { MobileActionBar } from "@/components/nav/MobileActionBar";
import type { Metadata } from "next";
import { AdminEdit } from "@/components/admin/AdminEdit";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EventCard } from "@/components/cards/EventCard";
import { VehicleCard } from "@/components/cards/VehicleCard";
import { FollowButton, FollowerCount, ShareButton } from "@/components/ui/Actions";
import { Gallery } from "@/components/ui/Gallery";
import { Icon } from "@/components/ui/Icon";
import { JsonLd } from "@/components/ui/JsonLd";
import { LikeButton } from "@/components/ui/Like";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHead } from "@/components/ui/SectionHead";
import { OwnerVehicleStage } from "@/components/vehicle/OwnerVehicleStage";
import { cardProps, getAnyVehicle, getClub, getEvent, redactVehicle } from "@/lib/data";
import { getViewer } from "@/lib/auth";
import { canEditVehicle, canSeeVehicle } from "@/lib/permissions";
import { readDb } from "@/lib/store";
import { shortDate } from "@/lib/format";


export async function generateMetadata({ params }: PageProps<"/vehicles/[slug]">): Promise<Metadata> {
  const v = getAnyVehicle((await params).slug);
  if (!v || (v.visibility ?? "public") !== "public") return { robots: { index: false } };
  return {
    title: [v.year, v.make, v.model].filter(Boolean).join(" "),
    description: `${v.make} ${v.model} · ${v.spec.engine} · ${v.spec.power.toLocaleString("en-IN")}${v.spec.powerPlus ? "+" : ""} HP${v.spec.quarterMile ? ` · ${v.spec.quarterMile}s quarter mile` : ""}. On KARVAAN, India's automotive community.`,
    openGraph: { images: [v.image] },
  };
}

export default async function VehiclePage({ params }: PageProps<"/vehicles/[slug]">) {
  const v = getAnyVehicle((await params).slug);
  const viewer = await getViewer();
  if (!v || !canSeeVehicle(readDb(), v, viewer)) notFound();
  const { owner, rto, clubName, garageCount } = cardProps(v);
  const club = v.club ? getClub(v.club) : undefined;
  const attended = v.events.map(getEvent).filter((e) => !!e);
  const siblings = owner?.revealed ? readDb().vehicles.filter((x) => x.owner === v.owner && x.slug !== v.slug && !x.ownerHidden && canSeeVehicle(readDb(), x, viewer)) : [];
  // Private owners: region only. Everyone else: city.
  const location = owner?.privacy === "private" ? owner.location : owner?.location.replace(", India", "") ?? "";

  // Only figures we actually have — no dashes padding the grid.
  const specs = [
    { k: "Power", v: `${v.spec.power.toLocaleString("en-IN")}${v.spec.powerPlus ? "+" : ""}`, u: "HP" },
    { k: "Torque", v: v.spec.torque.toLocaleString("en-IN"), u: "NM" },
    ...(v.spec.quarterMile ? [{ k: "Quarter mile", v: String(v.spec.quarterMile), u: "SEC" }] : []),
    ...(v.spec.zeroToHundred ? [{ k: "0–100", v: String(v.spec.zeroToHundred), u: "SEC" }] : []),
    ...(v.spec.topSpeed ? [{ k: "Top speed", v: String(v.spec.topSpeed), u: "KM/H" }] : []),
  ].slice(0, 4);
  const details: [string, string][] = [
    ["Category", `${v.kind === "bike" ? "Bike" : "Car"} → ${v.class} → ${v.make}`],
    ["Manufacturer", v.make],
    ["Model", `${v.model}${v.variant ? ` (${v.variant})` : ""}`],
    ...(v.year ? ([["Year", String(v.year)]] as [string, string][]) : []),
    ["Engine", v.spec.engine],
    ...(v.spec.transmission ? ([["Transmission", v.spec.transmission]] as [string, string][]) : []),
    [v.kind === "bike" ? "Final drive" : "Drivetrain", v.spec.drivetrain],
    ["Colour", v.colour],
    ["Location", location && location !== "India" ? `${location}, India` : "India"],
    ["Club", club?.name ?? "Independent"],
  ];

  return (
    <>
      <AdminEdit tab="vehicle" id={v.slug} />
      <OwnerEdit href={`/me/vehicles/${v.slug}/edit`} show={!viewer?.admin && canEditVehicle(v, viewer)} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": v.kind === "bike" ? "Motorcycle" : "Car",
          name: [v.year, v.make, v.model].filter(Boolean).join(" "),
          brand: { "@type": "Brand", name: v.make },
          model: v.model,
          vehicleModelDate: v.year ? String(v.year) : undefined,
          color: v.colour,
          vehicleEngine: { "@type": "EngineSpecification", name: v.spec.engine },
          image: v.image,
        }}
      />
      <OwnerVehicleStage v={redactVehicle(v, owner)} owner={owner} rto={rto} clubName={clubName} location={location} garageCount={garageCount} />

      {/* Spec sheet */}
      <div className="container-x mt-20 md:mt-28">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr]">
          <section>
            <p className="label mb-6 flex items-center gap-3">
              <span className="text-ember">01</span> <span className="h-px w-8 bg-line-strong" /> Performance
            </p>
            <div className="grid grid-cols-2 gap-px bg-line hairline">
              {specs.map((s) => (
                <Reveal key={s.k} className="bg-ink p-4 md:p-8">
                  <p className="label">{s.k}</p>
                  <p className="readout mt-3 text-[clamp(2rem,min(6vw,7.8svh),5rem)] leading-none">{s.v}</p>
                  <p className="label mt-2 text-mute">{s.u}</p>
                </Reveal>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <LikeButton kind="vehicle" id={v.slug} className="btn btn-ghost chamfer max-lg:h-10 max-lg:px-3.5" />
              <FollowButton kind="vehicle" id={v.slug} className="max-lg:h-10 max-lg:px-3.5" />
              <span className="label flex items-center gap-1.5 px-2">
                <FollowerCount kind="vehicle" id={v.slug} base={0} className="readout text-base text-ivory" /> followers
              </span>
              <ShareButton title={`${v.make} ${v.model}`} className="max-lg:h-10 max-lg:px-3.5" />
            </div>
          </section>
          <section>
            <p className="label mb-6 flex items-center gap-3">
              <span className="text-ember">02</span> <span className="h-px w-8 bg-line-strong" /> Specification
            </p>
            <dl className="divide-y divide-line border-y border-line">
              {details.map(([k, val]) => (
                <div key={k} className="flex items-baseline justify-between gap-6 py-3.5">
                  <dt className="label">{k}</dt>
                  <dd className="text-right text-[15px] text-ivory">
                    {k === "Club" && club ? (
                      <Link href={`/clubs/${club.slug}`} className="underline decoration-line-strong underline-offset-4 hover:decoration-ivory">
                        {val}
                      </Link>
                    ) : (
                      val
                    )}
                  </dd>
                </div>
              ))}
            </dl>
            {v.sources && <p className="label mt-4 !text-[9.5px] text-mute">Figures: {v.sources.join(", ")}</p>}
          </section>
        </div>
      </div>

      {/* Modifications */}
      {v.mods.length > 0 && (
        <section className="container-x mt-24">
          <SectionHead index="03" eyebrow="Modifications" title={["What's been", "changed"]} />
          <ol className="grid gap-px bg-line hairline sm:grid-cols-2 lg:grid-cols-3">
            {v.mods.map((m, i) => (
              <li key={m} className="flex items-center gap-4 bg-ink p-5">
                <span className="readout text-sm text-ember">{String(i + 1).padStart(2, "0")}</span>
                <span className="text-[15px]">{m}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Gallery */}
      {v.gallery.length > 0 && (
        <section className="container-x mt-24">
          <SectionHead index="04" eyebrow="Gallery" title={["In the", "flesh"]} />
          <Gallery images={v.gallery} alt={`${v.make} ${v.model}`} />
        </section>
      )}

      {/* Videos */}
      {v.videos && v.videos.length > 0 && (
        <section className="container-x mt-24">
          <SectionHead index="05" eyebrow="Videos" title={["Sound", "on"]} />
          <div className="grid gap-4 md:grid-cols-2">
            {v.videos.map((vid) => (
              <div key={vid.title} className="group relative aspect-video overflow-hidden bg-graphite hairline" style={{ borderRadius: 3 }}>
                <Image src={vid.poster} alt="" fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover opacity-70 transition duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-ink to-transparent" />
                <span className="absolute left-1/2 top-1/2 grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-ivory/10 backdrop-blur hairline-strong">
                  <Icon name="play" size={20} className="fill-ivory" />
                </span>
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-5">
                  <p className="display text-lg">{vid.title}</p>
                  <span className="readout text-sm text-silver">{vid.duration}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* History */}
      {v.history.length > 0 && (
        <section className="container-x mt-24">
          <SectionHead index="06" eyebrow="History" title={["The", "logbook"]} />
          <ol className="relative ml-2 border-l border-line-strong">
            {v.history.map((h, i) => (
              <Reveal as="li" key={h.title} delay={i * 0.06} className="relative pb-10 pl-8 last:pb-0">
                <span className={`absolute -left-[5px] top-1.5 h-[9px] w-[9px] rotate-45 ${i === v.history.length - 1 ? "bg-ember" : "bg-ivory"}`} />
                {h.date && <p className="label">{shortDate(h.date)}</p>}
                <h3 className="display mt-2 text-xl">{h.title}</h3>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-silver">{h.detail}</p>
              </Reveal>
            ))}
          </ol>
        </section>
      )}

      {/* Events attended */}
      {attended.length > 0 && (
        <section className="container-x mt-24">
          <SectionHead index="07" eyebrow="Events" title={["Seen", "at"]} />
          <div className="card-grid">
            {attended.map((e) => (
              <EventCard key={e.slug} e={e} />
            ))}
          </div>
        </section>
      )}

      {/* Same garage */}
      {siblings.length > 0 && (
        <section className="container-x mt-24">
          <SectionHead index="08" eyebrow="Same garage" title={["Also parked", `with ${owner?.name.split(" ")[0]}`]} href={owner?.href ?? undefined} cta="Full garage" />
          <div className="card-grid">
            {siblings.map((s) => (
              <VehicleCard key={s.slug} {...cardProps(s)} />
            ))}
          </div>
        </section>
      )}

      {/* Mobile sticky actions */}
      {(owner?.href || club) && (
        <MobileActionBar>
          {owner?.href ? (
            <Link href={owner.href} className="btn btn-primary chamfer !h-11 flex-1">
              <Icon name="garage" size={15} /> Owner&apos;s garage
            </Link>
          ) : club ? (
            <Link href={`/clubs/${club.slug}`} className="btn btn-primary chamfer !h-11 flex-1">
              <Icon name="users" size={15} /> View club
            </Link>
          ) : null}
        </MobileActionBar>
      )}
    </>
  );
}
