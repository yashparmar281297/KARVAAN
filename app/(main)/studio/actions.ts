"use server";

import { revalidatePath } from "next/cache";
import { getViewer, grantCapability, newId, type Viewer } from "@/lib/auth";
import type { Db } from "@/lib/data/source";
import { canCreateBusiness, canCreateClub, canCreateEvent, garageKinds } from "@/lib/capabilities";
import { canEditProfile, canEditVehicle, canManageBusiness, canManageEvent, isClubAdmin, isClubMember } from "@/lib/permissions";
import { cities } from "@/lib/data/geo";
import { UPLOAD_URL } from "@/lib/images";
import { mutate, resetDb } from "@/lib/store";
import type { BusinessCategory, ClubCategory, EventCategory, Privacy, StopKind, VehicleClass, VehicleKind, Visibility } from "@/lib/types";

// Create / edit / delete for every kind — used by members (My account, Create
// club / event / business) and by the site admin (Studio). Every action checks
// the viewer on the server:
//   • creating needs the matching capability (lib/capabilities): a garage needs
//     Supercar / Superbike / Custom-mod owner, clubs need Club organizer, events
//     need Event or Club organizer, businesses need Automotive business.
//     Enthusiasts follow, like, save and attend — they don't create;
//   • only the owner / a club admin / the organiser / the site admin can edit.
// Local test database now; these become inserts/updates guarded by Row Level
// Security on Supabase.
//
// Each kind has one `parse…` (validates the form) shared by create and edit.
// Editing never changes a record's URL (slug/handle) or its counters.

export type Result = { ok: true; href: string } | { ok: false; error: string };

class Invalid extends Error {}

const text = (v: unknown, field: string, { max = 120, required = true } = {}) => {
  const s = typeof v === "string" ? v.trim() : "";
  if (required && !s) throw new Invalid(`${field} is required.`);
  if (s.length > max) throw new Invalid(`${field} is too long (max ${max} characters).`);
  return s;
};
const optText = (v: unknown, field: string, max = 120) => text(v, field, { max, required: false }) || undefined;
const num = (v: unknown, field: string, { min = 0, max = 1e7, required = false } = {}) => {
  if (v === "" || v === undefined || v === null) {
    if (required) throw new Invalid(`${field} is required.`);
    return undefined;
  }
  const n = Number(v);
  if (!Number.isFinite(n) || n < min || n > max) throw new Invalid(`${field} must be a number between ${min} and ${max}.`);
  return n;
};
const oneOf = <T extends string>(v: unknown, list: readonly T[], field: string): T => {
  if (!list.includes(v as T)) throw new Invalid(`Choose a ${field}.`);
  return v as T;
};
const image = (v: unknown, field: string, required = true) => {
  if (!v && !required) return undefined;
  if (typeof v !== "string" || !UPLOAD_URL.test(v)) throw new Invalid(`${field}: upload a photo.`);
  return v;
};
const images = (v: unknown, field: string, max = 12) => {
  const list = Array.isArray(v) ? v : [];
  if (list.length > max) throw new Invalid(`${field}: at most ${max} photos.`);
  return list.map((x) => image(x, field)!);
};
const city = (v: unknown, required = true) => {
  if (!v && !required) return "";
  if (!cities.some((c) => c.slug === v)) throw new Invalid("Choose a city.");
  return v as string;
};
const handleText = (v: unknown) => {
  const s = optText(v, "Instagram", 40)?.replace(/^@/, "").replace(/^https?:\/\/(www\.)?instagram\.com\//, "").replace(/\/.*$/, "");
  if (s && !/^[A-Za-z0-9._]{1,30}$/.test(s)) throw new Invalid("Instagram: enter just the username.");
  return s;
};
const url = (v: unknown, field: string) => {
  const s = optText(v, field, 200);
  if (!s) return undefined;
  const withScheme = /^https?:\/\//.test(s) ? s : `https://${s}`;
  try {
    return new URL(withScheme).toString();
  } catch {
    throw new Invalid(`${field}: enter a valid web address.`);
  }
};
const lines = (v: unknown, max: number, len = 120) =>
  String(v ?? "")
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, max)
    .map((x) => x.slice(0, len));

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60) || "item";
const unique = (base: string, taken: (s: string) => boolean) => {
  let s = base;
  for (let i = 2; taken(s); i++) s = `${base}-${i}`;
  return s;
};

