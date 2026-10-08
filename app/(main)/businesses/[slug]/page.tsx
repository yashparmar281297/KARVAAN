import { OwnerEdit } from "@/components/admin/OwnerEdit";
import { ReviewForm } from "@/components/business/ReviewForm";
import { getViewer } from "@/lib/auth";
import { canManageBusiness } from "@/lib/permissions";
import { MobileActionBar } from "@/components/nav/MobileActionBar";
import type { Metadata } from "next";
import { AdminEdit } from "@/components/admin/AdminEdit";
import Link from "next/link";
import { notFound } from "next/navigation";
import { VehicleCard } from "@/components/cards/VehicleCard";
import { FollowButton, FollowerCount, ShareButton } from "@/components/ui/Actions";
import { Gallery } from "@/components/ui/Gallery";
import { Icon } from "@/components/ui/Icon";
import { JsonLd } from "@/components/ui/JsonLd";
import { LikeButton } from "@/components/ui/Like";
import { VerifiedMark } from "@/components/ui/Monogram";
import { LineReveal } from "@/components/ui/Reveal";
import { SectionHead } from "@/components/ui/SectionHead";
import { cardProps, cityLine, cityName, getBusiness, getVehicle } from "@/lib/data";
import { inr } from "@/lib/format";
import { CoverHero } from "@/components/ui/CoverHero";


export async function generateMetadata({ params }: PageProps<"/businesses/[slug]">): Promise<Metadata> {
  const b = getBusiness((await params).slug);
  if (!b) return {};
  return { title: `${b.name} — ${b.categories[0]} in ${cityName(b.city)}`, description: b.about, openGraph: { images: [b.cover] } };
}

