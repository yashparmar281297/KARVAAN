// Turns "kind:id" keys (from follows / likes / saves) into something to show:
// title, subtitle, image and link — with privacy applied.
import { cityName, getBusiness, getClub, getEvent, getOwner, getVehicle, presentOwner } from "./data";

export interface Resolved {
  key: string;
  kind: string;
  title: string;
  subtitle: string;
  image?: string;
  href?: string;
}

const KIND_LABEL: Record<string, string> = { owner: "Person", club: "Club", vehicle: "Vehicle", business: "Business", event: "Event", image: "Photo", brand: "Brand" };
export const kindLabel = (k: string) => KIND_LABEL[k] ?? k;

export function resolveKey(key: string): Resolved | null {
  const i = key.indexOf(":");
  const kind = key.slice(0, i);
  const id = key.slice(i + 1);
  switch (kind) {
    case "owner": {
      const o = getOwner(id);
      if (!o) return null;
      const v = presentOwner(o);
      return { key, kind, title: v.name, subtitle: v.location, image: v.portrait ?? "/media/avatar.svg", href: v.href ?? undefined };
    }
    case "club": {
      const c = getClub(id);
      return c ? { key, kind, title: c.name, subtitle: `${c.category} club · ${cityName(c.city)}`, image: c.logo ?? c.hero, href: `/clubs/${c.slug}` } : null;
    }
    case "vehicle": {
      const v = getVehicle(id);
      return v ? { key, kind, title: `${v.make} ${v.model}`, subtitle: [v.year, v.class].filter(Boolean).join(" · "), image: v.image, href: `/vehicles/${v.slug}` } : null;
    }
    case "business": {
      const b = getBusiness(id);
      return b ? { key, kind, title: b.name, subtitle: b.categories[0], image: b.cover, href: `/businesses/${b.slug}` } : null;
    }
    case "event": {
      const e = getEvent(id);
      return e ? { key, kind, title: e.title, subtitle: `${e.category} · ${e.date.slice(0, 10)}`, image: e.cover, href: `/events/${e.slug}` } : null;
    }
    case "image":
      return { key, kind, title: "Photo", subtitle: "Liked photo", image: id };
    default:
      return null;
  }
}

export const resolveKeys = (keys: string[]) => keys.map(resolveKey).filter((x): x is Resolved => !!x);
