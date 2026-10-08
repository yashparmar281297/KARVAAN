import type { Metadata } from "next";
import { AdminEdit } from "@/components/admin/AdminEdit";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EventCard } from "@/components/cards/EventCard";
import { OwnerCard } from "@/components/cards/OwnerCard";
import { DriveCard } from "@/components/cards/DriveCard";
import { JoinClubButton, type JoinState } from "@/components/club/JoinClubButton";
import { VehicleCard } from "@/components/cards/VehicleCard";
import { BrandMark } from "@/components/home/Partners";
import { FollowButton, FollowerCount, ShareButton } from "@/components/ui/Actions";
import { Gallery } from "@/components/ui/Gallery";
import { Icon } from "@/components/ui/Icon";
import { JsonLd } from "@/components/ui/JsonLd";
import { LikeButton } from "@/components/ui/Like";
import { ClubEmblem, VerifiedMark } from "@/components/ui/Monogram";
import { LineReveal } from "@/components/ui/Reveal";
import { Tabs } from "@/components/ui/Tabs";
import { getViewer } from "@/lib/auth";
import { cardProps, cityLine, clubStats, clubSponsor, eventsByClub, getClub } from "@/lib/data";
import { canSeeEvent, canSeeVehicle, clubMemberProfiles, isClubAdmin, isClubMember, membershipOf } from "@/lib/permissions";
import { readDb } from "@/lib/store";
import { CoverHero } from "@/components/ui/CoverHero";


export async function generateMetadata({ params }: PageProps<"/clubs/[slug]">): Promise<Metadata> {
  const c = getClub((await params).slug);
  if (!c) return {};
  return { title: c.name, description: c.about, openGraph: { images: [c.hero] } };
}