async function run(fn: (viewer: Viewer) => string, { adminOnly = false } = {}): Promise<Result> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, error: "Create your free account to continue." };
  if (adminOnly && !viewer.admin) return { ok: false, error: "Only the site admin can do that." };
  try {
    const href = fn(viewer);
    revalidatePath("/", "layout");
    return { ok: true, href };
  } catch (e) {
    if (e instanceof Invalid) return { ok: false, error: e.message };
    console.error(e);
    return { ok: false, error: "Couldn't save. Please try again." };
  }
}

const deny = (msg = "You don't have permission to change this."): never => {
  throw new Invalid(msg);
};

const find = <T,>(list: T[], pred: (x: T) => boolean, what: string) => {
  const x = list.find(pred);
  if (!x) throw new Invalid(`That ${what} no longer exists.`);
  return x;
};

/* ------------------------------ Profiles ------------------------------ */

const PRIVACY = ["public", "club", "private"] as const satisfies readonly Privacy[];

const parseProfile = (input: Record<string, unknown>) => ({
  name: text(input.name, "Name", { max: 60 }),
  city: city(input.city, false),
  portrait: image(input.portrait, "Profile photo")!,
  bio: text(input.bio, "Bio", { max: 280, required: false }),
  privacy: oneOf(input.privacy, PRIVACY, "privacy"),
  instagram: handleText(input.instagram),
});
const profileHref = (handle: string, privacy: Privacy) => (privacy === "private" ? "/studio?tab=manage" : `/owners/${handle}`);

/** Admin-managed profiles (members get theirs automatically when they sign up). */
export async function createProfile(input: Record<string, unknown>) {
  return run(() => {
    const rec = parseProfile(input);
    return mutate((db) => {
      const handle = unique(slugify(rec.name), (h) => db.owners.some((o) => o.handle === h));
      db.owners.push({ handle, ...rec, joined: new Date().toISOString().slice(0, 10), clubs: [], followers: 0, following: 0 });
      return profileHref(handle, rec.privacy);
    });
  }, { adminOnly: true });
}

export async function updateProfile(handle: string, input: Record<string, unknown>) {
  return run((viewer) => {
    const rec = parseProfile(input);
    return mutate((db) => {
      const o = find(db.owners, (x) => x.handle === handle, "profile");
      if (!canEditProfile(o, viewer)) deny();
      Object.assign(o, rec);
      const u = o.userId ? db.users.find((x) => x.id === o.userId) : undefined;
      if (u) u.name = rec.name;
      // Vehicles follow their owner's city.
      db.vehicles.forEach((v) => v.owner === handle && (v.city = rec.city));
      return profileHref(handle, rec.privacy);
    });
  });
}

/* ------------------------------ Vehicles ------------------------------ */

const CAR_CLASSES = ["Supercar", "Performance", "Sleeper", "Luxury", "JDM", "Classic", "Off-road", "Street"] as const satisfies readonly VehicleClass[];
const BIKE_CLASSES = ["Superbike", "Cruiser", "Street", "Off-road", "Classic"] as const satisfies readonly VehicleClass[];

const VISIBILITY = ["public", "club", "followers", "private"] as const satisfies readonly Visibility[];

