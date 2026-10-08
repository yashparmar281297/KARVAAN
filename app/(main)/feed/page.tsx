import type { Metadata } from "next";
import Link from "next/link";
import { RequireAccount } from "@/components/auth/RequireAccount";
import { BusinessCard } from "@/components/cards/BusinessCard";
import { ClubCard } from "@/components/cards/ClubCard";
import { EventCard } from "@/components/cards/EventCard";
import { VehicleCard } from "@/components/cards/VehicleCard";
import { FormPage } from "@/components/me/FormPage";
import { getViewer } from "@/lib/auth";
import { cardProps, getBusiness, getClub, getOwner } from "@/lib/data";
import { canSeeEvent, canSeeVehicle } from "@/lib/permissions";
import { readDb } from "@/lib/store";
import type { Business, Event, Vehicle } from "@/lib/types";

export const metadata: Metadata = { title: "Your feed", robots: { index: false } };

type Item = { id: string; at: string; because: string } & ({ type: "vehicle"; v: Vehicle } | { type: "event"; e: Event } | { type: "business"; b: Business });

/**
 * Your feed — built from what you follow (people, clubs, vehicles, businesses,
 * events). Owning a vehicle is never required.
 */
export default async function FeedPage() {
  const viewer = await getViewer();
  if (!viewer?.id) return <RequireAccount what="see your feed" />;
  const db = readDb();
  const follows = db.follows.filter((f) => f.userId === viewer.id).map((f) => f.key);
  const items = new Map<string, Item>();
  const add = (it: Item) => {
    if (!items.has(it.id)) items.set(it.id, it);
  };
  const vAt = (v: Vehicle) => v.createdAt ?? "2000-01-01";
  const eAt = (e: Event) => e.createdAt ?? e.date;

  for (const key of follows) {
    const [kind, id] = [key.slice(0, key.indexOf(":")), key.slice(key.indexOf(":") + 1)];
    if (kind === "owner") {
      const o = getOwner(id);
      if (!o) continue;
      const name = o.privacy === "public" ? o.name : "someone you follow";
      db.vehicles.filter((v) => v.owner === id && !v.ownerHidden && canSeeVehicle(db, v, viewer)).forEach((v) => add({ id: `v:${v.slug}`, at: vAt(v), because: `${name} added a vehicle`, type: "vehicle", v }));
      if (o.userId) db.events.filter((e) => e.createdBy === o.userId && canSeeEvent(db, e, viewer)).forEach((e) => add({ id: `e:${e.slug}`, at: eAt(e), because: `${name} is organising`, type: "event", e }));
    } else if (kind === "club") {
      const c = getClub(id);
      if (!c) continue;
      db.events.filter((e) => e.organizer === id && canSeeEvent(db, e, viewer)).forEach((e) => add({ id: `e:${e.slug}`, at: eAt(e), because: `New from ${c.name}`, type: "event", e }));
      db.vehicles.filter((v) => v.club === id && canSeeVehicle(db, v, viewer)).forEach((v) => add({ id: `v:${v.slug}`, at: vAt(v), because: `In ${c.name}'s garage`, type: "vehicle", v }));
    } else if (kind === "vehicle") {
      const v = db.vehicles.find((x) => x.slug === id);
      if (v && canSeeVehicle(db, v, viewer)) {
        add({ id: `v:${v.slug}`, at: vAt(v), because: "A vehicle you follow", type: "vehicle", v });
        db.events.filter((e) => v.events.includes(e.slug) && canSeeEvent(db, e, viewer)).forEach((e) => add({ id: `e:${e.slug}`, at: eAt(e), because: `${v.make} ${v.model} is going`, type: "event", e }));
      }
    } else if (kind === "event") {
      const e = db.events.find((x) => x.slug === id);
      if (e && canSeeEvent(db, e, viewer)) add({ id: `e:${e.slug}`, at: eAt(e), because: "An event you follow", type: "event", e });
    } else if (kind === "business") {
      const b = getBusiness(id);
      if (b) add({ id: `b:${b.slug}`, at: b.createdAt ?? "2000-01-01", because: "A business you follow", type: "business", b });
    }
  }
  const feed = [...items.values()].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 40);
  const suggestions = db.clubs.filter((c) => !follows.includes(`club:${c.slug}`)).slice(0, 3);

  return (
    <FormPage eyebrow="Feed" title="What's new" intro={follows.length ? `From the ${follows.length} ${follows.length === 1 ? "thing" : "things"} you follow.` : undefined}>
      {feed.length ? (
        <div className="card-grid">
          {feed.map((it) => (
            <div key={it.id}>
              <p className="label mb-2 !text-[9.5px] text-ember">{it.because}</p>
              {it.type === "vehicle" && <VehicleCard {...cardProps(it.v)} tilt={false} />}
              {it.type === "event" && <EventCard e={it.e} />}
              {it.type === "business" && <BusinessCard b={it.b} />}
            </div>
          ))}
        </div>
      ) : (
        <div className="max-w-xl">
          <p className="display text-2xl">Your feed is empty</p>
          <p className="mt-3 text-silver">Follow people, clubs, vehicles and businesses — their new vehicles and events show up here. No vehicle of your own needed.</p>
          <div className="mt-6 flex gap-3">
            <Link href="/clubs" className="btn btn-primary chamfer">
              Browse clubs
            </Link>
            <Link href="/cars" className="btn btn-ghost chamfer">
              Browse cars
            </Link>
          </div>
        </div>
      )}
      {suggestions.length > 0 && (
        <section className="mt-16">
          <p className="label mb-4">Clubs you might follow</p>
          <div className="card-grid">
            {suggestions.map((c) => (
              <ClubCard key={c.slug} c={c} />
            ))}
          </div>
        </section>
      )}
    </FormPage>
  );
}
