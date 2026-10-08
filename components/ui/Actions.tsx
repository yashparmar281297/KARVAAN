"use client";

import { useState } from "react";
import { useFollow, useFollowerTotal, useFollows, useSave, type FollowKind, type SaveKind } from "@/lib/follows";
import { Icon } from "./Icon";

const fmt = (n: number) => (n >= 10000 ? `${(n / 1000).toFixed(1)}K` : n.toLocaleString("en-IN"));

/**
 * Follow toggle ("send me updates" — never membership). Visitors are asked to
 * create an account, and the follow completes automatically afterwards.
 */
export function FollowButton({ kind, id, label = "Follow", className = "" }: { kind: FollowKind; id: string; label?: string; className?: string }) {
  const { following, toggle, signedIn } = useFollow(kind, id);
  return (
    <button onClick={toggle} title={signedIn ? undefined : "Create a free account to follow"} aria-pressed={following} className={`btn chamfer ${following ? "btn-primary" : "btn-ghost"} ${className}`}>
      <Icon name={following ? "check" : "plus"} size={15} /> {following ? "Following" : label}
    </button>
  );
}

/** Save for later (appears under My saved). */
export function SaveButton({ kind, id, className = "" }: { kind: SaveKind; id: string; className?: string }) {
  const { saved, toggle, signedIn } = useSave(kind, id);
  return (
    <button onClick={toggle} title={signedIn ? undefined : "Create a free account to save"} aria-pressed={saved} className={`btn chamfer ${saved ? "btn-primary" : "btn-ghost"} ${className}`}>
      <Icon name={saved ? "check" : "star"} size={15} /> {saved ? "Saved" : "Save"}
    </button>
  );
}

/** Live follower count: stored base (profiles made before accounts) + every account that follows. */
export function FollowerCount({ kind, id, base, className = "" }: { kind: FollowKind; id: string; base: number; className?: string }) {
  const total = useFollowerTotal(kind, id);
  return <span className={className}>{fmt(base + total)}</span>;
}

/** Stat block used on profiles: count over a label. */
export function FollowerStat({ kind, id, base, label = "Followers" }: { kind: FollowKind; id: string; base: number; label?: string }) {
  return (
    <div>
      <dd className="readout text-[clamp(2.2rem,min(4vw,5.2svh),3rem)] leading-none">
        <FollowerCount kind={kind} id={id} base={base} />
      </dd>
      <dt className="label mt-2">{label}</dt>
    </div>
  );
}

/** "Following" count for the signed-in viewer's own profile. */
export function FollowingCount({ base, className = "" }: { base: number; className?: string }) {
  const all = useFollows();
  return <span className={className}>{fmt(base + all.length)}</span>;
}

export function ShareButton({ title, className = "" }: { title: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title, url });
      else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }
    } catch {
      /* user dismissed the share sheet */
    }
  };
  return (
    <button onClick={share} className={`btn btn-ghost chamfer ${className}`}>
      <Icon name={copied ? "check" : "arrowUpRight"} size={15} /> {copied ? "Link copied" : "Share"}
    </button>
  );
}
