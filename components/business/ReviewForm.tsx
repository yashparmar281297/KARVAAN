"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { reviewBusiness } from "@/app/actions/reviews";
import { useSocial } from "@/lib/session";
import { Icon } from "../ui/Icon";

/** Star rating + text. Visitors are asked to create an account first. */
export function ReviewForm({ slug, existing }: { slug: string; existing?: { rating: number; text: string } }) {
  const router = useRouter();
  const { session, requireAccount } = useSocial();
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [text, setText] = useState(existing?.text ?? "");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, start] = useTransition();

  if (!session?.id)
    return (
      <button type="button" onClick={() => requireAccount(undefined, "create")} className="btn btn-ghost chamfer">
        <Icon name="star" size={14} /> Write a review
      </button>
    );

  return (
    <form
      className="max-w-xl rounded-[3px] bg-graphite p-4 hairline"
      onSubmit={(e) => {
        e.preventDefault();
        setMsg(null);
        start(async () => {
          const res = await reviewBusiness(slug, { rating, text });
          setMsg(res.ok ? { ok: true, text: existing ? "Review updated." : "Thanks — your review is live." } : { ok: false, text: res.error });
          if (res.ok) router.refresh();
        });
      }}
    >
      <p className="label mb-3">{existing ? "Your review" : "Write a review"}</p>
      <div className="flex gap-1" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} star${n > 1 ? "s" : ""}`} onClick={() => setRating(n)} className="p-1">
            <Icon name="star" size={22} className={n <= rating ? "fill-ivory text-ivory" : "text-mute"} />
          </button>
        ))}
      </div>
      <textarea className="field mt-3 !h-24 py-3" value={text} onChange={(e) => setText(e.target.value)} maxLength={600} placeholder="How was the work, the people, the price?" />
      {msg && <p className={`mt-2 text-sm ${msg.ok ? "text-ivory" : "text-ember"}`}>{msg.text}</p>}
      <button disabled={busy || rating < 1 || text.trim().length < 5} className="btn btn-primary chamfer mt-3 disabled:opacity-50">
        {busy ? "Saving…" : existing ? "Update review" : "Post review"}
      </button>
    </form>
  );
}
