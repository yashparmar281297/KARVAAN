"use server";

import { revalidatePath } from "next/cache";
import { getViewer } from "@/lib/auth";
import { mutate } from "@/lib/store";

export type ReviewResult = { ok: true } | { ok: false; error: string; needsLogin?: boolean };

/**
 * Leave (or update) a review of a business — one per person, 1–5 stars.
 * Owners can't review their own business. Rating and count are recalculated.
 */
export async function reviewBusiness(slug: string, input: { rating: number; text: string }): Promise<ReviewResult> {
  const viewer = await getViewer();
  if (!viewer?.id) return { ok: false, error: "Create your free account to leave a review.", needsLogin: true };
  const rating = Math.round(Number(input.rating));
  const text = String(input.text ?? "").trim().slice(0, 600);
  if (!(rating >= 1 && rating <= 5)) return { ok: false, error: "Choose 1 to 5 stars." };
  if (text.length < 5) return { ok: false, error: "Write a few words about your experience." };
  try {
    mutate((db) => {
      const b = db.businesses.find((x) => x.slug === slug);
      if (!b) throw new Error("gone");
      if (b.ownerUserId && b.ownerUserId === viewer.id) throw new Error("own");
      const garage = db.vehicles.find((v) => v.owner === viewer.handle && (v.visibility ?? "public") === "public" && !v.ownerHidden);
      const review = { author: viewer.name, rating, text, vehicle: garage?.slug ?? "", userId: viewer.id!, createdAt: new Date().toISOString() };
      b.reviews = [review, ...b.reviews.filter((r) => r.userId !== viewer.id)];
      b.reviewCount = b.reviews.length;
      b.rating = Math.round((b.reviews.reduce((n, r) => n + r.rating, 0) / b.reviews.length) * 10) / 10;
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    return { ok: false, error: msg === "own" ? "You can't review your own business." : "This business no longer exists." };
  }
  revalidatePath(`/businesses/${slug}`);
  return { ok: true };
}
