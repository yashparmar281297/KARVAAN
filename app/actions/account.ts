"use server";

import { revalidatePath } from "next/cache";
import { createUserRecord, endSession, ensureSeedUser, getViewer, normaliseIdentifier, startSession, verifyPassword } from "@/lib/auth";
import { endAdminSession } from "@/lib/admin";
import { cities } from "@/lib/data/geo";
import { UPLOAD_URL } from "@/lib/images";
import { mutate, readDb } from "@/lib/store";
import { SELECTABLE } from "@/lib/capabilities";
import type { Capability } from "@/lib/types";

export type AccountResult = { ok: true } | { ok: false; error: string };

const slow = () => new Promise((r) => setTimeout(r, 700));

/** Step 1 of joining: name + email/phone + password → account + profile, logged in. */
export async function signUp(input: { name: string; identifier: string; password: string }): Promise<AccountResult> {
  const name = String(input.name ?? "").trim().slice(0, 60);
  const rawId = String(input.identifier ?? "").trim().slice(0, 100);
  const password = String(input.password ?? "");
  if (name.length < 2) return { ok: false, error: "Enter your name." };
  const identifier = normaliseIdentifier(rawId);
  const isEmail = identifier.includes("@");
  if (isEmail ? !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier) : !/^[6-9]\d{9}$/.test(identifier)) return { ok: false, error: "Enter a valid email or 10-digit mobile number." };
  if (password.length < 8 || password.length > 200) return { ok: false, error: "Password must be at least 8 characters." };

  ensureSeedUser();
  let userId: string | null = null;
  try {
    mutate((db) => {
      if (db.users.some((u) => u.identifier === identifier)) throw new Error("taken");
      userId = createUserRecord(db, { name, identifier, password, capabilities: ["enthusiast"] }).id;
    });
  } catch (e) {
    if (e instanceof Error && e.message === "taken") return { ok: false, error: "An account with this email / mobile already exists — log in instead." };
    return { ok: false, error: "Couldn't create your account. Please try again." };
  }
  await startSession(userId!);
  revalidatePath("/", "layout");
  return { ok: true };
}

/**
 * "What describes you?" — answered ONCE, at sign-up (with optional photo and
 * city). After that the account's capabilities are fixed and can't be changed.
 */
export async function saveOnboarding(input: { capabilities: string[]; portrait?: string; city?: string }): Promise<AccountResult> {
  const viewer = await getViewer();
  if (!viewer?.id) return { ok: false, error: "Please log in again." };
  const caps = (Array.isArray(input.capabilities) ? input.capabilities : []).filter((c): c is Capability => SELECTABLE.includes(c as Capability));
  const portrait = input.portrait && UPLOAD_URL.test(input.portrait) ? input.portrait : undefined;
  const city = input.city && cities.some((c) => c.slug === input.city) ? input.city : undefined;
  const already = readDb().users.find((x) => x.id === viewer.id)?.onboarded;
  if (already) return { ok: false, error: "What describes you is set when the account is created and can't be changed." };
  mutate((db) => {
    const u = db.users.find((x) => x.id === viewer.id);
    if (!u || u.onboarded) return;
    u.onboarded = true;
    const earned = u.capabilities.filter((c) => c === "club-member");
    u.capabilities = Array.from(new Set<Capability>([...(caps.length ? caps : ["enthusiast" as const]), ...earned]));
    const profile = db.owners.find((o) => o.userId === u.id);
    if (profile) {
      if (portrait) profile.portrait = portrait;
      if (city !== undefined) profile.city = city;
    }
  });
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function logIn(input: { identifier: string; password: string }): Promise<AccountResult> {
  ensureSeedUser();
  const identifier = normaliseIdentifier(String(input.identifier ?? "").slice(0, 100));
  const user = readDb().users.find((u) => u.identifier === identifier);
  if (!user || !verifyPassword(String(input.password ?? "").slice(0, 200), user.passwordHash)) {
    await slow();
    return { ok: false, error: "Wrong email / mobile or password." };
  }
  await startSession(user.id);
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Logs out of the account and of any admin session. */
export async function logOut() {
  await endSession();
  await endAdminSession();
  revalidatePath("/", "layout");
}
