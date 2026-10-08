// Where the data comes from. On the server, lib/store.ts registers a loader
// that reads the local test database (.data/db.json). In the browser there is
// no loader, so everything reads as empty — client components get their data
// as props from the server instead.
import type { Brand, Business, Club, Event, Membership, Owner, Registration, Route, SocialRow, User, Vehicle } from "../types";

export interface Db {
  owners: Owner[];
  vehicles: Vehicle[];
  clubs: Club[];
  events: Event[];
  routes: Route[];
  businesses: Business[];
  brands: Brand[];
  registrations: Registration[];
  users: User[];
  follows: SocialRow[];
  likes: SocialRow[];
  saves: SocialRow[];
  memberships: Membership[];
}

export const emptyDb = (): Db => ({ owners: [], vehicles: [], clubs: [], events: [], routes: [], businesses: [], brands: [], registrations: [], users: [], follows: [], likes: [], saves: [], memberships: [] });

const EMPTY = emptyDb();
const g = globalThis as { __karvaanDb?: () => Db };

export const db = (): Db => g.__karvaanDb?.() ?? EMPTY;

/**
 * An array that always reflects the current database — reads are forwarded
 * to the latest copy, so a record saved a moment ago shows on the next render.
 */
export function live<K extends keyof Db>(key: K, where?: (row: Db[K][number]) => boolean): Db[K] {
  // Filtered views are recomputed only when the database changes.
  const cache = new WeakMap<Db, object>();
  const current = (): object => {
    const d = db();
    if (!where) return d[key] as unknown as object;
    let arr = cache.get(d);
    if (!arr) {
      arr = (d[key] as unknown as Db[K][number][]).filter(where) as unknown as object;
      cache.set(d, arr);
    }
    return arr;
  };
  return new Proxy([] as unknown as Db[K], {
    get: (_, prop) => {
      const arr = current();
      const val = Reflect.get(arr, prop);
      return typeof val === "function" ? val.bind(arr) : val;
    },
    has: (_, prop) => Reflect.has(current(), prop),
    ownKeys: () => Reflect.ownKeys(current()),
    getOwnPropertyDescriptor: (_, prop) => {
      const d = Reflect.getOwnPropertyDescriptor(current(), prop);
      // Proxy invariant: `length` exists on the (empty array) target and is non-configurable.
      if (d && prop === "length") d.configurable = false;
      return d;
    },
  });
}
