"use server";

import { revalidatePath } from "next/cache";
import { getViewer, grantCapability, newId } from "@/lib/auth";
import { isClubAdmin } from "@/lib/permissions";
import { mutate, readDb } from "@/lib/store";

// Club membership — JOIN is not FOLLOW. Open clubs admit instantly; others send
// a request that a club admin approves or rejects. Admins manage members.

export type ClubResult = { ok: true; status?: string } | { ok: false; error: string; needsLogin?: boolean };

const done = (slug: string) => {
  revalidatePath(`/clubs/${slug}`);
  revalidatePath("/me");
};

export async function joinClub(slug: string, message?: string): Promise<ClubResult> {
  const viewer = await getViewer();
  if (!viewer?.id) return { ok: false, error: "Create your free account to continue.", needsLogin: true };
  const status = mutate((db) => {
    const club = db.clubs.find((c) => c.slug === slug);
    if (!club) throw new Error("gone");
    const existing = db.memberships.find((m) => m.club === slug && m.userId === viewer.id && m.status !== "rejected");
    if (existing) return existing.status;
    const open = (club.joinPolicy ?? "approval") === "open";
    db.memberships = db.memberships.filter((m) => !(m.club === slug && m.userId === viewer.id)); // clear an old rejection
    db.memberships.push({ id: newId(), club: slug, userId: viewer.id!, role: "member", status: open ? "approved" : "pending", message: String(message ?? "").trim().slice(0, 300) || undefined, createdAt: new Date().toISOString() });
    if (open) grantCapability(db, viewer.id, "club-member");
    return open ? "approved" : "pending";
  });
  done(slug);
  return { ok: true, status };
}

/** Leave a club, or withdraw a pending request. */
export async function leaveClub(slug: string): Promise<ClubResult> {
  const viewer = await getViewer();
  if (!viewer?.id) return { ok: false, error: "Please log in." };
  mutate((db) => {
    db.memberships = db.memberships.filter((m) => !(m.club === slug && m.userId === viewer.id));
    const me = db.owners.find((o) => o.userId === viewer.id);
    if (me) me.clubs = me.clubs.filter((c) => c !== slug);
    db.vehicles.forEach((v) => v.owner === me?.handle && v.club === slug && (v.club = undefined));
  });
  done(slug);
  return { ok: true };
}

/** Admin actions on one membership: approve · reject · remove · make-admin · remove-admin. */
export async function manageMember(slug: string, membershipId: string, action: "approve" | "reject" | "remove" | "make-admin" | "remove-admin"): Promise<ClubResult> {
  const viewer = await getViewer();
  const club = readDb().clubs.find((c) => c.slug === slug);
  if (!club || !isClubAdmin(readDb(), club, viewer)) return { ok: false, error: "Only club admins can do that." };
  try {
    mutate((db) => {
      const m = db.memberships.find((x) => x.id === membershipId && x.club === slug);
      const c = db.clubs.find((x) => x.slug === slug)!;
      if (!m) throw new Error("gone");
      if (action === "approve") {
        m.status = "approved";
        grantCapability(db, m.userId, "club-member");
      } else if (action === "reject") m.status = "rejected";
      else if (action === "remove") {
        if (c.admins.includes(m.userId) && c.admins.length === 1) throw new Error("last-admin");
        db.memberships = db.memberships.filter((x) => x.id !== m.id);
        c.admins = c.admins.filter((a) => a !== m.userId);
        const owner = db.owners.find((o) => o.userId === m.userId);
        db.vehicles.forEach((v) => v.owner === owner?.handle && v.club === slug && (v.club = undefined));
      } else if (action === "make-admin") {
        m.status = "approved";
        m.role = "admin";
        if (!c.admins.includes(m.userId)) c.admins.push(m.userId);
        grantCapability(db, m.userId, "club-member", "club-organizer");
      } else if (action === "remove-admin") {
        if (c.admins.filter((a) => a !== m.userId).length === 0) throw new Error("last-admin");
        m.role = "member";
        c.admins = c.admins.filter((a) => a !== m.userId);
      }
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    return { ok: false, error: msg === "last-admin" ? "A club needs at least one admin — add another admin first." : "That request no longer exists." };
  }
  done(slug);
  revalidatePath(`/clubs/${slug}/manage`);
  return { ok: true };
}
