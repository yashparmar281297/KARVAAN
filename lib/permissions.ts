// Who can see / do what. Pure functions over the database + the viewer, used by
// pages (to filter what's shown) and by server actions (to allow or refuse).
import type { Viewer } from "./auth";
import type { Db } from "./data/source";
import type { Business, Club, Event, Owner, Vehicle } from "./types";

/** The viewer's own profile handle (null when logged out / admin-only). */
const myHandle = (viewer: Viewer | null) => viewer?.handle ?? null;

/* ------------------------------ clubs ------------------------------ */

export function isClubMember(db: Db, club: string, viewer: Viewer | null) {
  if (!viewer?.id) return false;
  if (db.memberships.some((m) => m.club === club && m.userId === viewer.id && m.status === "approved")) return true;
  // Profiles linked to a club before memberships existed.
  const me = db.owners.find((o) => o.handle === viewer.handle);
  return !!me?.clubs.includes(club);
}

export function isClubAdmin(db: Db, club: Club, viewer: Viewer | null) {
  if (!viewer) return false;
  if (viewer.admin) return true;
  if (!viewer.id) return false;
  return club.admins.includes(viewer.id) || db.memberships.some((m) => m.club === club.slug && m.userId === viewer.id && m.status === "approved" && m.role === "admin");
}

export function membershipOf(db: Db, club: string, viewer: Viewer | null) {
  if (!viewer?.id) return undefined;
  return db.memberships.filter((m) => m.club === club && m.userId === viewer.id).at(-1);
}

/** Profiles of a club's members: approved memberships + legacy profile links. */
export function clubMemberProfiles(db: Db, club: string): Owner[] {
  const ids = new Set(db.memberships.filter((m) => m.club === club && m.status === "approved").map((m) => m.userId));
  return db.owners.filter((o) => (o.userId && ids.has(o.userId)) || o.clubs.includes(club));
}

/* ------------------------------ vehicles ------------------------------ */

export function ownsVehicle(v: Vehicle, viewer: Viewer | null) {
  return !!viewer && !!myHandle(viewer) && v.owner === myHandle(viewer);
}

/** Vehicle privacy: Public · Club members · Followers (of the owner) · Private. */
export function canSeeVehicle(db: Db, v: Vehicle, viewer: Viewer | null) {
  const vis = v.visibility ?? "public";
  if (vis === "public") return true;
  if (!viewer) return false;
  if (viewer.admin || ownsVehicle(v, viewer)) return true;
  if (vis === "private") return false;
  if (vis === "club") return !!v.club && isClubMember(db, v.club, viewer);
  if (vis === "followers") return !!viewer.id && db.follows.some((f) => f.userId === viewer.id && f.key === `owner:${v.owner}`);
  return false;
}

export const canEditVehicle = (v: Vehicle, viewer: Viewer | null) => !!viewer && (viewer.admin || ownsVehicle(v, viewer));

/* ------------------------------ events & businesses ------------------------------ */

/** Organiser, an admin of the hosting club, or the site admin. */
export function canManageEvent(db: Db, e: Event, viewer: Viewer | null) {
  if (!viewer) return false;
  if (viewer.admin) return true;
  if (viewer.id && e.createdBy === viewer.id) return true;
  const club = e.organizer ? db.clubs.find((c) => c.slug === e.organizer) : undefined;
  return !!club && isClubAdmin(db, club, viewer);
}

/** Drafts are visible only to the people who manage the event. */
export const canSeeEvent = (db: Db, e: Event, viewer: Viewer | null) => (e.status ?? "published") === "published" || canManageEvent(db, e, viewer);

export const canManageBusiness = (b: Business, viewer: Viewer | null) => !!viewer && (viewer.admin || (!!viewer.id && b.ownerUserId === viewer.id));

export const canEditProfile = (o: Owner, viewer: Viewer | null) => !!viewer && (viewer.admin || (!!viewer.id && o.userId === viewer.id));
