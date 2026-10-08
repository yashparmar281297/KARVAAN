// Server-only admin session: a signed, httpOnly cookie set after the admin
// passcode is accepted. The browser can't read or forge it, so the Studio,
// its save actions and photo uploads check it on the server.
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE = "karvaan_admin";
const MAX_AGE = 7 * 24 * 60 * 60; // seconds

/** Signing key derived from the passcode — changing the passcode logs every admin out. */
function key() {
  const passcode = process.env.ADMIN_PASSCODE;
  return passcode ? createHash("sha256").update(`karvaan-admin-v1:${passcode}`).digest() : null;
}

const sign = (k: Buffer, payload: string) => createHmac("sha256", k).update(payload).digest("base64url");

export async function isAdmin(): Promise<boolean> {
  const k = key();
  const token = (await cookies()).get(COOKIE)?.value;
  if (!k || !token) return false;
  const [exp, sig] = token.split(".");
  if (!exp || !sig || !(Number(exp) > Date.now())) return false;
  const expected = Buffer.from(sign(k, exp));
  const given = Buffer.from(sig);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/** Call only from a Server Function / Route Handler, after the passcode check. */
export async function startAdminSession() {
  const k = key();
  if (!k) return;
  const exp = String(Date.now() + MAX_AGE * 1000);
  (await cookies()).set(COOKIE, `${exp}.${sign(k, exp)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function endAdminSession() {
  (await cookies()).delete(COOKIE);
}
