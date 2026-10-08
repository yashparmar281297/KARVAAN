// Accounts & sessions — server only.
//
// One person = one account (User). The account's public face is its profile
// (an Owner record with `userId`). Passwords are stored as scrypt hashes; the
// login is a signed, httpOnly cookie ("<userId>.<expiry>.<signature>") that the
// browser can't read or forge. The separate admin passcode (lib/admin.ts)
// layers site-admin powers on top.
//
// Local test database for now — the same shape maps onto Supabase Auth +
// tables later.
import { createHmac, randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { isAdmin } from "./admin";
import type { Db } from "./data/source";
import { mutate, readDb } from "./store";
import type { Capability, User } from "./types";

const COOKIE = "karvaan_session";
const MAX_AGE = 30 * 24 * 60 * 60; // 30 days

export interface Viewer {
  /** User.id — null only for a site admin who hasn't logged into a personal account. */
  id: string | null;
  name: string;
  handle: string | null; // profile handle
  capabilities: Capability[];
  /** Site admin (passcode) — can manage everything. */
  admin: boolean;
}

/* ------------------------------ passwords ------------------------------ */

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 32).toString("hex")}`;
}

export function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const got = scryptSync(password, salt, 32);
  const want = Buffer.from(hash, "hex");
  return got.length === want.length && timingSafeEqual(got, want);
}

/** Emails are compared lower-case; phone numbers by their last 10 digits. */
export function normaliseIdentifier(raw: string) {
  const s = raw.trim().toLowerCase();
  if (s.includes("@")) return s;
  const digits = s.replace(/\D/g, "");
  return digits.length >= 10 ? digits.slice(-10) : s;
}

/* ------------------------------ session cookie ------------------------------ */

let devSecret: Buffer | null = null;
function secret() {
  const s = process.env.SESSION_SECRET;
  if (s) return Buffer.from(s);
  // No secret configured: use a per-process random one (logins reset on restart).
  devSecret ??= randomBytes(32);
  return devSecret;
}
const sign = (payload: string) => createHmac("sha256", secret()).update(payload).digest("base64url");

export async function startSession(userId: string) {
  const exp = String(Date.now() + MAX_AGE * 1000);
  const payload = `${userId}.${exp}`;
  (await cookies()).set(COOKIE, `${payload}.${sign(payload)}`, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: MAX_AGE });
}

export async function endSession() {
  (await cookies()).delete(COOKIE);
}

async function sessionUserId(): Promise<string | null> {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return null;
  const parts = raw.split(".");
  if (parts.length !== 3) return null;
  const [id, exp, sig] = parts;
  if (!(Number(exp) > Date.now())) return null;
  const want = Buffer.from(sign(`${id}.${exp}`));
  const got = Buffer.from(sig);
  return got.length === want.length && timingSafeEqual(got, want) ? id : null;
}

/* ------------------------------ viewer ------------------------------ */

/** The test member from .env.local (MEMBER_ID / MEMBER_PASSWORD) as a real account. */
export function ensureSeedUser() {
  const id = process.env.MEMBER_ID?.trim();
  const pw = process.env.MEMBER_PASSWORD;
  if (!id || !pw) return;
  const identifier = normaliseIdentifier(id);
  if (readDb().users.some((u) => u.identifier === identifier)) return;
  mutate((db) => {
    if (db.users.some((u) => u.identifier === identifier)) return;
    const u = createUserRecord(db, { name: process.env.MEMBER_NAME || "Test Rider", identifier, password: pw, capabilities: ["enthusiast"] });
    u.onboarded = true;
  });
}

/** Who is looking at this page. null = logged-out visitor. */
export async function getViewer(): Promise<Viewer | null> {
  const [uid, admin] = await Promise.all([sessionUserId(), isAdmin()]);
  const user = uid ? readDb().users.find((u) => u.id === uid) : undefined;
  if (user) return { id: user.id, name: user.name, handle: user.handle, capabilities: user.capabilities, admin };
  if (admin) return { id: null, name: "Site admin", handle: null, capabilities: [], admin: true };
  return null;
}

/* ------------------------------ records ------------------------------ */

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40) || "member";

/** Creates the account AND its personal profile (one person, one profile). */
export function createUserRecord(db: Db, input: { name: string; identifier: string; password: string; capabilities: Capability[] }): User {
  let handle = slugify(input.name);
  for (let i = 2; db.owners.some((o) => o.handle === handle); i++) handle = `${slugify(input.name)}-${i}`;
  const user: User = {
    id: randomUUID(),
    name: input.name,
    identifier: input.identifier,
    passwordHash: hashPassword(input.password),
    capabilities: input.capabilities.length ? input.capabilities : ["enthusiast"],
    handle,
    createdAt: new Date().toISOString(),
  };
  db.users.push(user);
  db.owners.push({ userId: user.id, handle, name: input.name, city: "", portrait: "/media/avatar.svg", bio: "", privacy: "public", joined: user.createdAt.slice(0, 10), clubs: [], followers: 0, following: 0 });
  return user;
}

/** Adds capabilities to an account as the person does things (never removes). */
export function grantCapability(db: Db, userId: string | null, ...caps: Capability[]) {
  if (!userId) return;
  const u = db.users.find((x) => x.id === userId);
  if (!u) return;
  for (const c of caps) if (!u.capabilities.includes(c)) u.capabilities.push(c);
}

export const newId = () => randomUUID();