function parseVehicle(input: Record<string, unknown>, db: Db, viewer: Viewer) {
  const kind = oneOf(input.kind, ["car", "bike"] as const satisfies readonly VehicleKind[], "car or bike");
  const cover = image(input.image, "Main photo")!;
  // Members always add to their own garage; the site admin may pick any profile.
  const ownerHandle = viewer.admin && input.owner ? input.owner : viewer.handle;
  if (!ownerHandle) deny("Log in to your account to add a vehicle to your garage.");
  const owner = find(db.owners, (o) => o.handle === ownerHandle, "owner (create a profile first)");
  const club = input.club ? find(db.clubs, (c) => c.slug === input.club, "club") : undefined;
  if (club && !viewer.admin && !isClubMember(db, club.slug, viewer) && !isClubAdmin(db, club, viewer)) deny("You can only list a vehicle in a club you're a member of.");
  if (!viewer.admin && !garageKinds(viewer.capabilities).includes(kind))
    deny(kind === "bike" ? "Adding bikes needs the Superbike owner or Custom mods capability — add it in My account → What describes you." : "Adding cars needs the Supercar owner or Custom mods capability — add it in My account → What describes you.");
  const visibility = input.visibility ? oneOf(input.visibility, VISIBILITY, "who can see this vehicle") : "public";
  if (visibility === "club" && !club) deny("Choose a club, or pick another \"who can see this vehicle\" option.");
  return {
    owner,
    club,
    rec: {
      visibility,
      ownerHidden: input.ownerHidden === true,
      kind,
      class: oneOf(input.class, kind === "car" ? CAR_CLASSES : BIKE_CLASSES, "class"),
      make: text(input.make, "Make", { max: 40 }),
      model: text(input.model, "Model", { max: 60 }),
      variant: optText(input.variant, "Variant", 40),
      year: num(input.year, "Year", { min: 1900, max: new Date().getFullYear() + 1 }),
      colour: text(input.colour, "Colour", { max: 40, required: false }),
      image: cover,
      gallery: [cover, ...images(input.gallery, "Gallery").filter((g) => g !== cover)],
      owner: owner.handle,
      club: club?.slug,
      city: owner.city,
      mods: lines(input.mods, 30),
      spec: {
        engine: text(input.engine, "Engine", { max: 60 }),
        power: num(input.power, "Power (hp)", { min: 1, max: 3000, required: true })!,
        torque: num(input.torque, "Torque (Nm)", { max: 3000 }) ?? 0,
        transmission: optText(input.transmission, "Transmission", 40),
        drivetrain: text(input.drivetrain, "Drivetrain", { max: 20 }),
        zeroToHundred: num(input.zeroToHundred, "0–100 km/h", { min: 1, max: 30 }),
        topSpeed: num(input.topSpeed, "Top speed", { min: 20, max: 500 }),
      },
    },
  };
}

export async function createVehicle(input: Record<string, unknown>) {
  return run((viewer) =>
    mutate((db) => {
      const { owner, club, rec } = parseVehicle(input, db, viewer);
      const serial = db.vehicles.reduce((m, v) => Math.max(m, v.serial), 0) + 1;
      const slug = unique(`${slugify(`${rec.make} ${rec.model}`)}-${String(serial).padStart(3, "0")}`, (s) => db.vehicles.some((v) => v.slug === s));
      db.vehicles.push({ slug, serial, ...rec, history: [], events: [], featured: true, createdAt: new Date().toISOString() });
      if (club && !owner.clubs.includes(club.slug)) owner.clubs.push(club.slug);
      return `/vehicles/${slug}`;
    }),
  );
}

export async function updateVehicle(slug: string, input: Record<string, unknown>) {
  return run((viewer) =>
    mutate((db) => {
      const v = find(db.vehicles, (x) => x.slug === slug, "vehicle");
      if (!canEditVehicle(v, viewer)) deny();
      const { owner, club, rec } = parseVehicle(viewer.admin ? input : { ...input, owner: v.owner }, db, viewer.admin ? viewer : { ...viewer, handle: v.owner });
      Object.assign(v, rec);
      if (club && !owner.clubs.includes(club.slug)) owner.clubs.push(club.slug);
      return `/vehicles/${slug}`;
    }),
  );
}

/* ------------------------------ Clubs ------------------------------ */

const CLUB_CATEGORIES = ["Supercar", "Superbike", "Car", "Bike", "Modification", "Classic", "JDM", "Performance"] as const satisfies readonly ClubCategory[];

function parseClub(input: Record<string, unknown>) {
  const name = text(input.name, "Club name", { max: 60 });
  return {
    name,
    short: name
      .split(/\s+/)
      .map((w) => w[0])
      .join("")
      .slice(0, 3)
      .toUpperCase(),
    logo: image(input.logo, "Logo", false),
    tagline: optText(input.tagline, "Tagline", 90),
    category: oneOf(input.category, CLUB_CATEGORIES, "category"),
    kind: oneOf(input.kind, ["car", "bike", "mixed"] as const, "vehicle type"),
    city: city(input.city),
    founded: num(input.founded, "Founded", { min: 1900, max: new Date().getFullYear() }),
    hero: image(input.hero, "Cover photo")!,
    about: text(input.about, "About", { max: 800 }),
    members: num(input.members, "Members", { max: 100000 }) ?? 0,
    vehicles: num(input.vehicles, "Vehicles", { max: 100000 }) ?? 0,
    membersPlus: input.membersPlus === true,
    vehiclesPlus: input.vehiclesPlus === true,
    socials: { instagram: handleText(input.instagram), website: url(input.website, "Website") },
    joinPolicy: input.joinPolicy === "open" ? ("open" as const) : ("approval" as const),
    isPrivate: input.isPrivate === true,
  };
}

