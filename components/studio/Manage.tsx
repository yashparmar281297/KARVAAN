"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteItem, resetAll, type ItemKind } from "@/app/(main)/studio/actions";
import { Icon } from "@/components/ui/Icon";

export interface ManageItem {
  kind: ItemKind;
  id: string;
  title: string;
  subtitle: string;
  image?: string;
  href: string;
  /** Tailwind aspect class matching the photo's standard frame. */
  aspect: string;
}

/** Studio tab that edits each kind. */
const TAB: Record<ItemKind, string> = { owner: "profile", vehicle: "vehicle", club: "club", event: "event", business: "business" };

const GROUPS: { kind: ItemKind; label: string }[] = [
  { kind: "owner", label: "Profiles" },
  { kind: "vehicle", label: "Vehicles" },
  { kind: "club", label: "Clubs" },
  { kind: "event", label: "Events" },
  { kind: "business", label: "Businesses" },
];

export function Manage({ items }: { items: ManageItem[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [confirmReset, setConfirmReset] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const act = (fn: () => ReturnType<typeof resetAll>) =>
    start(async () => {
      setError(null);
      const res = await fn();
      if (!res.ok) setError(res.error);
      router.refresh();
    });

  return (
    <div className="max-w-3xl space-y-12">
      {GROUPS.map((g) => {
        const list = items.filter((i) => i.kind === g.kind);
        return (
          <section key={g.kind}>
            <p className="label mb-4 flex items-center gap-3">
              {g.label} <span className="readout text-ivory">{list.length}</span>
            </p>
            {list.length === 0 ? (
              <p className="text-sm text-mute">Nothing yet.</p>
            ) : (
              <ul className="divide-y divide-line border-y border-line">
                {list.map((it) => (
                  <li key={it.id} className="flex items-center gap-4 py-3">
                    <span className={`relative w-12 shrink-0 overflow-hidden rounded-[2px] bg-graphite ${it.aspect}`}>{it.image && <Image src={it.image} alt="" fill sizes="48px" className="object-cover" />}</span>
                    <Link href={it.href} className="min-w-0 flex-1">
                      <p className="truncate text-ivory">{it.title}</p>
                      <p className="label mt-1 truncate !text-[9.5px]">{it.subtitle}</p>
                    </Link>
                    <Link href={`/studio?tab=${TAB[it.kind]}&edit=${encodeURIComponent(it.id)}`} className="label flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-ivory hairline transition hover:bg-ivory hover:text-ink">
                      <Icon name="wrench" size={13} /> Edit
                    </Link>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => window.confirm(`Delete “${it.title}”?${it.kind === "owner" ? " Their vehicles are deleted too." : it.kind === "club" ? " Its events are deleted too." : ""}`) && act(() => deleteItem(it.kind, it.id))}
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-mute hairline transition hover:text-ember disabled:opacity-40"
                      aria-label={`Delete ${it.title}`}
                    >
                      <Icon name="trash" size={15} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}

      <section className="border-t border-line pt-8">
        <p className="label mb-2 text-ember">Start over</p>
        <p className="max-w-md text-sm text-silver">Deletes every profile, vehicle, club, event, business and uploaded photo in the test database.</p>
        {confirmReset ? (
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button type="button" disabled={pending} onClick={() => act(resetAll)} className="btn chamfer bg-ember text-ink disabled:opacity-50">
              {pending ? "Deleting…" : "Yes, delete everything"}
            </button>
            <button type="button" onClick={() => setConfirmReset(false)} className="btn btn-ghost chamfer">
              Cancel
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => setConfirmReset(true)} className="btn btn-ghost chamfer mt-5">
            <Icon name="trash" size={14} /> Delete all test data
          </button>
        )}
        {error && <p className="mt-3 text-sm text-ember">{error}</p>}
      </section>
    </div>
  );
}
