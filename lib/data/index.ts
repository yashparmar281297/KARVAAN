// Query layer. Every page reads through these functions, never the raw
// arrays, so moving to Supabase means reimplementing this file only.
import { cities, states } from "./geo";
import { live } from "./source";
import { hasGarage } from "../capabilities";
import type { Club, Event, Owner, Privacy, SearchKind, SearchResult, Vehicle } from "../types";

// Live views of the test database (see lib/store.ts). Always current.
export const owners = live("owners");
// Public views. Non-public vehicles (club / followers / private) and draft
// events are left out here — pages that may show them to the right people read
// the full lists (allVehicles / allEvents) and check lib/permissions.
export const vehicles = live("vehicles", (v) => (v.visibility ?? "public") === "public");
export const allVehicles = live("vehicles");
export const clubs = live("clubs");
export const events = live("events", (e) => (e.status ?? "published") === "published");
export const allEvents = live("events");
export const routes = live("routes");
export const businesses = live("businesses");
export const brands = live("brands");
export const registrations = live("registrations");
// Accounts are server-only and never exported (they hold password hashes).
const users = live("users");
export { cities, states };

const by = <T, K extends keyof T>(list: T[], key: K) => (value: T[K]) => list.find((x) => x[key] === value);

export const getVehicle = by(vehicles, "slug");
export const getOwner = by(owners, "handle");
export const getClub = by(clubs, "slug");
export const getEvent = by(events, "slug");
/** Any vehicle / event, whatever its visibility — check lib/permissions before showing it. */
export const getAnyVehicle = by(allVehicles, "slug");
export const getAnyEvent = by(allEvents, "slug");
export const getRoute = by(routes, "slug");
export const getBusiness = by(businesses, "slug");
export const getBrand = by(brands, "slug");
export const getCity = by(cities, "slug");
export const getState = by(states, "code");

export const cityName = (slug: string) => getCity(slug)?.name ?? slug;
export const cityLine = (slug: string) => {
  const c = getCity(slug);
  if (!c) return slug;
  const state = getState(c.state)?.name ?? c.state;
  return state === c.name ? c.name : `${c.name} · ${state}`;
};

export const vehiclesByOwner = (handle: string) => vehicles.filter((v) => v.owner === handle);

/**
 * Is this profile an OWNER? Only accounts made as supercar / superbike /
 * custom-mod owners (or anyone with a public vehicle). Enthusiasts, clubs,
 * organisers and businesses are never listed as owners.
 */
export function isOwnerProfile(o: Owner) {
  const u = o.userId ? users.find((x) => x.id === o.userId) : undefined;
  if (u && hasGarage(u.capabilities)) return true;
  return vehicles.some((v) => v.owner === o.handle && !v.ownerHidden);
}
export const vehiclesByClub = (slug: string) => vehicles.filter((v) => v.club === slug);
export const ownersByClub = (slug: string) => owners.filter((o) => o.clubs.includes(slug));
export const eventsByClub = (slug: string) => events.filter((e) => e.organizer === slug);
/** Routes aren't standalone — each belongs to the Drive/Ride event that created it. */
export const eventForRoute = (slug: string) => events.find((e) => e.route === slug);

/**
 * Who puts an event on: always a person (the organiser), optionally for a club.
 * `name`/`href` are what to show — the club when there is one, else the person
 * (private profiles show as "KARVAAN member").
 */
export function eventHost(e: Event) {
  const club = e.organizer ? getClub(e.organizer) : undefined;
  const user = e.createdBy ? users.find((u) => u.id === e.createdBy) : undefined;
  const person = user ? getOwner(user.handle) : undefined;
  const personPublic = person && person.privacy === "public";
  const personName = personPublic ? person.name : person ? "KARVAAN member" : undefined;
  return {
    club,
    person: personPublic ? person : undefined,
    personName,
    name: club?.name ?? personName ?? "KARVAAN",
    href: club ? `/clubs/${club.slug}` : personPublic ? `/owners/${person.handle}` : undefined,
  };
}