export async function createClub(input: Record<string, unknown>) {
  return run((viewer) => {
    if (!viewer.admin && !canCreateClub(viewer.capabilities)) deny("Creating a club needs the Club organizer capability — add it in My account → What describes you.");
    const rec = parseClub(input);
    return mutate((db) => {
      const slug = unique(slugify(rec.name), (s) => db.clubs.some((c) => c.slug === s));
      const now = new Date().toISOString();
      // The creator becomes the club's admin (a club is its own entity, not the person).
      db.clubs.push({ slug, ...rec, verified: false, gallery: [], admins: viewer.id ? [viewer.id] : [], followers: 0, createdBy: viewer.id ?? undefined, createdAt: now });
      if (viewer.id) {
        db.memberships.push({ id: newId(), club: slug, userId: viewer.id, role: "admin", status: "approved", createdAt: now });
        grantCapability(db, viewer.id, "club-member");
      }
      return `/clubs/${slug}`;
    });
  });
}

export async function updateClub(slug: string, input: Record<string, unknown>) {
  return run((viewer) => {
    const rec = parseClub(input);
    return mutate((db) => {
      const club = find(db.clubs, (c) => c.slug === slug, "club");
      if (!isClubAdmin(db, club, viewer)) deny("Only club admins can edit the club.");
      Object.assign(club, rec);
      return `/clubs/${slug}`;
    });
  });
}

/* ------------------------------ Events ------------------------------ */

const EVENT_CATEGORIES = ["Meetup", "Drive", "Ride", "Road Trip", "Track Day", "Modification Meet", "Exhibition", "Launch", "Brand Experience", "Community"] as const satisfies readonly EventCategory[];
const STOP_KINDS = ["start", "fuel", "food", "scenic", "photo", "end"] as const satisfies readonly StopKind[];
const ROUTED: EventCategory[] = ["Drive", "Ride", "Road Trip"];

function parseEvent(input: Record<string, unknown>, db: Db) {
  const title = text(input.title, "Title", { max: 80 });
  const category = oneOf(input.category, EVENT_CATEGORIES, "category");
  const date = text(input.date, "Date", { max: 10 });
  const start = text(input.start, "Start time", { max: 5 });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(start)) throw new Invalid("Enter a valid date and start time.");
  const end = optText(input.end, "End time", 5);
  if (end && !/^\d{2}:\d{2}$/.test(end)) throw new Invalid("Enter a valid end time.");
  const tickets = (Array.isArray(input.tickets) ? input.tickets : []).slice(0, 8).map((t: Record<string, unknown>, i) => ({
    id: `t${i + 1}`,
    name: text(t.name, "Ticket name", { max: 40 }),
    price: num(t.price, "Ticket price", { max: 500000 }) ?? 0,
    total: t.limited ? num(t.slots, "Slots", { min: 1, max: 100000, required: true }) : undefined,
    sold: 0,
    perks: String(t.perks ?? "")
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean)
      .slice(0, 8),
  }));
  if (!tickets.length) throw new Invalid("Add at least one ticket type (it can be free).");
  // Hosted by a club (its admins only) or organised personally — "" / "me".
  const host = input.host && input.host !== "me" ? find(db.clubs, (c) => c.slug === input.host, "host club") : undefined;
  const kind = oneOf(input.kind, ["car", "bike", "mixed"] as const, "vehicle type");
  const cityRec = city(input.city);
  const r = input.route as Record<string, unknown> | undefined;
  const route =
    r && ROUTED.includes(category)
      ? {
          from: text(r.from, "Route start", { max: 80 }),
          to: text(r.to, "Route end", { max: 80 }),
          distanceKm: num(r.distance, "Distance", { max: 5000 }),
          durationMin: num(r.duration, "Duration", { max: 10000 }),
          stops: (Array.isArray(r.stops) ? r.stops : []).slice(0, 20).map((s: Record<string, unknown>) => ({
            name: text(s.name, "Stop name", { max: 80 }),
            kind: oneOf(s.kind, STOP_KINDS, "stop type"),
            km: num(s.km, "Stop distance", { max: 5000 }),
            note: optText(s.note, "Stop note", 80),
          })),
        }
      : undefined;
  return {
    host,
    route,
    rec: {
      title,
      category,
      kind,
      cover: image(input.cover, "Cover photo")!,
      city: cityRec,
      date: `${date}T${start}:00+05:30`,
      endTime: end,
      venue: text(input.venue, "Meeting point / venue", { max: 120 }),
      summary: text(input.summary, "About the event", { max: 1000 }),
      rules: lines(input.rules, 20),
      tickets,
      organizer: host?.slug,
      status: input.status === "draft" ? ("draft" as const) : ("published" as const),
    },
  };
}

