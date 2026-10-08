"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { joinClub, leaveClub } from "@/app/actions/clubs";
import { useSocial } from "@/lib/session";
import { Icon } from "../ui/Icon";

export type JoinState = "none" | "pending" | "member" | "admin";

/**
 * JOIN ≠ FOLLOW. Join makes you an actual member: instantly for open clubs,
 * or a request that a club admin approves. Visitors are asked to create an
 * account first, and the join request is sent automatically afterwards.
 */
export function JoinClubButton({ slug, state, policy, className = "" }: { slug: string; state: JoinState; policy: "open" | "approval"; className?: string }) {
  const router = useRouter();
  const { session, requireAccount } = useSocial();
  const [busy, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (state === "admin")
    return (
      <Link href={`/clubs/${slug}/manage`} className={`btn btn-primary chamfer ${className}`}>
        <Icon name="wrench" size={14} /> Manage club
      </Link>
    );

  const act = (fn: () => Promise<{ ok: boolean; error?: string; needsLogin?: boolean }>) =>
    start(async () => {
      setError(null);
      const res = await fn();
      if (res.needsLogin) return requireAccount({ type: "join", club: slug }, "join");
      if (!res.ok) setError(res.error ?? "Something went wrong.");
      router.refresh();
    });

  if (state === "member")
    return (
      <button type="button" disabled={busy} onClick={() => window.confirm("Leave this club? Your vehicles listed in it become independent.") && act(() => leaveClub(slug))} className={`btn btn-primary chamfer ${className}`} title="You're a member — click to leave">
        <Icon name="check" size={14} /> Member
      </button>
    );

  if (state === "pending")
    return (
      <button type="button" disabled={busy} onClick={() => window.confirm("Withdraw your join request?") && act(() => leaveClub(slug))} className={`btn btn-ghost chamfer ${className}`} title="Waiting for a club admin — click to withdraw">
        <Icon name="gauge" size={14} /> Request sent
      </button>
    );

  return (
    <span className="inline-flex flex-col">
      <button
        type="button"
        disabled={busy}
        onClick={() => (session?.id ? act(() => joinClub(slug)) : requireAccount({ type: "join", club: slug }, "join"))}
        className={`btn btn-ghost chamfer ${className}`}
        title={policy === "open" ? "Join instantly" : "A club admin approves each member"}
      >
        <Icon name="users" size={14} /> {policy === "open" ? "Join club" : "Request to join"}
      </button>
      {error && <span className="mt-1 text-xs text-ember">{error}</span>}
    </span>
  );
}
