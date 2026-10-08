import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { RequireAccount } from "@/components/auth/RequireAccount";
import { DeleteButton, LeaveClubButton, LogoutButton } from "@/components/me/Buttons";
import { MeSection } from "@/components/me/Section";
import { SocialList } from "@/components/me/SocialList";
import { Icon } from "@/components/ui/Icon";
import { getViewer } from "@/lib/auth";
import { cityName, fromPrice, getClub, getEvent, getOwner } from "@/lib/data";
import { inr } from "@/lib/format";
import { canCreateBusiness, canCreateClub, canCreateEvent, capLabel, hasGarage } from "@/lib/capabilities";
import { isClubAdmin } from "@/lib/permissions";
import { resolveKeys } from "@/lib/resolve";
import { SITE } from "@/lib/site";
import { readDb } from "@/lib/store";

export const metadata: Metadata = { title: "My account", robots: { index: false } };

const VIS_LABEL: Record<string, string> = { public: "Public", club: "Club members", followers: "Followers", private: "Private" };

/**
 * My account — ONE person, many capabilities. Sections appear based on what the
 * person actually has: everyone gets profile / following / saved / likes /
 * events; owners get their garage; members their clubs; admins, organisers
 * and business owners their management tools.
 */
export default async function MePage() {
  const viewer = await getViewer();
  if (!viewer) return <RequireAccount what="open your account" />;
  if (!viewer.id) redirect("/studio"); // site admin without a personal account
  const db = readDb();
  const user = db.users.find((u) => u.id === viewer.id)!;
  const profile = getOwner(user.handle)!;
  const now = new Date().toISOString();

  const rows = (list: { userId: string; key: string; createdAt: string }[]) =>
    list
      .filter((r) => r.userId === user.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((r) => r.key);
  const following = resolveKeys(rows(db.follows));
  const saved = resolveKeys(rows(db.saves));
  const liked = resolveKeys(rows(db.likes));
  const followers = db.follows.filter((f) => f.key === `owner:${profile.handle}`).length + profile.followers;

  const garage = db.vehicles.filter((v) => v.owner === profile.handle);
  const myRegs = db.registrations.filter((r) => r.userId === user.id).map((r) => ({ r, e: getEvent(r.event) })).filter((x) => !!x.e);
  const upcoming = myRegs.filter((x) => x.e!.date >= now).sort((a, b) => a.e!.date.localeCompare(b.e!.date));
  const past = myRegs.filter((x) => x.e!.date < now).sort((a, b) => b.e!.date.localeCompare(a.e!.date));

  const memberships = db.memberships.filter((m) => m.userId === user.id && m.status !== "rejected");
  const legacyClubs = profile.clubs.filter((c) => !memberships.some((m) => m.club === c));
  const myClubs = [...memberships.map((m) => ({ slug: m.club, status: m.status, role: m.role })), ...legacyClubs.map((c) => ({ slug: c, status: "approved" as const, role: "member" as const }))].map((m) => ({ ...m, club: getClub(m.slug) })).filter((m) => !!m.club);
  const managedClubs = db.clubs.filter((c) => isClubAdmin(db, c, { ...viewer, admin: false }));
  const pendingFor = (slug: string) => db.memberships.filter((m) => m.club === slug && m.status === "pending").length;

  const managedEvents = db.events.filter((e) => e.createdBy === user.id || (e.organizer && managedClubs.some((c) => c.slug === e.organizer)));
  const stats = (slug: string) => {
    const regs = db.registrations.filter((r) => r.event === slug);
    const e = db.events.find((x) => x.slug === slug)!;
    const people = regs.reduce((n, r) => n + r.tickets.reduce((m, t) => m + t.qty, 0), 0);
    const revenue = regs.reduce((n, r) => n + r.tickets.reduce((m, t) => m + (e.tickets.find((x) => x.id === t.id)?.price ?? 0) * t.qty, 0), 0);
    return { people, revenue };
  };
  const drafts = managedEvents.filter((e) => e.status === "draft");
  const liveUpcoming = managedEvents.filter((e) => e.status !== "draft" && e.date >= now);
  const livePast = managedEvents.filter((e) => e.status !== "draft" && e.date < now);
  const businesses = db.businesses.filter((b) => b.ownerUserId === user.id);

  const caps = user.capabilities;
  // Sections follow what the person does (capabilities) and what they already have.
  const showGarage = garage.length > 0 || hasGarage(caps);
  const showClubs = myClubs.length > 0;
  const showManageClubs = managedClubs.length > 0 || canCreateClub(caps);
  const showManageEvents = managedEvents.length > 0 || canCreateEvent(caps);
  const showBusiness = businesses.length > 0 || canCreateBusiness(caps);
  const createTiles = [
    ...(hasGarage(caps) ? [["/me/vehicles/new", "garage", "Add a vehicle"]] : []),
    ...(canCreateClub(caps) ? [["/clubs/new", "users", "Create a club"]] : []),
    ...(canCreateEvent(caps) ? [["/events/new", "calendar", "Create an event"]] : []),
    ...(canCreateBusiness(caps) ? [["/businesses/new", "pin", "List a business"]] : []),
  ];

  const nav = [
    ["following", "Following"],
    ["saved", "Saved"],
    ["likes", "Likes"],
    ["events", "My events"],
    ...(showGarage ? [["garage", "My garage"]] : []),
    ...(showClubs ? [["clubs", "My clubs"]] : []),
    ...(showManageClubs ? [["manage-clubs", "Manage clubs"]] : []),
    ...(showManageEvents ? [["manage-events", "Manage events"]] : []),
    ...(showBusiness ? [["business", "Manage business"]] : []),
  ];

  return (
    <div className="container-x pb-16 pt-24 md:pt-32">
      {/* Profile */}
      <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="flex items-center gap-5">
          <span className="relative aspect-[4/5] w-20 shrink-0 overflow-hidden rounded-[3px] bg-graphite hairline md:w-24">
            <Image src={profile.portrait} alt={profile.name} fill sizes="96px" className="object-cover" />
          </span>
          <div className="min-w-0">
            <p className="label">My account</p>
            <h1 className="display mt-2 text-[clamp(2rem,min(6vw,7.8svh),4rem)] leading-[0.95] [overflow-wrap:anywhere]">{profile.name}</h1>
            <p className="label mt-2">{profile.city ? `${cityName(profile.city)}, India` : "City not set"}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/owners/${profile.handle}`} className="btn btn-ghost chamfer">
            View profile
          </Link>
          <Link href="/me/profile" className="btn btn-ghost chamfer">
            <Icon name="wrench" size={14} /> Edit profile
          </Link>
          <LogoutButton />
        </div>
      </header>

      <dl className="mt-8 grid grid-cols-3 gap-px bg-line hairline sm:grid-cols-5">
        {[
          ["Followers", followers],
          ["Following", following.length],
          ["Garage", garage.length],
          ["Clubs", myClubs.filter((m) => m.status === "approved").length],
          ["Events", myRegs.length + managedEvents.length],
        ].map(([k, n]) => (
          <div key={k as string} className="bg-ink p-4">
            <dd className="readout text-3xl">{n}</dd>
            <dt className="label mt-1 !text-[9.5px]">{k}</dt>
          </div>
        ))}
      </dl>

      <div className="mt-6 flex flex-wrap items-center gap-2" aria-label="What you do on KARVAAN">
        {caps.map((c) => (
          <span key={c} className="chip">
            {capLabel(c)}
          </span>
        ))}
      </div>

      {/* What this person can create — from their capabilities. Enthusiasts follow, like, save and attend. */}
      {createTiles.length === 0 && (
        <p className="mt-8 max-w-xl text-sm text-silver">
          As an enthusiast you can follow, like, save, join clubs and register for events. Your account type was chosen when you joined.
        </p>
      )}
      <div className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {createTiles.map(([href, icon, label]) => (
          <Link key={href} href={href} className="flex items-center gap-3 rounded-[3px] bg-graphite p-4 text-sm text-ivory transition hover:bg-charcoal hairline">
            <Icon name={icon as "garage"} size={18} className="text-ember" /> {label}
          </Link>
        ))}
      </div>

      <nav aria-label="Account sections" className="no-scrollbar -mx-4 mt-8 flex gap-2 overflow-x-auto px-4">
        {nav.map(([id, label]) => (
          <a key={id} href={`#${id}`} className="chip shrink-0">
            {label}
          </a>
        ))}
      </nav>

      <div className="mt-8 space-y-12">
        <MeSection id="following" title="Following" count={following.length}>
          <SocialList kind="follows" items={following} empty={<>You&apos;re not following anything yet — follow people, clubs, vehicles and businesses to fill <Link href="/feed" className="underline">your feed</Link>.</>} />
        </MeSection>

        <MeSection id="saved" title="Saved" count={saved.length}>
          <SocialList kind="saves" items={saved} empty="Nothing saved yet — tap Save on an event to keep it here." />
        </MeSection>

        <MeSection id="likes" title="Likes" count={liked.length}>
          <SocialList kind="likes" items={liked} empty="Nothing liked yet." />
        </MeSection>

        <MeSection id="events" title="My events" count={myRegs.length}>
          {myRegs.length ? (
            <div className="grid gap-6 md:grid-cols-2">
              {[
                ["Upcoming", upcoming],
                ["Past", past],
              ].map(([label, list]) => (
                <div key={label as string}>
                  <p className="label mb-3">{label as string}</p>
                  {(list as typeof upcoming).length ? (
                    <ul className="space-y-2">
                      {(list as typeof upcoming).map(({ r, e }) => (
                        <li key={r.id} className="flex items-center justify-between gap-3 rounded-[3px] bg-graphite p-3 hairline">
                          <Link href={`/events/${e!.slug}`} className="min-w-0">
                            <span className="block truncate text-sm text-ivory">{e!.title}</span>
                            <span className="label mt-0.5 block !text-[9px]">
                              {e!.date.slice(0, 10)} · Ref {r.id}
                            </span>
                          </Link>
                          {r.checkedIn && <span className="chip shrink-0">Checked in</span>}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-mute">None.</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-silver">
              You haven&apos;t registered for any events yet.{" "}
              <Link href="/events" className="underline">
                Browse events
              </Link>
            </p>
          )}
        </MeSection>

        {showGarage && (
          <MeSection id="garage" title="My garage" count={garage.length} action={hasGarage(caps) ? { href: "/me/vehicles/new", label: "Add vehicle" } : undefined}>
            {garage.length ? (
              <ul className="grid gap-2 md:grid-cols-2">
                {garage.map((v) => (
                  <li key={v.slug} className="flex items-center gap-3 rounded-[3px] bg-graphite p-2.5 hairline">
                    <span className="relative aspect-[4/5] w-12 shrink-0 overflow-hidden rounded-[2px]">
                      <Image src={v.image} alt="" fill sizes="48px" className="object-cover" />
                    </span>
                    <Link href={`/vehicles/${v.slug}`} className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-ivory">
                        {v.make} {v.model}
                      </span>
                      <span className="label mt-0.5 block truncate !text-[9px]">
                        {v.kind === "bike" ? "Bike" : "Car"} → {v.class} · {VIS_LABEL[v.visibility ?? "public"]}
                        {v.ownerHidden ? " · Owner hidden" : ""}
                        {v.club ? ` · ${getClub(v.club)?.name ?? ""}` : ""}
                      </span>
                    </Link>
                    <Link href={`/me/vehicles/${v.slug}/edit`} className="label shrink-0 px-2 py-2 !text-[9.5px] text-ivory">
                      Edit
                    </Link>
                    <DeleteButton kind="vehicle" id={v.slug} name={`${v.make} ${v.model}`} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-silver">Your garage is empty — add your first car or bike.</p>
            )}
          </MeSection>
        )}

        {showClubs && (
          <MeSection id="clubs" title="My clubs" count={myClubs.length}>
            {myClubs.length ? (
              <ul className="grid gap-2 md:grid-cols-2">
                {myClubs.map((m) => (
                  <li key={m.slug} className="flex items-center gap-3 rounded-[3px] bg-graphite p-3 hairline">
                    <Link href={`/clubs/${m.slug}`} className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-ivory">{m.club!.name}</span>
                      <span className="label mt-0.5 block !text-[9px]">{m.status === "pending" ? "Request pending" : m.role === "admin" ? "Admin" : "Member"}</span>
                    </Link>
                    {m.role !== "admin" && <LeaveClubButton slug={m.slug} pending={m.status === "pending"} />}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-silver">
                You haven&apos;t joined a club yet.{" "}
                <Link href="/clubs" className="underline">
                  Find clubs
                </Link>
              </p>
            )}
          </MeSection>
        )}

        {showManageClubs && (
          <MeSection id="manage-clubs" title="Manage clubs" count={managedClubs.length} action={canCreateClub(caps) ? { href: "/clubs/new", label: "Create club" } : undefined}>
            {managedClubs.length ? (
              <ul className="grid gap-2 md:grid-cols-2">
                {managedClubs.map((c) => (
                  <li key={c.slug} className="flex flex-wrap items-center gap-3 rounded-[3px] bg-graphite p-3 hairline">
                    <Link href={`/clubs/${c.slug}`} className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-ivory">{c.name}</span>
                      <span className="label mt-0.5 block !text-[9px]">{pendingFor(c.slug) ? <span className="text-ember">{pendingFor(c.slug)} join request(s) waiting</span> : "Admin"}</span>
                    </Link>
                    <Link href={`/clubs/${c.slug}/manage`} className="btn btn-ghost chamfer !h-9 !px-3">
                      Manage
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-silver">You don&apos;t run a club yet — create one and you become its admin.</p>
            )}
          </MeSection>
        )}

        {showManageEvents && (
          <MeSection id="manage-events" title="Manage events" count={managedEvents.length} action={canCreateEvent(caps) ? { href: "/events/new", label: "Create event" } : undefined}>
            {managedEvents.length ? (
              <div className="space-y-6">
                {[
                  ["Upcoming", liveUpcoming],
                  ["Drafts", drafts],
                  ["Past", livePast],
                ].map(([label, list]) =>
                  (list as typeof drafts).length ? (
                    <div key={label as string}>
                      <p className="label mb-3">{label as string}</p>
                      <ul className="grid gap-2 md:grid-cols-2">
                        {(list as typeof drafts).map((e) => {
                          const st = stats(e.slug);
                          return (
                            <li key={e.slug} className="flex flex-wrap items-center gap-3 rounded-[3px] bg-graphite p-3 hairline">
                              <Link href={`/events/${e.slug}`} className="min-w-0 flex-1">
                                <span className="block truncate text-sm text-ivory">{e.title}</span>
                                <span className="label mt-0.5 block !text-[9px]">
                                  {e.date.slice(0, 10)} · {st.people} registered{fromPrice(e) > 0 ? ` · ${inr(st.revenue)} sales` : ""}
                                </span>
                              </Link>
                              <Link href={`/events/${e.slug}/manage`} className="btn btn-ghost chamfer !h-9 !px-3">
                                Manage
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ) : null,
                )}
                <p className="text-xs text-mute">Paid tickets: buyers pay a {SITE.platformFeePct}% platform fee on top — your revenue is the ticket price.</p>
              </div>
            ) : (
              <p className="text-sm text-silver">You haven&apos;t created an event yet — no club or vehicle needed.</p>
            )}
          </MeSection>
        )}

        {showBusiness && (
          <MeSection id="business" title="Manage business" count={businesses.length} action={canCreateBusiness(caps) ? { href: "/businesses/new", label: "List business" } : undefined}>
            {businesses.length ? (
              <ul className="grid gap-2 md:grid-cols-2">
                {businesses.map((b) => (
                  <li key={b.slug} className="flex items-center gap-3 rounded-[3px] bg-graphite p-3 hairline">
                    <Link href={`/businesses/${b.slug}`} className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-ivory">{b.name}</span>
                      <span className="label mt-0.5 block !text-[9px]">{b.categories.join(" · ")}</span>
                    </Link>
                    <Link href={`/businesses/${b.slug}/edit`} className="label shrink-0 px-2 py-2 !text-[9.5px] text-ivory">
                      Edit
                    </Link>
                    <DeleteButton kind="business" id={b.slug} name={b.name} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-silver">List your workshop, studio or dealership — it gets its own page, managed from this account.</p>
            )}
          </MeSection>
        )}
      </div>
    </div>
  );
}
