import type { Metadata } from "next";
import Link from "next/link";
import { EventBuilder } from "@/components/flows/EventBuilder";
import { BusinessForm, ClubForm, NeedFirst, ProfileForm, VehicleForm } from "@/components/studio/Forms";
import { Manage, type ManageItem } from "@/components/studio/Manage";
import { isAdmin } from "@/lib/admin";
import { ASPECT } from "@/lib/images";
import { businesses, cities, cityName, clubs, events, getBusiness, getClub, getEvent, getOwner, getRoute, getVehicle, owners, vehicles } from "@/lib/data";
import { businessDraft, clubDraft, eventDraft, profileDraft, vehicleDraft } from "@/lib/drafts";

export const metadata: Metadata = { title: "Studio — add & test", robots: { index: false } };

const TABS = [
  { id: "profile", label: "Profile" },
  { id: "vehicle", label: "Vehicle" },
  { id: "club", label: "Club" },
  { id: "event", label: "Event" },
  { id: "business", label: "Business" },
  { id: "manage", label: "Manage" },
] as const;
type Tab = (typeof TABS)[number]["id"];

export default async function StudioPage({ searchParams }: PageProps<"/studio">) {
  if (!(await isAdmin()))
    return (
      <section className="container-x flex min-h-[70svh] flex-col items-start justify-center pt-28">
        <p className="label text-ember">Admin only</p>
        <h1 className="display mt-4 text-[clamp(2.2rem,min(6vw,7.8svh),4rem)]">Studio is locked</h1>
        <p className="mt-4 max-w-md text-silver">Log in with the admin passcode to add or delete profiles, vehicles, clubs, events and businesses.</p>
        <Link href="/login?next=/studio" className="btn btn-primary chamfer mt-8">
          Admin login
        </Link>
      </section>
    );

  const sp = await searchParams;
  const q = sp.tab;
  const tab: Tab = TABS.some((t) => t.id === q) ? (q as Tab) : "profile";
  const editId = typeof sp.edit === "string" ? sp.edit : undefined;

  // Edit mode: the record being edited, shaped for its form (undefined = add new).
  const editOwner = tab === "profile" && editId ? getOwner(editId) : undefined;
  const editVehicle = tab === "vehicle" && editId ? getVehicle(editId) : undefined;
  const editClub = tab === "club" && editId ? getClub(editId) : undefined;
  const editEvent = tab === "event" && editId ? getEvent(editId) : undefined;
  const editBusiness = tab === "business" && editId ? getBusiness(editId) : undefined;
  const editing = editOwner?.name ?? (editVehicle && `${editVehicle.make} ${editVehicle.model}`) ?? editClub?.name ?? editEvent?.title ?? editBusiness?.name;
  const cityOptions = cities.map((c) => ({ value: c.slug, label: c.name })).sort((a, b) => a.label.localeCompare(b.label));
  const counts: Record<Tab, number | undefined> = { profile: owners.length, vehicle: vehicles.length, club: clubs.length, event: events.length, business: businesses.length, manage: undefined };

  const items: ManageItem[] = [
    ...owners.map((o) => ({ kind: "owner" as const, id: o.handle, title: o.name, subtitle: `${o.privacy} · ${o.city ? cityName(o.city) : "No city"}`, image: o.portrait, href: `/owners/${o.handle}`, aspect: ASPECT.portrait })),
    ...vehicles.map((v) => ({ kind: "vehicle" as const, id: v.slug, title: `${v.make} ${v.model}`, subtitle: `${v.kind} · ${owners.find((o) => o.handle === v.owner)?.name ?? "—"}`, image: v.image, href: `/vehicles/${v.slug}`, aspect: ASPECT.vehicle })),
    ...clubs.map((c) => ({ kind: "club" as const, id: c.slug, title: c.name, subtitle: `${c.category} · ${cityName(c.city)}`, image: c.hero, href: `/clubs/${c.slug}`, aspect: ASPECT.cover })),
    ...events.map((e) => ({ kind: "event" as const, id: e.slug, title: e.title, subtitle: `${e.category} · ${e.date.slice(0, 10)}`, image: e.cover, href: `/events/${e.slug}`, aspect: ASPECT.cover })),
    ...businesses.map((b) => ({ kind: "business" as const, id: b.slug, title: b.name, subtitle: `${b.categories[0]} · ${cityName(b.city)}`, image: b.cover, href: `/businesses/${b.slug}`, aspect: ASPECT.cover })),
  ];

  return (
    <section className="container-x pb-16 pt-28 md:pt-36">
      <p className="label mb-4 flex items-center gap-3">
        <span className="h-1.5 w-1.5 rounded-full bg-ember" /> Test mode · saved on this computer
      </p>
      <h1 className="display text-[clamp(2.4rem,min(7vw,9.1svh),5.5rem)]">Studio</h1>
      <p className="mt-4 max-w-xl text-silver">Add profiles, vehicles, clubs, events and businesses with your own photos. Every photo is cropped to a fixed frame when you upload, so it shows the same everywhere on the site.</p>

      <nav aria-label="Studio sections" className="no-scrollbar -mx-4 mt-10 flex gap-2 overflow-x-auto border-b border-line px-4 pb-4 md:mx-0 md:px-0">
        {TABS.map((t) => (
          <Link key={t.id} href={`/studio?tab=${t.id}`} className="chip shrink-0" data-active={tab === t.id} aria-current={tab === t.id ? "page" : undefined}>
            {t.label}
            {counts[t.id] !== undefined && <span className="readout text-[10px] opacity-60">{counts[t.id]}</span>}
          </Link>
        ))}
      </nav>

      {editing ? (
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-[3px] bg-graphite p-4 hairline">
          <p className="min-w-0 text-sm">
            <span className="label mr-2 text-ember">Editing</span>
            <span className="text-ivory [overflow-wrap:anywhere]">{editing}</span>
          </p>
          <Link href={`/studio?tab=${tab}`} className="label text-silver hover:text-ivory">
            Cancel · add new instead
          </Link>
        </div>
      ) : (
        editId && <p className="mt-8 text-sm text-ember">That item no longer exists — showing a new form.</p>
      )}

      {/* key: remount the form when switching between add / editing different items */}
      <div className="mt-10" key={`${tab}:${editing ? editId : "new"}`}>
        {tab === "profile" && <ProfileForm cities={cityOptions} initial={editOwner && profileDraft(editOwner)} />}
        {tab === "vehicle" && <VehicleForm owners={owners.map((o) => ({ value: o.handle, label: o.name }))} clubs={clubs.map((c) => ({ value: c.slug, label: c.name }))} initial={editVehicle && vehicleDraft(editVehicle)} />}
        {tab === "club" && <ClubForm cities={cityOptions} initial={editClub && clubDraft(editClub)} />}
        {tab === "event" &&
          (clubs.length ? (
            <div className="-mt-14">
              <EventBuilder
                hosts={clubs.map((c) => ({ slug: c.slug, name: c.name, city: c.city }))}
                initialHost={clubs[0].slug}
                cities={cityOptions.map((c) => ({ slug: c.value, name: c.label }))}
                initial={editEvent && eventDraft(editEvent, editEvent.route ? getRoute(editEvent.route) : undefined)}
              />
            </div>
          ) : (
            <NeedFirst what="a club" tab="club" why="Events are hosted by a club." />
          ))}
        {tab === "business" && <BusinessForm cities={cityOptions} initial={editBusiness && businessDraft(editBusiness)} />}
        {tab === "manage" && <Manage items={items} />}
      </div>
    </section>
  );
}
