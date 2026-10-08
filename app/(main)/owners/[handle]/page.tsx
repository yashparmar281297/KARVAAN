import type { Metadata } from "next";
import { AdminEdit } from "@/components/admin/AdminEdit";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ClubCard } from "@/components/cards/ClubCard";
import { EventCard } from "@/components/cards/EventCard";
import { PrivateField, VehicleCard } from "@/components/cards/VehicleCard";
import { Garage3D } from "@/components/owner/Garage3D";
import { FollowButton, FollowerCount, ShareButton } from "@/components/ui/Actions";
import { LikeButton } from "@/components/ui/Like";
import { OwnerEdit } from "@/components/admin/OwnerEdit";
import { getViewer } from "@/lib/auth";
import { canEditProfile, canSeeEvent, canSeeVehicle, isClubMember } from "@/lib/permissions";
import { readDb } from "@/lib/store";
import { Icon } from "@/components/ui/Icon";
import { LineReveal } from "@/components/ui/Reveal";
import { SectionHead } from "@/components/ui/SectionHead";
import { cardProps, getOwner, isOwnerProfile, presentOwner } from "@/lib/data";
import { shortDate } from "@/lib/format";
import { FittedImage } from "@/components/ui/FittedImage";
import { fitFont } from "@/lib/fit";


export async function generateMetadata({ params }: PageProps<"/owners/[handle]">): Promise<Metadata> {
  const o = getOwner((await params).handle);
  if (!o) return {};
  const view = presentOwner(o);
  return { title: view.revealed ? (isOwnerProfile(o) ? `${view.name}'s garage` : view.name) : "Private garage", robots: view.revealed ? undefined : { index: false } };
}