/** Replaces an event's route (routes belong to their event). */
function saveRoute(db: Db, old: string | undefined, route: ReturnType<typeof parseEvent>["route"], ev: { cover: string; summary: string; city: string; kind: "car" | "bike" | "mixed" }) {
  if (old) db.routes = db.routes.filter((x) => x.slug !== old);
  if (!route) return undefined;
  const slug = unique(slugify(`${route.from} ${route.to}`), (s) => db.routes.some((x) => x.slug === s));
  db.routes.push({
    slug,
    from: route.from,
    to: route.to,
    state: cities.find((c) => c.slug === ev.city)?.state ?? "",
    distanceKm: route.distanceKm,
    durationMin: route.durationMin,
    cover: ev.cover,
    gallery: [],
    summary: ev.summary,
    stops: [{ name: route.from, kind: "start" as const }, ...route.stops, { name: route.to, kind: "end" as const }],
    suitedFor: ev.kind,
  });
  return slug;
}

export async function createEvent(input: Record<string, unknown>) {
  return run((viewer) =>
    mutate((db) => {
      if (!viewer.admin && !canCreateEvent(viewer.capabilities)) deny("Creating events needs the Event organizer or Club organizer capability — add it in My account → What describes you.");
      const { host, route, rec } = parseEvent(input, db);
      if (host && !isClubAdmin(db, host, viewer)) deny("Only this club's admins can host events for it — organise it personally instead.");
      if (!host && !viewer.id) deny("Log in to your account to organise an event.");
      const slug = unique(`${slugify(rec.title)}-${rec.date.slice(0, 10)}`, (s) => db.events.some((e) => e.slug === s));
      db.events.push({ slug, ...rec, route: saveRoute(db, undefined, route, rec), participants: 0, sponsors: [], attendingVehicles: [], createdBy: viewer.id ?? undefined, createdAt: new Date().toISOString() });
      if (host) host.eventsHosted = (host.eventsHosted ?? 0) + 1;
      return `/events/${slug}`;
    }),
  );
}

export async function updateEvent(slug: string, input: Record<string, unknown>) {
  return run((viewer) =>
    mutate((db) => {
      const e = find(db.events, (x) => x.slug === slug, "event");
      if (!canManageEvent(db, e, viewer)) deny("Only the organiser can edit this event.");
      const { host, route, rec } = parseEvent(input, db);
      if (host && host.slug !== e.organizer && !isClubAdmin(db, host, viewer)) deny("Only this club's admins can host events for it.");
      // Keep tickets already sold on ticket types that still exist.
      rec.tickets.forEach((t, i) => (t.sold = Math.min(e.tickets[i]?.sold ?? 0, t.total ?? Infinity)));
      if (e.organizer !== host?.slug) {
        const prev = db.clubs.find((c) => c.slug === e.organizer);
        if (prev?.eventsHosted) prev.eventsHosted--;
        if (host) host.eventsHosted = (host.eventsHosted ?? 0) + 1;
      }
      Object.assign(e, rec, { route: saveRoute(db, e.route, route, rec) });
      return `/events/${slug}`;
    }),
  );
}

/* ------------------------------ Businesses ------------------------------ */

const BUSINESS_CATEGORIES = ["Detailing", "PPF", "Ceramic Coating", "Performance Tuning", "Modification", "Servicing", "Luxury Dealership", "Supercar Rental", "Photography", "Insurance", "Accessories", "Workshop"] as const satisfies readonly BusinessCategory[];

