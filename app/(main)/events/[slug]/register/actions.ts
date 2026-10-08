"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { getViewer } from "@/lib/auth";
import { mutate } from "@/lib/store";

export type RegisterResult = { ok: true; ref: string } | { ok: false; error: string };

/**
 * Records a registration: checks the details and remaining slots, then counts
 * the tickets against the event, linked to the person's account (it then shows
 * under My events). Paid tickets: payment is still a demo — no money is taken.
 * Contact details are kept for the organiser only; the public sees first
 * name + initial.
 */
export async function registerForEvent(input: { slug: string; tickets: Record<string, number>; name: string; phone: string; email: string; reg?: string }): Promise<RegisterResult> {
  const viewer = await getViewer();
  if (!viewer?.id) return { ok: false, error: "Create your free account to register." };
  const name = String(input.name ?? "").trim().slice(0, 60);
  const phone = String(input.phone ?? "").replace(/\D/g, "").slice(-10);
  const email = String(input.email ?? "").trim().slice(0, 80);
  const reg = String(input.reg ?? "").trim().slice(0, 20) || undefined;
  if (name.length < 2) return { ok: false, error: "Enter your name." };
  if (!/^[6-9]\d{9}$/.test(phone)) return { ok: false, error: "Enter a valid 10-digit mobile number." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: "Enter a valid email." };
  const wanted = Object.entries(input.tickets ?? {})
    .map(([id, n]) => ({ id: String(id), qty: Math.floor(Number(n)) }))
    .filter((t) => t.qty > 0);
  if (!wanted.length || wanted.some((t) => !Number.isFinite(t.qty) || t.qty > 6)) return { ok: false, error: "Choose your tickets (up to 6 each)." };

  try {
    const ref = mutate((db) => {
      const e = db.events.find((x) => x.slug === input.slug);
      if (!e) throw new Error("gone");
      for (const w of wanted) {
        const t = e.tickets.find((x) => x.id === w.id);
        if (!t) throw new Error("ticket");
        if (t.total !== undefined && t.sold + w.qty > t.total) throw new Error("full");
      }
      if ((e.status ?? "published") !== "published") throw new Error("gone");
      if (db.registrations.some((r) => r.event === e.slug && (r.phone === phone || r.userId === viewer.id))) throw new Error("dupe");
      for (const w of wanted) e.tickets.find((x) => x.id === w.id)!.sold += w.qty;
      e.participants += wanted.reduce((n, w) => n + w.qty, 0);
      const id = `KV-${e.slug.slice(0, 3).toUpperCase()}-${randomBytes(3).toString("hex").toUpperCase()}`;
      db.registrations.push({ id, event: e.slug, name, phone, email, vehicleReg: reg, tickets: wanted, userId: viewer.id!, createdAt: new Date().toISOString() });
      return id;
    });
    revalidatePath(`/events/${input.slug}`);
    revalidatePath("/events");
    return { ok: true, ref };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    return {
      ok: false,
      error:
        msg === "full" ? "Sorry — not enough spots left for that many tickets." : msg === "dupe" ? "You're already registered for this event — see My events." : msg === "gone" || msg === "ticket" ? "This event has changed — please reload the page." : "Couldn't register. Please try again.",
    };
  }
}