/** Public view of who's coming: first name + last initial only — never contact details. */
export const attendeesOf = (slug: string) =>
  registrations
    .filter((r) => r.event === slug)
    .map((r) => {
      const [first, ...rest] = r.name.trim().split(/\s+/);
      const last = rest.at(-1);
      return { key: r.id, name: last ? `${first} ${last[0].toUpperCase()}.` : first, qty: r.tickets.reduce((n, t) => n + t.qty, 0) };
    });

export const upcomingEvents = () => [...events].sort((a, b) => a.date.localeCompare(b.date));
export const featuredVehicles = () => vehicles.filter((v) => v.featured);

/**
 * Slot capacity across an event's limited ticket types. Tickets without a
 * `total` are open entry, so an event may have no capacity limit at all.
 */
export const capacity = (e: Event) => {
  const limited = e.tickets.filter((t) => t.total !== undefined);
  const total = limited.reduce((n, t) => n + (t.total ?? 0), 0);
  const sold = limited.reduce((n, t) => n + t.sold, 0);
  return { limited: limited.length > 0, openEntry: limited.length < e.tickets.length, total, left: total - sold, soldPct: total ? Math.round((sold / total) * 100) : 0 };
};
export const ticketLeft = (t: { total?: number; sold: number }) => (t.total === undefined ? Infinity : t.total - t.sold);
export const fromPrice = (e: Event) => Math.min(...e.tickets.map((t) => t.price));

export const clubSponsor = (c: Club) => (c.sponsor ? getBrand(c.sponsor) : undefined);
/** Headline counters for a club; omits figures we don't have. */
export const clubStats = (c: Club): [string, string][] => [
  ["Members", `${c.members}${c.membersPlus ? "+" : ""}`],
  ["Vehicles", `${c.vehicles}${c.vehiclesPlus ? "+" : ""}`],
  ...(c.eventsHosted !== undefined ? ([["Events", String(c.eventsHosted)]] as [string, string][]) : []),
];


/* ------------------------------------------------------------------ */
/* Privacy                                                             */
/* ------------------------------------------------------------------ */

export interface OwnerView {
  privacy: Privacy;
  /** false when the viewer isn't allowed to see who this is. */
  revealed: boolean;
  name: string;
  portrait: string | null;
  location: string;
  href: string | null;
}

/**
 * Projects an owner through their privacy setting. PUBLIC shows everything;
 * CLUB ONLY reveals identity only to fellow club members; PRIVATE never
 * reveals identity, portrait, exact city or contact details — only the
 * state-level region.
 */
export function presentOwner(owner: Owner, viewerClubs: string[] = []): OwnerView {
  const city = getCity(owner.city);
  const region = city ? getState(city.state)?.name ?? "India" : "India";
  if (owner.privacy === "private") {
    return { privacy: "private", revealed: false, name: "Private Owner", portrait: null, location: region, href: null };
  }
  if (owner.privacy === "club" && !owner.clubs.some((c) => viewerClubs.includes(c))) {
    const initials = owner.name
      .split(" ")
      .map((p) => p[0] + ".")
      .join(" ");
    return { privacy: "club", revealed: false, name: initials, portrait: null, location: city?.name ?? region, href: null };
  }
  return {
    privacy: owner.privacy,
    revealed: true,
    name: owner.name,
    portrait: owner.portrait,
    location: city ? `${city.name}, India` : "India",
    href: `/owners/${owner.handle}`,
  };
}

export const ownerViewFor = (v: Vehicle, viewerClubs: string[] = []) => {
  const o = getOwner(v.owner);
  if (!o) return null;
  // The owner chose not to be linked to this vehicle publicly.
  if (v.ownerHidden) return presentOwner({ ...o, privacy: "private" }, viewerClubs);
  return presentOwner(o, viewerClubs);
};

/**
 * Strips identifying fields before a vehicle is serialised to the client:
 * hidden owners lose their handle (it's their name), private owners also
 * lose the exact city.
 */
