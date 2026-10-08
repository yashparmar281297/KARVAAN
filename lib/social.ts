// Server-side snapshot of the viewer + social state, handed to the browser once
// per page (root layout) so buttons render the right state instantly.
import type { Viewer } from "./auth";
import { readDb } from "./store";
import type { SocialRow } from "./types";

export interface SessionSnapshot {
  viewer: { id: string | null; name: string; handle: string | null; capabilities: string[]; admin: boolean } | null;
  mine: { follows: string[]; likes: string[]; saves: string[] };
  counts: { follows: Record<string, number>; likes: Record<string, number> };
}

const tally = (rows: SocialRow[]) => rows.reduce<Record<string, number>>((m, r) => ((m[r.key] = (m[r.key] ?? 0) + 1), m), {});

export function sessionSnapshot(viewer: Viewer | null): SessionSnapshot {
  const db = readDb();
  const mineOf = (rows: SocialRow[]) => (viewer?.id ? rows.filter((r) => r.userId === viewer.id).map((r) => r.key) : []);
  return {
    viewer: viewer ? { id: viewer.id, name: viewer.name, handle: viewer.handle, capabilities: viewer.capabilities, admin: viewer.admin } : null,
    mine: { follows: mineOf(db.follows), likes: mineOf(db.likes), saves: mineOf(db.saves) },
    counts: { follows: tally(db.follows), likes: tally(db.likes) },
  };
}
