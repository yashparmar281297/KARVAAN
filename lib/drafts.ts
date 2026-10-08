// Turns saved records into the shapes the Studio forms edit (numbers → text
// fields, event ISO date → date + time, route start/end split from its stops).
import type { EventDraft } from "@/components/flows/EventBuilder";
import type { BusinessDraft, ClubDraft, ProfileDraft, VehicleDraft } from "@/components/studio/Forms";
import type { Business, Club, Event, Owner, Route, Vehicle } from "./types";

const str = (n: number | undefined) => (n === undefined || n === null ? "" : String(n));

export const profileDraft = (o: Owner): ProfileDraft => ({ id: o.handle, name: o.name, city: o.city, bio: o.bio, instagram: o.instagram ?? "", privacy: o.privacy, portrait: o.portrait });

export const vehicleDraft = (v: Vehicle): VehicleDraft => ({
  id: v.slug,
  kind: v.kind,
  image: v.image,
  gallery: v.gallery.filter((g) => g !== v.image),
  visibility: v.visibility ?? "public",
  ownerHidden: !!v.ownerHidden,
  fields: {
    owner: v.owner,
    class: v.class,
    make: v.make,
    model: v.model,
    variant: v.variant ?? "",
    year: str(v.year),
    colour: v.colour,
    engine: v.spec.engine,
    power: str(v.spec.power),
    torque: v.spec.torque ? String(v.spec.torque) : "",
    transmission: v.spec.transmission ?? "",
    drivetrain: v.spec.drivetrain,
    zeroToHundred: str(v.spec.zeroToHundred),
    topSpeed: str(v.spec.topSpeed),
    mods: v.mods.join("\n"),
    club: v.club ?? "",
  },
});

export const clubDraft = (c: Club): ClubDraft => ({
  id: c.slug,
  logo: c.logo,
  hero: c.hero,
  plus: { membersPlus: !!c.membersPlus, vehiclesPlus: !!c.vehiclesPlus },
  joinPolicy: c.joinPolicy ?? "approval",
  isPrivate: !!c.isPrivate,
  fields: {
    name: c.name,
    tagline: c.tagline ?? "",
    category: c.category,
    kind: c.kind,
    city: c.city,
    founded: str(c.founded),
    about: c.about,
    members: c.members ? String(c.members) : "",
    vehicles: c.vehicles ? String(c.vehicles) : "",
    instagram: c.socials.instagram ?? "",
    website: c.socials.website ?? "",
  },
});

export const eventDraft = (e: Event, r?: Route): EventDraft => ({
  id: e.slug,
  host: e.organizer ?? "me",
  status: e.status ?? "published",
  cover: e.cover,
  fields: {
    title: e.title,
    category: e.category,
    kind: e.kind,
    date: e.date.slice(0, 10),
    start: e.date.slice(11, 16),
    end: e.endTime ?? "",
    city: e.city,
    venue: e.venue,
    summary: e.summary,
    rules: e.rules.join("\n"),
  },
  route: { from: r?.from ?? "", to: r?.to ?? "", distance: str(r?.distanceKm), duration: str(r?.durationMin) },
  stops: (r?.stops ?? []).filter((s) => s.kind !== "start" && s.kind !== "end").map((s, i) => ({ id: i + 1, name: s.name, kind: s.kind, km: str(s.km) })),
  tickets: e.tickets.map((t, i) => ({ id: i + 1, name: t.name, price: String(t.price), limited: t.total !== undefined, slots: str(t.total), perks: t.perks.join(", ") })),
});

export const businessDraft = (b: Business): BusinessDraft => ({
  id: b.slug,
  cover: b.cover,
  gallery: b.gallery,
  categories: b.categories,
  services: b.services.map((s, i) => ({ id: i + 1, name: s.name, from: s.from ? String(s.from) : "" })),
  fields: { name: b.name, city: b.city, area: b.area, about: b.about, phone: b.phone, email: b.email ?? "", website: b.website ?? "", instagram: b.instagram ?? "", hours: b.hours ?? "" },
});
