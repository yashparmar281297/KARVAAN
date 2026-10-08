// Local test database — server only. Records live in .data/db.json and
// uploaded photos in .data/uploads/. Good for building and testing on your
// machine; swap for Supabase (tables + Storage) before going live.
import fs from "node:fs";
import path from "node:path";
import { emptyDb, type Db } from "./data/source";

const DIR = path.join(process.cwd(), ".data");
const FILE = path.join(DIR, "db.json");
export const UPLOAD_DIR = path.join(DIR, "uploads");

let cache: { mtime: number; db: Db } | null = null;

export function readDb(): Db {
  let mtime: number;
  try {
    mtime = fs.statSync(FILE).mtimeMs;
  } catch {
    return emptyDb();
  }
  if (cache && cache.mtime === mtime) return cache.db;
  try {
    const db = { ...emptyDb(), ...JSON.parse(fs.readFileSync(FILE, "utf8")) } as Db;
    cache = { mtime, db };
    return db;
  } catch {
    return emptyDb();
  }
}

function writeDb(db: Db) {
  fs.mkdirSync(DIR, { recursive: true });
  const tmp = `${FILE}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
  fs.renameSync(tmp, FILE);
  cache = null;
}

/** Read–modify–write. Returns whatever the callback returns. */
export function mutate<T>(fn: (db: Db) => T): T {
  const db = structuredClone(readDb());
  const out = fn(db);
  writeDb(db);
  return out;
}

export function resetDb() {
  writeDb(emptyDb());
  fs.rmSync(UPLOAD_DIR, { recursive: true, force: true });
}

// Let the shared data layer (lib/data) read from this store on the server.
(globalThis as { __karvaanDb?: () => Db }).__karvaanDb = readDb;
