"use server";

import { revalidatePath } from "next/cache";
import { getViewer } from "@/lib/auth";
import { mutate } from "@/lib/store";

// Follow / like / save — one row per person per thing (a second tap undoes).
// Follow = "send me updates" (never membership). Like = appreciation (never
// ownership). Save = keep for later (e.g. an event).

export type SocialKind = "follows" | "likes" | "saves";
const KEY = /^(owner|club|vehicle|business|brand|event|image):[A-Za-z0-9/_.:-]{1,200}$/;

/** Sets (on=true/false) or toggles (on undefined) one follow / like / save. Returns the new state. */
export async function setSocial(kind: SocialKind, key: string, on?: boolean): Promise<{ ok: true; on: boolean } | { ok: false; error: string; needsLogin?: boolean }> {
  if (!["follows", "likes", "saves"].includes(kind) || typeof key !== "string" || !KEY.test(key)) return { ok: false, error: "Invalid request." };
  const viewer = await getViewer();
  if (!viewer?.id) return { ok: false, error: "Create your free account to continue.", needsLogin: true };
  const state = mutate((db) => {
    const list = db[kind];
    const has = list.some((r) => r.userId === viewer.id && r.key === key);
    const want = on ?? !has;
    if (want && !has) list.push({ userId: viewer.id!, key, createdAt: new Date().toISOString() });
    if (!want && has) db[kind] = list.filter((r) => !(r.userId === viewer.id && r.key === key));
    return want;
  });
  revalidatePath("/", "layout");
  return { ok: true, on: state };
}