export default async function ClubPage({ params }: PageProps<"/clubs/[slug]">) {
  const c = getClub((await params).slug);
  if (!c) notFound();
  const viewer = await getViewer();
  const db = readDb();
  const admin = isClubAdmin(db, c, viewer);
  const member = isClubMember(db, c.slug, viewer);
  const mine = membershipOf(db, c.slug, viewer);
  const joinState: JoinState = admin && viewer?.id ? "admin" : member ? "member" : mine?.status === "pending" ? "pending" : "none";
  // Private clubs show their member list to members (and admins) only.
  const canSeeMembers = !c.isPrivate || member || admin;
  const members = clubMemberProfiles(db, c.slug);
  const memberCount = Math.max(c.members, members.length);
  const garage = db.vehicles.filter((v) => v.club === c.slug && canSeeVehicle(db, v, viewer));
  const events = eventsByClub(c.slug).filter((e) => canSeeEvent(db, e, viewer));
  const drives = events.filter((e) => ["Drive", "Ride", "Road Trip"].includes(e.category));
  const routedDrives = drives.filter((e) => e.route);
  const sponsor = clubSponsor(c);

  const tabs = [
    {
      id: "members",
      label: "Members",
      count: memberCount,
      content: canSeeMembers ? (
        <div>
          <div className="card-grid">
            {/* Keyed by position: a handle in the payload would unmask hidden owners. */}
            {members.map((o, i) => (
              <OwnerCard key={i} o={o} />
            ))}
          </div>
          <p className="label mt-8 text-mute">
            {members.length} of {memberCount}
            {c.membersPlus ? "+" : ""} members are on KARVAAN · Following a club doesn&apos;t make you a member — joining does.
          </p>
        </div>
      ) : (
        <p className="text-silver">This is a private club — only members can see who&apos;s in it.</p>
      ),
    },
    {
      id: "garage",
      label: "Garage",
      count: c.vehicles,
      content: (
        <>
          {garage.length ? (
            <div className="card-grid">
              {garage.map((v) => (
                <VehicleCard key={v.slug} {...cardProps(v)} />
              ))}
            </div>
          ) : (
            <p className="text-silver">Garage coming soon.</p>
          )}
        </>
      ),
    },
    {
      id: "events",
      label: "Events",
      count: events.length,
      content: events.length ? (
        <div className="card-grid">
          {events.map((e) => (
            <EventCard key={e.slug} e={e} />
          ))}
        </div>
      ) : (
        <p className="text-silver">No upcoming events. Follow the club to hear first.</p>
      ),
    },
    {
      id: "drives",
      label: "Drives",
      count: routedDrives.length,
      content: routedDrives.length ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {routedDrives.map((e) => (
            <DriveCard key={e.slug} e={e} />
          ))}
        </div>
      ) : (
        <p className="text-silver">No drives or rides planned yet. Routes appear here when the club hosts a drive or ride.</p>
      ),
    },
    { id: "gallery", label: "Gallery", count: c.gallery.length, content: c.gallery.length ? <Gallery images={c.gallery} alt={c.name} /> : <p className="text-silver">Photos coming soon.</p> },
    {
      id: "about",
      label: "About",
      content: (
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr]">
          <p className="text-lg leading-relaxed text-silver">{c.about}</p>
          <dl className="divide-y divide-line border-y border-line">
            {[
              ...(c.founded ? ([["Founded", String(c.founded)]] as [string, string][]) : []),
              ["Base", cityLine(c.city)],
              ["Category", c.category],
              ["Status", c.verified ? "Verified club" : "Community club"],
              ["Members", `${c.members}${c.membersPlus ? "+" : ""}`],
              ["Vehicles", `${c.vehicles}${c.vehiclesPlus ? "+" : ""}`],
            ].map(([k, val]) => (
              <div key={k} className="flex justify-between gap-4 py-3.5">
                <dt className="label">{k}</dt>
                <dd className="text-right">{val}</dd>
              </div>
            ))}
            <div className="flex flex-wrap gap-2 py-4">
              {c.socials.instagram && (
                <a className="chip" href={`https://www.instagram.com/${c.socials.instagram}`} target="_blank" rel="noopener noreferrer">
                  <Icon name="instagram" size={13} /> Instagram
                </a>
              )}
              {c.socials.youtube && (
                <a className="chip" href={`https://youtube.com/@${c.socials.youtube}`} target="_blank" rel="noopener noreferrer">
                  <Icon name="play" size={13} /> YouTube
                </a>
              )}
            </div>
          </dl>
        </div>
      ),
    },
  ];

  return (
    <>
      <AdminEdit tab="club" id={c.slug} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "SportsOrganization", name: c.name, foundingDate: c.founded ? String(c.founded) : undefined, description: c.about, image: c.hero }} />
      <CoverHero src={c.hero} alt={c.name} overlay={
          <>
        {sponsor && (
          <div className="absolute right-4 top-4 flex items-center gap-3 md:right-6">
            <span className="label !text-[9px] text-mute">Club partner</span>
            <BrandMark b={sponsor} className="text-[13px]" />
          </div>
        )}
          </>
        }>
        <div className="flex flex-wrap items-center gap-4">
          <ClubEmblem club={c} size={84} />
          <div>
            {c.verified && <VerifiedMark />}
            <p className="label mt-2 text-ivory">{cityLine(c.city)}</p>
          </div>
        </div>
        <h1 className="display mt-[clamp(0.6rem,2.5svh,1.5rem)] text-[clamp(2rem,min(5.5vw,8svh),5.5rem)]">
          <LineReveal lines={c.name.split(" ").length > 2 ? [c.name.split(" ").slice(0, -1).join(" "), c.name.split(" ").slice(-1)[0]] : [c.name]} />
        </h1>
        {c.tagline && <p className="display-light mt-4 text-[clamp(1.05rem,min(2vw,2.6svh),1.6rem)] text-ivory/85">{c.tagline}</p>}
        <div className="mt-[clamp(1rem,3.5svh,2rem)] flex flex-col gap-[clamp(1rem,3svh,2rem)] md:flex-row md:items-end md:justify-between">
          <dl className="flex flex-wrap gap-x-[clamp(1.25rem,4vw,2.5rem)] gap-y-3">
            <div>
              <dd className="readout text-[clamp(1.5rem,min(4vw,5.2svh),3.4rem)] leading-none">
                {memberCount}
                {c.membersPlus ? "+" : ""}
              </dd>
              <dt className="label mt-2">Members</dt>
            </div>
            <div>
              <dd className="readout text-[clamp(1.5rem,min(4vw,5.2svh),3.4rem)] leading-none">
                <FollowerCount kind="club" id={c.slug} base={c.followers} />
              </dd>
              <dt className="label mt-2">Followers</dt>
            </div>
            {clubStats(c)
              .filter(([k]) => k !== "Members")
              .map(([k, n]) => (
              <div key={k}>
                <dd className="readout text-[clamp(1.5rem,min(4vw,5.2svh),3.4rem)] leading-none">{n}</dd>
                <dt className="label mt-2">{k}</dt>
              </div>
            ))}
          </dl>
          <div className="flex flex-wrap gap-2 lg:gap-3">
            <JoinClubButton slug={c.slug} state={joinState} policy={c.joinPolicy ?? "approval"} className="max-lg:h-10 max-lg:px-3.5" />
            <FollowButton kind="club" id={c.slug} className="max-lg:h-10 max-lg:px-3.5" />
            <LikeButton kind="club" id={c.slug} className="btn btn-ghost chamfer max-lg:h-10 max-lg:px-3.5" />
            {c.socials.instagram && (
              <a href={`https://www.instagram.com/${c.socials.instagram}`} target="_blank" rel="noopener noreferrer" className="btn btn-ghost chamfer max-lg:h-10 max-lg:px-3.5">
                <Icon name="instagram" size={15} /> @{c.socials.instagram}
              </a>
            )}
            <ShareButton title={c.name} />
          </div>
        </div>
      </CoverHero>
      <section className="container-x">
        <Tabs tabs={tabs} />
      </section>
      <section className="container-x mt-20">
        <Link href="/clubs" className="label flex items-center gap-2 text-silver hover:text-ivory">
          <Icon name="arrowLeft" size={14} /> All clubs
        </Link>
      </section>
    </>
  );
}
