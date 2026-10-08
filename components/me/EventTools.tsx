"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { checkInByRef, setCheckIn, setEventStatus } from "@/app/actions/events";

export function CheckInToggle({ slug, id, checked }: { slug: string; id: string; checked: boolean }) {
  const router = useRouter();
  const [busy, start] = useTransition();
  return (
    <button
      type="button"
      disabled={busy}
      onClick={() =>
        start(async () => {
          await setCheckIn(slug, id, !checked);
          router.refresh();
        })
      }
      className={`chip shrink-0 ${checked ? "" : "opacity-80"}`}
      data-active={checked}
      aria-pressed={checked}
    >
      {checked ? "Checked in" : "Check in"}
    </button>
  );
}

/** Type (or scan into) the booking reference from the attendee's QR ticket. */
export function CheckInByRef({ slug }: { slug: string }) {
  const router = useRouter();
  const [ref, setRef] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, start] = useTransition();
  return (
    <form
      className="flex flex-wrap items-end gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (!ref.trim()) return;
        start(async () => {
          const res = await checkInByRef(slug, ref);
          setMsg(res.ok ? { ok: true, text: `Checked in: ${res.name}` } : { ok: false, text: res.error });
          if (res.ok) setRef("");
          router.refresh();
        });
      }}
    >
      <label className="block min-w-0 flex-1">
        <span className="label mb-2 block !text-[9.5px] text-mute">QR check-in · booking reference</span>
        <input className="field readout uppercase" value={ref} onChange={(e) => setRef(e.target.value)} placeholder="KV-XXX-XXXXXX" />
      </label>
      <button disabled={busy || !ref.trim()} className="btn btn-primary chamfer disabled:opacity-50">
        Check in
      </button>
      {msg && <p className={`w-full text-sm ${msg.ok ? "text-ivory" : "text-ember"}`}>{msg.text}</p>}
    </form>
  );
}

export function StatusToggle({ slug, status }: { slug: string; status: "published" | "draft" }) {
  const router = useRouter();
  const [busy, start] = useTransition();
  return (
    <button
      type="button"
      disabled={busy}
      onClick={() =>
        start(async () => {
          await setEventStatus(slug, status === "draft" ? "published" : "draft");
          router.refresh();
        })
      }
      className={`btn chamfer ${status === "draft" ? "btn-primary" : "btn-ghost"}`}
    >
      {status === "draft" ? "Publish event" : "Unpublish (back to draft)"}
    </button>
  );
}