export function redactVehicle(v: Vehicle, owner: OwnerView | null): Vehicle {
  if (!owner || owner.revealed) return v;
  return { ...v, owner: "", city: owner.privacy === "private" ? "" : v.city };
}

/** Everything a VehicleCard needs, resolved server-side (privacy applied). */
export const cardProps = (v: Vehicle, viewerClubs: string[] = []) => {
  const owner = ownerViewFor(v, viewerClubs);
  return {
    v: redactVehicle(v, owner),
    owner,
    clubName: v.club ? getClub(v.club)?.name : undefined,
    // Private owners never expose their city — the plate collapses to the state code.
    rto: owner?.privacy === "private" ? getCity(v.city)?.state ?? "IND" : getCity(v.city)?.rto ?? "IND",
    garageCount: owner?.revealed ? vehiclesByOwner(v.owner).length : undefined,
  };
};

/* ------------------------------------------------------------------ */
/* Search                                                              */
/* ------------------------------------------------------------------ */

const CITY_ALIASES: Record<string, string> = {
  bangalore: "bengaluru",
  bombay: "mumbai",
  gurgaon: "gurugram",
  ncr: "delhi",
  goa: "panaji",
  cochin: "kochi",
  "new delhi": "delhi",
};

const KIND_WORDS: Record<string, SearchKind[]> = {
  club: ["club"],
  clubs: ["club"],
  society: ["club"],
  event: ["event"],
  events: ["event"],
  meet: ["event"],
  meets: ["event"],
  meetup: ["event"],
  drive: ["event"],
  drives: ["event"],
  ride: ["event"],
  rides: ["event"],
  track: ["event"],
  owner: ["owner", "vehicle"],
  owners: ["owner", "vehicle"],
  modification: ["business", "club"],
  tuning: ["business"],
  detailing: ["business"],
  ppf: ["business"],
  ceramic: ["business"],
  rental: ["business"],
  rentals: ["business"],
  dealership: ["business"],
  workshop: ["business"],
  photography: ["business"],
};

const STOP = new Set(["in", "the", "a", "of", "near", "for", "and", "at", "to", "with", "me"]);

export interface ParsedQuery {
  city?: string;
  kinds: SearchKind[];
  vehicleKind?: "car" | "bike";
  terms: string[];
}

