// Select-box options for the create / edit forms (server side).
import type { Viewer } from "./auth";
import { cities } from "./data/geo";
import { isClubAdmin, isClubMember } from "./permissions";
import { readDb } from "./store";

export const cityOptions = () => cities.map((c) => ({ value: c.slug, label: c.name })).sort((a, b) => a.label.localeCompare(b.label));

/** Clubs a vehicle can be listed in: ones the person belongs to (site admin: all). */
export function myClubOptions(viewer: Viewer) {
  const db = readDb();
  return db.clubs.filter((c) => viewer.admin || isClubMember(db, c.slug, viewer) || isClubAdmin(db, c, viewer)).map((c) => ({ value: c.slug, label: c.name }));
}

/** Who can host an event: yourself, or a club you're an admin of. */
export function hostOptions(viewer: Viewer, city: string) {
  const db = readDb();
  const clubs = db.clubs.filter((c) => isClubAdmin(db, c, viewer)).map((c) => ({ slug: c.slug, name: `${c.name} (club event)`, city: c.city }));
  return [...(viewer.id ? [{ slug: "me", name: "Myself — personal event", city: city || "indore" }] : []), ...clubs];
}
