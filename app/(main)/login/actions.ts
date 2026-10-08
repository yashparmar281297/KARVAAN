"use server";

import { createHash, timingSafeEqual } from "node:crypto";
import { endAdminSession, startAdminSession } from "@/lib/admin";

const digest = (s: string) => createHash("sha256").update(s).digest();

/**
 * Checks the admin passcode (ADMIN_PASSCODE in .env.local) and, if right,
 * starts the server-side admin session. The passcode never reaches the browser.
 */
export async function verifyAdminPasscode(code: string): Promise<{ ok: boolean; error?: string }> {
  const expected = process.env.ADMIN_PASSCODE;
  if (!expected) return { ok: false, error: "Admin login is off — set ADMIN_PASSCODE in .env.local and restart the dev server." };
  const ok = typeof code === "string" && code.length <= 200 && timingSafeEqual(digest(code), digest(expected));
  if (!ok) {
    // Slow down guessing.
    await new Promise((r) => setTimeout(r, 800));
    return { ok: false, error: "Wrong passcode." };
  }
  await startAdminSession();
  return { ok: true };
}

/** Logs the admin out on the server (clears the signed cookie). */
export async function signOutAdmin() {
  await endAdminSession();
}