export function parseQuery(q: string): ParsedQuery {
  let text = ` ${q.toLowerCase().trim()} `;
  let city: string | undefined;
  for (const [alias, slug] of Object.entries(CITY_ALIASES)) {
    if (text.includes(` ${alias} `)) {
      city = slug;
      text = text.replace(` ${alias} `, " ");
    }
  }
  for (const c of cities) {
    const n = c.name.toLowerCase();
    if (text.includes(` ${n} `)) {
      city = c.slug;
      text = text.replace(` ${n} `, " ");
    }
  }
  const words = text.split(/\s+/).filter((w) => w && !STOP.has(w));
  const kinds = new Set<SearchKind>();
  let vehicleKind: "car" | "bike" | undefined;
  const terms: string[] = [];
  for (const w of words) {
    if (KIND_WORDS[w]) KIND_WORDS[w].forEach((k) => kinds.add(k));
    if (["bike", "bikes", "superbike", "superbikes", "rider", "riders", "motorcycle"].includes(w)) vehicleKind = "bike";
    if (["car", "cars", "supercar", "supercars"].includes(w)) vehicleKind = "car";
    // category words are also useful search terms ("supercar clubs", "jdm")
    if (!KIND_WORDS[w] || ["modification", "tuning", "detailing", "ppf", "ceramic", "track", "photography"].includes(w)) {
      terms.push(w.replace(/s$/, ""));
    }
  }
  return { city, kinds: [...kinds], vehicleKind, terms };
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

function scoreText(hay: string, terms: string[]) {
  const h = norm(hay);
  let s = 0;
  for (const t of terms) {
    const tt = norm(t);
    if (!tt) continue;
    if (h.includes(` ${tt}`) || h.startsWith(tt)) s += 3;
    else if (h.includes(tt)) s += 1.5;
  }
  return s;
}

export function search(q: string, limit = 24): SearchResult[] {
  const p = parseQuery(q);
  if (!p.terms.length && !p.city && !p.kinds.length) return [];
  const wants = (k: SearchKind) => !p.kinds.length || p.kinds.includes(k);
  const cityOk = (slug: string) => !p.city || slug === p.city;
  const kindOk = (k: "car" | "bike" | "mixed") => !p.vehicleKind || k === "mixed" || k === p.vehicleKind;
  const base = (terms: number) => (p.terms.length ? terms : 1);
  const out: SearchResult[] = [];

  if (wants("vehicle"))
    for (const v of vehicles) {
      if (!cityOk(v.city) || !kindOk(v.kind)) continue;
      const s = base(scoreText(` ${v.make} ${v.model} ${v.variant ?? ""} ${v.class} ${v.kind} ${v.colour} ${v.spec.engine}`, p.terms));
      if (s > 0) out.push({ kind: "vehicle", href: `/vehicles/${v.slug}`, title: `${v.make} ${v.model}`, subtitle: [v.year, cityName(v.city), `${v.spec.power.toLocaleString("en-IN")}${v.spec.powerPlus ? "+" : ""} HP`].filter(Boolean).join(" · "), image: v.image, score: s + 0.5 });
    }
  if (wants("owner"))
    for (const o of owners) {
      if (o.privacy !== "public" || !cityOk(o.city) || !isOwnerProfile(o)) continue;
      const garage = vehiclesByOwner(o.handle);
      if (p.vehicleKind && !garage.some((v) => v.kind === p.vehicleKind)) continue;
      const s = base(scoreText(` ${o.name} ${garage.map((v) => `${v.make} ${v.model} ${v.class}`).join(" ")}`, p.terms));
      if (s > 0) out.push({ kind: "owner", href: `/owners/${o.handle}`, title: o.name, subtitle: [cityName(o.city), `${garage.length} in garage`].filter(Boolean).join(" · "), image: o.portrait, score: s + (p.kinds.includes("owner") ? 2 : 0) });
    }
  if (wants("club"))
    for (const c of clubs) {
      if (!cityOk(c.city) || !kindOk(c.kind)) continue;
      const s = base(scoreText(` ${c.name} ${c.category} ${c.kind === "bike" ? "bike superbike rider" : "car"} club`, p.terms));
      if (s > 0) out.push({ kind: "club", href: `/clubs/${c.slug}`, title: c.name, subtitle: `${c.category} · ${cityName(c.city)} · ${c.members} members`, image: c.hero, score: s + (p.kinds.includes("club") ? 2 : 0) });
    }
  if (wants("event"))
    for (const e of events) {
      if (!cityOk(e.city) || !kindOk(e.kind)) continue;
      const r = e.route ? getRoute(e.route) : undefined;
      const s = base(scoreText(` ${e.title} ${e.category} ${e.venue} ${r ? `${r.from} ${r.to} route drive ride` : ""} ${e.kind === "bike" ? "bike superbike" : e.kind === "car" ? "car supercar" : "car bike"}`, p.terms));
      if (s > 0) out.push({ kind: "event", href: `/events/${e.slug}`, title: e.title, subtitle: `${e.category} · ${cityName(e.city)}`, image: e.cover, score: s + (p.kinds.includes("event") ? 2 : 0) });
    }
  if (wants("business"))
    for (const b of businesses) {
      if (!cityOk(b.city)) continue;
      const s = base(scoreText(` ${b.name} ${b.categories.join(" ")} ${b.area}`, p.terms));
      if (s > 0) out.push({ kind: "business", href: `/businesses/${b.slug}`, title: b.name, subtitle: `${b.categories[0]} · ${cityName(b.city)}`, image: b.cover, score: s + (p.kinds.includes("business") ? 2 : 0) });
    }

  return out.sort((a, b) => b.score - a.score).slice(0, limit);
}

export const SEARCH_EXAMPLES = ["Supercar clubs in Indore", "Superbikes", "Drives this month", "Detailing studios"];