export default async function OwnerPage({ params }: PageProps<"/owners/[handle]">) {
  const o = getOwner((await params).handle);
  if (!o) notFound();
  const view = presentOwner(o);
  const viewer = await getViewer();
  const db = readDb();
  const own = !!viewer?.handle && viewer.handle === o.handle;
  // Garage: what THIS visitor may see (privacy per vehicle; hidden-owner vehicles never link back here).
  const garage = db.vehicles.filter((v) => v.owner === o.handle && (own || (!v.ownerHidden && canSeeVehicle(db, v, viewer))));
  const cars = garage.filter((v) => v.kind === "car");
  const bikes = garage.filter((v) => v.kind === "bike");
  // Enthusiasts (and club / organiser / business accounts) aren't owners: no garage on their page.
  const isOwner = isOwnerProfile(o) || garage.length > 0;

  // Hidden identities get a minimal page — no portrait, name, city or clubs.
  // Your own hidden profile: send you to your account rather than the stranger view.
  if (!view.revealed && own) redirect("/me");

  if (!view.revealed) {
    return (
      <section className="container-x pt-32">
        <div className="chamfer relative mx-auto max-w-2xl overflow-hidden bg-graphite p-10 text-center" style={{ ["--cut" as string]: "20px" }}>
          <div className="relative mx-auto h-40 w-40 overflow-hidden rounded-full">
            <PrivateField />
          </div>
          <p className="label mt-8 flex items-center justify-center gap-2 text-ember">
            <Icon name="lock" size={12} /> {view.privacy === "private" ? "Private owner" : "Club members only"}
          </p>
          <h1 className="display mt-4 text-4xl">{view.name}</h1>
          <p className="label mt-3">{view.location}</p>
          <p className="mx-auto mt-6 max-w-md text-sm leading-relaxed text-silver">
            This owner has chosen to keep their identity private. Their vehicles still appear in the collection with owner details hidden.
          </p>
          <Link href="/cars" className="btn btn-ghost chamfer mt-8">
            Back to the collection
          </Link>
        </div>
      </section>
    );
  }

  // Clubs: real memberships (+ profile links made before memberships existed).
  const clubs = db.clubs.filter((c) => o.clubs.includes(c.slug) || (!!o.userId && isClubMember(db, c.slug, { id: o.userId, name: o.name, handle: o.handle, capabilities: [], admin: false })));
  // Events this person organises, plus ones their vehicles attended.
  const events = db.events.filter((e) => ((!!o.userId && e.createdBy === o.userId) || garage.some((v) => v.events.includes(e.slug))) && canSeeEvent(db, e, viewer));
  // Following: people / clubs / … this account follows (+ the stored base for older profiles).
  const followingCount = o.following + (o.userId ? db.follows.filter((f) => f.userId === o.userId).length : 0);
  const firstName = o.name.split(" ")[0];

  return (
    <>
      <AdminEdit tab="profile" id={o.handle} />
      <OwnerEdit href="/me/profile" label="Edit profile" show={!viewer?.admin && canEditProfile(o, viewer)} />
      {/* Identity. The portrait is always the standard 4:5 — sized by screen height so the
          photo, name, stats and buttons (Instagram included) fit in one screen. */}
      <section className="relative pb-[96px] pt-[84px] lg:h-[100svh] lg:min-h-[640px] lg:pb-10 lg:pt-[100px]">
        <div className="container-x flex flex-col gap-5 lg:grid lg:h-full lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-12">
          <div
            className="chamfer relative mx-auto aspect-[4/5] w-full max-w-[max(220px,calc((100svh-27rem)*0.8))] overflow-hidden lg:order-2 lg:mx-0 lg:h-full lg:w-[calc((max(100svh,640px)-140px)*0.8)] lg:max-w-none"
            style={{ ["--cut" as string]: "24px" }}
          >
            {/* One image only: the owner's portrait. */}
            <FittedImage src={o.portrait} alt={o.name} preload sizes="(max-width: 1024px) 90vw, 45vw" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-transparent" />
            <div className="ticks absolute inset-3" />
            {/* Phone: name over the photo */}
            <div className="absolute inset-x-0 bottom-0 p-4 lg:hidden">
              <h1 className="display text-[clamp(1.8rem,8vw,2.6rem)] leading-[0.95]">{o.name}</h1>
              <p className="label mt-2 text-ivory">{view.location}</p>
            </div>
            {isOwner && <p className="display-light absolute bottom-4 right-5 hidden text-right text-[clamp(1rem,2.4svh,1.5rem)] text-ivory/85 lg:block">
              Garage
              <br />
              <span className="display">{String(garage.length).padStart(2, "0")} machines</span>
            </p>}
          </div>
          <div className="flex min-w-0 flex-col justify-end @container lg:order-1 lg:pb-2">
            <p className="label mb-[clamp(0.5rem,2svh,1.5rem)] hidden items-center gap-3 lg:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-ember" /> Member since {shortDate(o.joined)}
            </p>
            <h1 className="display hidden lg:block" style={{ fontSize: fitFont("clamp(2rem, min(6.5vw, 11svh), 7.5rem)", o.name.split(" ")) }}>
              <LineReveal lines={o.name.split(" ")} />
            </h1>
            <p className="label mt-[clamp(0.4rem,1.5svh,1.25rem)] hidden text-ivory lg:block">{view.location}</p>
            {o.bio && <p className="line-clamp-2 lg:mt-[clamp(0.4rem,1.5svh,1.25rem)] max-w-md text-sm leading-relaxed text-silver lg:line-clamp-3 lg:text-base">{o.bio}</p>}
            <dl className={`mt-[clamp(0.75rem,3svh,2.5rem)] grid ${isOwner ? "grid-cols-5" : "grid-cols-3"} gap-3 border-t border-line pt-[clamp(0.6rem,2svh,1.5rem)] lg:gap-6`}>
              {[
                ["Followers", <FollowerCount key="f" kind="owner" id={o.handle} base={o.followers} />],
                ["Following", followingCount],
                ...(isOwner
                  ? [
                      ["Cars", String(cars.length).padStart(2, "0")],
                      ["Bikes", String(bikes.length).padStart(2, "0")],
                    ]
                  : []),
                ["Clubs", String(clubs.length).padStart(2, "0")],
              ].map(([label, value]) => (
                <div key={label as string}>
                  <dd className="readout text-[clamp(1.3rem,min(6vw,5.5svh),3rem)] leading-none">{value}</dd>
                  <dt className="label mt-1.5 !text-[8.5px] !tracking-[0.06em] sm:!text-[9.5px] sm:!tracking-[0.14em] lg:!text-[11px] lg:!tracking-[0.2em]">{label}</dt>
                </div>
              ))}
            </dl>
            <div className="mt-[clamp(0.75rem,3svh,2rem)] flex flex-wrap gap-2 lg:gap-3">
              <FollowButton kind="owner" id={o.handle} label={`Follow ${firstName}`} className="max-lg:h-10 max-lg:px-3.5" />
              <LikeButton kind="owner" id={o.handle} className="btn btn-ghost chamfer max-lg:h-10 max-lg:px-3.5" />
              <ShareButton title={isOwner ? `${o.name}'s garage` : o.name} className="max-lg:h-10 max-lg:px-3.5" />
              {o.instagram && (
                <a href={`https://www.instagram.com/${o.instagram}`} target="_blank" rel="noopener noreferrer" className="btn btn-ghost chamfer max-lg:h-10 max-lg:px-3.5">
                  <Icon name="instagram" size={15} /> @{o.instagram}
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 3D garage — owners only */}
      {isOwner && (
      <section className="mt-20 overflow-hidden md:mt-28">
        <div className="container-x">
          <SectionHead index="01" eyebrow="The garage" title={[`${firstName}'s`, "collection"]} />
        </div>
        {garage.length >= 3 && (
          <div className="hidden lg:block">
            <Garage3D vehicles={garage} />
          </div>
        )}
        <div className={`container-x card-grid ${garage.length >= 3 ? "lg:hidden" : ""}`}>
          {garage.map((v) => (
            <div key={v.slug}>
              <VehicleCard {...cardProps(v)} />
            </div>
          ))}
        </div>
      </section>
      )}

      {/* Cards */}
      {garage.length >= 3 && (
        <section className="container-x mt-24 hidden lg:block">
          <SectionHead index="02" eyebrow="Cards" title={["Every", "collectible"]} />
          <div className="card-grid">
            {garage.map((v) => (
              <VehicleCard key={v.slug} {...cardProps(v)} />
            ))}
          </div>
        </section>
      )}

      {clubs.length > 0 && (
        <section className="container-x mt-24">
          <SectionHead index="04" eyebrow="Clubs" title={["Rides", "with"]} />
          <div className="card-grid">
            {clubs.map((c) => (
              <ClubCard key={c.slug} c={c} />
            ))}
          </div>
        </section>
      )}

      {events.length > 0 && (
        <section className="container-x mt-24">
          <SectionHead index="05" eyebrow="Events" title={["On the", "calendar"]} />
          <div className="card-grid">
            {events.map((e) => (
              <EventCard key={e.slug} e={e} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