function parseBusiness(input: Record<string, unknown>) {
  const cats = (Array.isArray(input.categories) ? input.categories : []).map((c) => oneOf(c, BUSINESS_CATEGORIES, "category"));
  if (!cats.length) throw new Invalid("Choose at least one category.");
  const phone = text(input.phone, "Phone", { max: 20 });
  if (!/^[+\d][\d\s-]{6,}$/.test(phone)) throw new Invalid("Enter a valid phone number.");
  const email = optText(input.email, "Email", 80);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Invalid("Enter a valid email.");
  return {
    name: text(input.name, "Business name", { max: 60 }),
    categories: cats,
    city: city(input.city),
    area: text(input.area, "Area", { max: 80 }),
    cover: image(input.cover, "Cover photo")!,
    gallery: images(input.gallery, "Gallery"),
    about: text(input.about, "About", { max: 800 }),
    services: (Array.isArray(input.services) ? input.services : []).slice(0, 20).map((s: Record<string, unknown>) => ({ name: text(s.name, "Service name", { max: 60 }), from: num(s.from, "Service price", { max: 10000000 }) ?? 0 })),
    phone,
    email,
    website: url(input.website, "Website"),
    instagram: handleText(input.instagram),
    hours: optText(input.hours, "Hours", 80),
  };
}

export async function createBusiness(input: Record<string, unknown>) {
  return run((viewer) => {
    if (!viewer.admin && !canCreateBusiness(viewer.capabilities)) deny("Listing a business needs the Automotive business capability — add it in My account → What describes you.");
    const rec = parseBusiness(input);
    return mutate((db) => {
      const slug = unique(slugify(rec.name), (s) => db.businesses.some((b) => b.slug === s));
      // Managed from the person's own account — the business profile stays separate.
      db.businesses.push({ slug, ...rec, verified: false, rating: 0, reviewCount: 0, workedOn: [], reviews: [], ownerUserId: viewer.id ?? undefined, createdAt: new Date().toISOString() });
      return `/businesses/${slug}`;
    });
  });
}

export async function updateBusiness(slug: string, input: Record<string, unknown>) {
  return run((viewer) => {
    const rec = parseBusiness(input);
    return mutate((db) => {
      const b = find(db.businesses, (x) => x.slug === slug, "business");
      if (!canManageBusiness(b, viewer)) deny("Only the business's manager can edit it.");
      Object.assign(b, rec);
      return `/businesses/${slug}`;
    });
  });
}

/* ------------------------------------------------------------------ */

export type ItemKind = "owner" | "vehicle" | "club" | "event" | "business";

/** Deletes one record and anything that only made sense with it. */
export async function deleteItem(kind: ItemKind, id: string) {
  return run((viewer) =>
    mutate((db) => {
      // Permission: owner / club admin / organiser / manager — profiles only by the site admin.
      const allowed =
        viewer.admin ||
        (kind === "vehicle" && !!db.vehicles.find((v) => v.slug === id && canEditVehicle(v, viewer))) ||
        (kind === "club" && !!db.clubs.find((c) => c.slug === id && isClubAdmin(db, c, viewer))) ||
        (kind === "event" && !!db.events.find((e) => e.slug === id && canManageEvent(db, e, viewer))) ||
        (kind === "business" && !!db.businesses.find((b) => b.slug === id && canManageBusiness(b, viewer)));
      if (!allowed) deny();
      if (kind === "owner") {
        db.owners = db.owners.filter((o) => o.handle !== id);
        db.vehicles = db.vehicles.filter((v) => v.owner !== id);
      } else if (kind === "vehicle") db.vehicles = db.vehicles.filter((v) => v.slug !== id);
      else if (kind === "club") {
        db.clubs = db.clubs.filter((c) => c.slug !== id);
        const gone = db.events.filter((e) => e.organizer === id);
        db.events = db.events.filter((e) => e.organizer !== id);
        db.registrations = db.registrations.filter((r) => !gone.some((e) => e.slug === r.event));
        db.routes = db.routes.filter((r) => !gone.some((e) => e.route === r.slug));
        db.vehicles.forEach((v) => v.club === id && (v.club = undefined));
        db.owners.forEach((o) => (o.clubs = o.clubs.filter((c) => c !== id)));
        db.memberships = db.memberships.filter((m) => m.club !== id);
      } else if (kind === "event") {
        const e = db.events.find((x) => x.slug === id);
        db.events = db.events.filter((x) => x.slug !== id);
        db.registrations = db.registrations.filter((r) => r.event !== id);
        if (e?.route) db.routes = db.routes.filter((r) => r.slug !== e.route);
      } else if (kind === "business") db.businesses = db.businesses.filter((b) => b.slug !== id);
      return viewer.admin ? "/studio?tab=manage" : "/me";
    }),
  );
}

/** Wipes every record and uploaded photo (site admin only). */
export async function resetAll() {
  return run(
    () => {
      resetDb();
      return "/studio";
    },
    { adminOnly: true },
  );
}
