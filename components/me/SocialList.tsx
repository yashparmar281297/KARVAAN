"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useSocial } from "@/lib/session";
import type { Resolved } from "@/lib/resolve";

const LABEL: Record<string, string> = { owner: "People", club: "Clubs", vehicle: "Vehicles", business: "Businesses", event: "Events", image: "Photos", brand: "Brands" };
const UNDO: Record<string, string> = { follows: "Unfollow", likes: "Unlike", saves: "Remove" };

/** A person's follows / likes / saves, grouped by kind, each removable. */
export function SocialList({ kind, items, empty }: { kind: "follows" | "likes" | "saves"; items: Resolved[]; empty: React.ReactNode }) {
  const s = useSocial();
  const [tab, setTab] = useState("all");
  // Reflect removals instantly (optimistic), before the server refresh lands.
  const live = items.filter((i) => s.has(kind, i.key));
  const kinds = Array.from(new Set(live.map((i) => i.kind)));
  const shown = live.filter((i) => tab === "all" || i.kind === tab);
  if (!live.length) return <div className="text-sm text-silver">{empty}</div>;
  return (
    <div>
      {kinds.length > 1 && (
        <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4">
          <button className="chip shrink-0" data-active={tab === "all"} onClick={() => setTab("all")}>
            All <span className="readout opacity-60">{live.length}</span>
          </button>
          {kinds.map((k) => (
            <button key={k} className="chip shrink-0" data-active={tab === k} onClick={() => setTab(k)}>
              {LABEL[k] ?? k} <span className="readout opacity-60">{live.filter((i) => i.kind === k).length}</span>
            </button>
          ))}
        </div>
      )}
      <ul className="grid gap-2 md:grid-cols-2">
        {shown.map((i) => (
          <li key={i.key} className="flex items-center gap-3 rounded-[3px] bg-graphite p-2.5 hairline">
            <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-[2px] bg-charcoal">{i.image && <Image src={i.image} alt="" fill sizes="48px" className="object-cover" />}</span>
            {i.href ? (
              <Link href={i.href} className="min-w-0 flex-1">
                <span className="block truncate text-sm text-ivory">{i.title}</span>
                <span className="label mt-0.5 block truncate !text-[9px]">{i.subtitle}</span>
              </Link>
            ) : (
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm text-ivory">{i.title}</span>
                <span className="label mt-0.5 block truncate !text-[9px]">{i.subtitle}</span>
              </span>
            )}
            <button onClick={() => s.set(kind, i.key, false)} className="label shrink-0 px-2 py-2 !text-[9.5px] text-mute hover:text-ivory">
              {UNDO[kind]}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