export default async function BusinessPage({ params }: PageProps<"/businesses/[slug]">) {
  const b = getBusiness((await params).slug);
  if (!b) notFound();
  const viewer = await getViewer();
  const worked = b.workedOn.map(getVehicle).filter((v) => !!v);
  const tel = `tel:${b.phone.replace(/\s/g, "")}`;

  // Section numbers count only the sections shown.
  let n = 0;
  const idx = () => String(++n).padStart(2, "0");

  return (
    <>
      <AdminEdit tab="business" id={b.slug} />
      <OwnerEdit href={`/businesses/${b.slug}/edit`} show={!viewer?.admin && canManageBusiness(b, viewer)} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "AutomotiveBusiness",
          name: b.name,
          image: b.cover,
          telephone: b.phone,
          url: b.website,
          address: { "@type": "PostalAddress", addressLocality: cityName(b.city), streetAddress: b.area, addressCountry: "IN" },
          email: b.email,
          aggregateRating: b.reviewCount > 0 ? { "@type": "AggregateRating", ratingValue: b.rating, reviewCount: b.reviewCount } : undefined,
        }}
      />
      <CoverHero src={b.cover} alt={b.name}>
        <div className="flex flex-wrap items-center gap-3">
          {b.categories.map((c) => (
            <span key={c} className="label rounded-full bg-ink/70 px-3 py-1.5 text-ivory backdrop-blur">
              {c}
            </span>
          ))}
          {b.verified && <VerifiedMark />}
        </div>
        <h1 className="display mt-[clamp(0.6rem,2.5svh,1.5rem)] text-[clamp(2rem,min(5.5vw,8svh),5.5rem)]">
          <LineReveal lines={[b.name]} />
        </h1>
        <div className="mt-[clamp(0.6rem,2.5svh,1.5rem)] flex flex-wrap items-center gap-6">
          <p className="label flex items-center gap-1.5 text-ivory">
            <Icon name="pin" size={13} /> {b.area === cityName(b.city) ? cityLine(b.city) : `${b.area} · ${cityLine(b.city)}`}
          </p>
          {b.reviewCount > 0 && (
            <p className="readout flex items-center gap-2 text-lg">
              <Icon name="star" size={16} className="fill-ivory" /> {b.rating.toFixed(1)} <span className="label">{b.reviewCount} {b.reviewCount === 1 ? "review" : "reviews"}</span>
            </p>
          )}
          <p className="readout flex items-center gap-2 text-lg">
            <FollowerCount kind="business" id={b.slug} base={0} /> <span className="label">followers</span>
          </p>
          <FollowButton kind="business" id={b.slug} className="!h-10" />
        </div>
      </CoverHero>

      <div className="container-x mt-16 grid gap-16 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0 space-y-24">
          <section>
            <p className="text-[clamp(1.2rem,min(2vw,2.6svh),1.55rem)] leading-snug">{b.about}</p>
          </section>

          {/* Only businesses that list services get this section (a dealership may list none). */}
          {b.services.length > 0 && (
            <section>
              <SectionHead index={idx()} eyebrow="Services" title={["What they", "do"]} />
              <ul className="divide-y divide-line border-y border-line">
                {b.services.map((s) => (
                  <li key={s.name} className="flex items-baseline justify-between gap-6 py-4">
                    <span className="text-[16px] [overflow-wrap:anywhere]">{s.name}</span>
                    <span className="readout shrink-0 text-silver">{s.from > 0 ? <>from {inr(s.from)}</> : "On request"}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {b.gallery.length > 0 && (
            <section>
              <SectionHead index={idx()} eyebrow="Gallery" title={["The", "studio"]} />
              <Gallery images={b.gallery} alt={b.name} />
            </section>
          )}

          {worked.length > 0 && (
            <section>
              <SectionHead index={idx()} eyebrow="Vehicles worked on" title={["From their", "bays"]} />
              <div className="card-grid">
                {worked.map((v) => (
                  <VehicleCard key={v.slug} {...cardProps(v)} />
                ))}
              </div>
            </section>
          )}

          <section>
            <SectionHead index={idx()} eyebrow="Reviews" title={["Owners", "say"]} />
            {/* Anyone with an account can review — except the business itself. */}
            {!(viewer?.id && b.ownerUserId === viewer.id) && (
              <div className="mb-8">
                <ReviewForm slug={b.slug} existing={b.reviews.find((r) => viewer?.id && r.userId === viewer.id)} />
              </div>
            )}
            {b.reviews.length ? (
              <div className="grid gap-4 md:grid-cols-2">
                {b.reviews.map((r) => {
                  const v = getVehicle(r.vehicle);
                  return (
                    <figure key={r.author} className="bg-graphite p-6 hairline" style={{ borderRadius: 3 }}>
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }, (_, i) => (
                          <Icon key={i} name="star" size={13} className={i < r.rating ? "fill-ivory text-ivory" : "text-mute"} />
                        ))}
                      </div>
                      <blockquote className="mt-4 text-[16px] leading-relaxed">“{r.text}”</blockquote>
                      <figcaption className="label mt-5">
                        {r.author} · {v ? `${v.make} ${v.model}` : ""}
                      </figcaption>
                    </figure>
                  );
                })}
              </div>
            ) : (
              <p className="text-silver">No reviews yet — be the first.</p>
            )}
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="chamfer bg-graphite p-6" style={{ ["--cut" as string]: "18px" }}>
            <p className="label">Contact</p>
            <a href={tel} className="btn btn-primary chamfer mt-5 w-full">
              <Icon name="phone" size={15} /> {b.phone}
            </a>
            <div className="mt-3 grid gap-2">
              {b.website && (
                <a href={b.website} target="_blank" rel="noopener noreferrer" className="btn btn-ghost chamfer w-full">
                  <Icon name="globe" size={15} /> Website
                </a>
              )}
              {b.instagram && (
                <a href={`https://www.instagram.com/${b.instagram}`} target="_blank" rel="noopener noreferrer" className="btn btn-ghost chamfer w-full">
                  <Icon name="instagram" size={15} /> @{b.instagram}
                </a>
              )}
            </div>
            <dl className="mt-6 divide-y divide-line border-t border-line text-sm">
              {b.hours && (
                <div className="flex justify-between py-3">
                  <dt className="label">Hours</dt>
                  <dd>{b.hours}</dd>
                </div>
              )}
              {b.email && (
                <div className="flex justify-between gap-4 py-3">
                  <dt className="label">Email</dt>
                  <dd>
                    <a href={`mailto:${b.email}`} className="underline decoration-line-strong underline-offset-4 hover:decoration-ivory">
                      {b.email}
                    </a>
                  </dd>
                </div>
              )}
              <div className="flex justify-between py-3">
                <dt className="label">Area</dt>
                <dd>{b.area}</dd>
              </div>
            </dl>
          </div>
          <div className="mt-3 flex gap-2">
            <LikeButton kind="business" id={b.slug} className="btn btn-ghost chamfer" />
            <ShareButton title={b.name} className="flex-1" />
          </div>
          <Link href="/businesses" className="label mt-6 flex items-center gap-2 text-silver hover:text-ivory">
            <Icon name="arrowLeft" size={13} /> All businesses
          </Link>
        </aside>
      </div>

      <MobileActionBar>
        <a href={tel} className="btn btn-primary chamfer !h-11 flex-1">
          <Icon name="phone" size={15} /> Call
        </a>
        {b.website && (
          <a href={b.website} target="_blank" rel="noopener noreferrer" className="btn btn-ghost chamfer !h-11 flex-1">
            Website
          </a>
        )}
      </MobileActionBar>
    </>
  );
}
