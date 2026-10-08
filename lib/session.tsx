"use client";

// The signed-in person, as seen by the browser. The source of truth is the
// server (signed cookie → root layout → this provider); nothing about the
// login lives in localStorage. Also holds the viewer's follows / likes / saves
// with optimistic updates, and completes an action a visitor started before
// signing up ("Like" → sign up → the like is applied automatically).
import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { logOut } from "@/app/actions/account";
import { joinClub } from "@/app/actions/clubs";
import { setSocial, type SocialKind } from "@/app/actions/social";
import type { SessionSnapshot } from "./social";

export interface Session {
  id: string | null;
  handle: string | null;
  name: string;
  capabilities: string[];
  role: "admin" | "member";
  admin: boolean;
}

type Pending = { type: "social"; kind: SocialKind; key: string } | { type: "join"; club: string };
const PENDING = "karvaan:pending";

interface Ctx {
  session: Session | null;
  has: (kind: SocialKind, key: string) => boolean;
  count: (kind: "follows" | "likes", key: string) => number;
  mine: (kind: SocialKind) => string[];
  set: (kind: SocialKind, key: string, on?: boolean) => void;
  /** Visitor tried an action → remember it and go to "Create your free account". */
  requireAccount: (pending?: Pending, reason?: string) => void;
}

const SessionContext = createContext<Ctx | null>(null);

export function SessionProvider({ snapshot, children }: { snapshot: SessionSnapshot; children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const v = snapshot.viewer;
  const session: Session | null = useMemo(() => (v ? { id: v.id, handle: v.handle, name: v.name, capabilities: v.capabilities, role: v.admin ? "admin" : "member", admin: v.admin } : null), [v]);

  // Optimistic overrides on top of the server snapshot; reset whenever a fresh snapshot arrives.
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});
  const [lastSnap, setLastSnap] = useState(snapshot);
  if (snapshot !== lastSnap) {
    setLastSnap(snapshot);
    setOverrides({});
  }

  const base = useCallback((kind: SocialKind, key: string) => snapshot.mine[kind].includes(key), [snapshot]);
  const has = useCallback((kind: SocialKind, key: string) => overrides[`${kind}|${key}`] ?? base(kind, key), [overrides, base]);
  const count = useCallback(
    (kind: "follows" | "likes", key: string) => {
      const n = snapshot.counts[kind][key] ?? 0;
      const o = overrides[`${kind}|${key}`];
      if (o === undefined) return n;
      return n + (o === base(kind, key) ? 0 : o ? 1 : -1);
    },
    [snapshot, overrides, base],
  );
  const mine = useCallback(
    (kind: SocialKind) => {
      const set = new Set(snapshot.mine[kind]);
      for (const [k, on] of Object.entries(overrides)) {
        const [kk, key] = k.split("|");
        if (kk !== kind) continue;
        if (on) set.add(key);
        else set.delete(key);
      }
      return [...set];
    },
    [snapshot, overrides],
  );

  const requireAccount = useCallback(
    (pending?: Pending, reason?: string) => {
      try {
        if (pending) sessionStorage.setItem(PENDING, JSON.stringify({ ...pending, returnTo: window.location.pathname + window.location.search }));
      } catch {
        /* storage off — the user can repeat the action after signing up */
      }
      const next = encodeURIComponent(window.location.pathname + window.location.search);
      router.push(`/join?next=${next}${reason ? `&reason=${encodeURIComponent(reason)}` : ""}`);
    },
    [router],
  );

  const set = useCallback(
    (kind: SocialKind, key: string, on?: boolean) => {
      if (!session?.id) return requireAccount({ type: "social", kind, key: key }, kind === "follows" ? "follow" : kind === "likes" ? "like" : "save");
      const want = on ?? !has(kind, key);
      setOverrides((o) => ({ ...o, [`${kind}|${key}`]: want }));
      setSocial(kind, key, want).then((res) => {
        if (!res.ok) setOverrides((o) => ({ ...o, [`${kind}|${key}`]: !want }));
      });
    },
    [session, has, requireAccount],
  );

  // Finish the action a visitor started before creating their account.
  const ran = useRef(false);
  useEffect(() => {
    if (!session?.id || ran.current) return;
    let pending: (Pending & { returnTo?: string }) | null = null;
    try {
      pending = JSON.parse(sessionStorage.getItem(PENDING) ?? "null");
    } catch {
      pending = null;
    }
    if (!pending) return;
    ran.current = true;
    sessionStorage.removeItem(PENDING);
    const run = pending.type === "social" ? setSocial(pending.kind, pending.key, true) : joinClub(pending.club);
    run.then(() => router.refresh());
  }, [session, router, pathname]);

  const value = useMemo(() => ({ session, has, count, mine, set, requireAccount }), [session, has, count, mine, set, requireAccount]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

function useCtx() {
  const c = useContext(SessionContext);
  if (!c) throw new Error("SessionProvider missing");
  return c;
}

export const useSession = () => useCtx().session;
export const useSocial = () => useCtx();

/** Log out everywhere (account + admin), then go home. */
export async function signOut() {
  await logOut();
  // Full reload on purpose: clears every cached page that showed the logged-in state.
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  window.location.assign("/");
}

/** "Create your free account" link that returns here afterwards (render-safe). */
export function useLoginHref() {
  const pathname = usePathname();
  return `/join?next=${encodeURIComponent(pathname)}`;
}

/** Same, for click handlers (includes the query string). */
export function loginHref() {
  if (typeof window === "undefined") return "/join";
  return `/join?next=${encodeURIComponent(window.location.pathname + window.location.search)}`;
}
