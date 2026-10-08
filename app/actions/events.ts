"use server";

import { revalidatePath } from "next/cache";
import { getViewer } from "@/lib/auth";
import { canManageEvent } from "@/lib/permissions";
import { mutate, readDb } from "@/lib/store";

// Organiser tools — only the organiser, admins of the hosting club, or the site admin.

export type EventToolResult = { ok: true; name?: string } | { ok: false; error: string };

async function guard(slug: string) {
  const viewer = await getViewer();
  const e = readDb().events.find((x) => x.slug === slug);
  return !!e && canManageEvent(readDb(), e, viewer);
}

/** Tick / untick a registration as checked in. */
export async function setCheckIn(slug: string, registrationId: string, on: boolean): Promise<EventToolResult> {
  if (!(await guard(slug))) return { ok: false, error: "Only the organiser can check people in." };
  mutate((db) => {
    const r = db.registrations.find((x) => x.id === registrationId && x.event === slug);
    if (r) r.checkedIn = on;
  });
  revalidatePath(`/events/${slug}/manage`);
  return { ok: true };
}

/** Check in by the booking reference printed on the QR ticket. */
export async function checkInByRef(slug: string, ref: string): Promise<EventToolResult> {
  if (!(await guard(slug))) return { ok: false, error: "Only the organiser can check people in." };
  const code = String(ref ?? "").trim().toUpperCase();
  const found = mutate((db) => {
    const r = db.registrations.find((x) => x.event === slug && x.id.toUpperCase() === code);
    if (!r) return null;
    const already = !!r.checkedIn;
    r.checkedIn = true;
    return { name: r.name, already };
  });
  if (!found) return { ok: false, error: "No ticket with that reference for this event." };
  revalidatePath(`/events/${slug}/manage`);
  return { ok: true, name: found.already ? `${found.name} (already checked in)` : found.name };
}

/** Publish a draft, or take a live event back to draft. */
export async function setEventStatus(slug: string, status: "published" | "draft"): Promise<EventToolResult> {
  if (!(await guard(slug))) return { ok: false, error: "Only the organiser can do that." };
  mutate((db) => {
    const e = db.events.find((x) => x.slug === slug);
    if (e) e.status = status === "draft" ? "draft" : "published";
  });
  revalidatePath(`/events/${slug}`);
  revalidatePath(`/events/${slug}/manage`);
  revalidatePath("/events");
  return { ok: true };
}
