"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { leaveClub } from "@/app/actions/clubs";
import { deleteItem, type ItemKind } from "@/app/(main)/studio/actions";
import { signOut } from "@/lib/session";
import { Icon } from "../ui/Icon";

export function DeleteButton({ kind, id, name }: { kind: ItemKind; id: string; name: string }) {
  const router = useRouter();
  const [busy, start] = useTransition();
  return (
    <button
      type="button"
      disabled={busy}
      onClick={() =>
        window.confirm(`Delete “${name}”? This can't be undone.`) &&
        start(async () => {
          const res = await deleteItem(kind, id);
          if (!res.ok) window.alert(res.error);
          router.refresh();
        })
      }
      className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-mute hairline transition hover:text-ember disabled:opacity-40"
      aria-label={`Delete ${name}`}
    >
      <Icon name="trash" size={14} />
    </button>
  );
}

export function LeaveClubButton({ slug, pending }: { slug: string; pending?: boolean }) {
  const router = useRouter();
  const [busy, start] = useTransition();
  return (
    <button
      type="button"
      disabled={busy}
      onClick={() =>
        window.confirm(pending ? "Withdraw your join request?" : "Leave this club? Your vehicles listed in it become independent.") &&
        start(async () => {
          await leaveClub(slug);
          router.refresh();
        })
      }
      className="label shrink-0 px-2 py-2 !text-[9.5px] text-mute hover:text-ivory disabled:opacity-40"
    >
      {pending ? "Withdraw" : "Leave"}
    </button>
  );
}

export function LogoutButton() {
  return (
    <button type="button" onClick={() => signOut()} className="btn btn-ghost chamfer">
      Log out
    </button>
  );
}
