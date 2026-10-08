"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { manageMember } from "@/app/actions/clubs";

type Action = "approve" | "reject" | "remove" | "make-admin" | "remove-admin";
const LABEL: Record<Action, string> = { approve: "Approve", reject: "Reject", remove: "Remove", "make-admin": "Make admin", "remove-admin": "Remove admin" };

/** Admin buttons for one membership row. */
export function MemberActions({ slug, id, actions }: { slug: string; id: string; actions: Action[] }) {
  const router = useRouter();
  const [busy, start] = useTransition();
  return (
    <span className="flex shrink-0 flex-wrap gap-2">
      {actions.map((a) => (
        <button
          key={a}
          type="button"
          disabled={busy}
          onClick={() =>
            (a !== "remove" || window.confirm("Remove this member from the club?")) &&
            start(async () => {
              const res = await manageMember(slug, id, a);
              if (!res.ok) window.alert(res.error);
              router.refresh();
            })
          }
          className={`btn chamfer !h-9 !px-3 ${a === "approve" || a === "make-admin" ? "btn-primary" : "btn-ghost"}`}
        >
          {LABEL[a]}
        </button>
      ))}
    </span>
  );
}
