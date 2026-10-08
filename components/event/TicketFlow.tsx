"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import QRCode from "qrcode";
import { useEffect, useMemo, useState } from "react";
import { dayNum, inr, monthShort, time, weekday } from "@/lib/format";
import { registerForEvent } from "@/app/(main)/events/[slug]/register/actions";
import { ticketLeft } from "@/lib/data";
import type { Event } from "@/lib/types";
import { Icon } from "../ui/Icon";

const STEPS = ["Tickets", "Details", "Payment", "Ticket"] as const;

export function TicketFlow({ e, feePct, organiser, routeLabel, holder = "" }: { e: Event; feePct: number; organiser: string; routeLabel: string; holder?: string }) {
  const [step, setStep] = useState(0);
  const [qty, setQty] = useState<Record<string, number>>(() => {
    const first = e.tickets.find((t) => ticketLeft(t) > 0);
    return first ? { [first.id]: 1 } : {};
  });
  const [form, setForm] = useState({ name: holder, phone: "", email: "", reg: "" });
  const [method, setMethod] = useState<"upi" | "card" | "netbanking">("upi");
  const [paying, setPaying] = useState(false);
  const [qr, setQr] = useState("");
  const [ref, setRef] = useState("");
  const [error, setError] = useState<string | null>(null);

  const lines = e.tickets.filter((t) => (qty[t.id] ?? 0) > 0).map((t) => ({ t, n: qty[t.id] }));
  const count = lines.reduce((s, l) => s + l.n, 0);
  const subtotal = lines.reduce((s, l) => s + l.t.price * l.n, 0);
  const fee = Math.round(subtotal * (feePct / 100));
  const total = subtotal + fee;
  const free = subtotal === 0;

  const detailsOk = form.name.trim().length > 1 && /^[6-9]\d{9}$/.test(form.phone.replace(/\D/g, "").slice(-10)) && /\S+@\S+\.\S+/.test(form.email);

  const payload = useMemo(() => JSON.stringify({ ref, event: e.slug, holder: form.name, tickets: lines.map((l) => `${l.t.id}x${l.n}`) }), [ref, e.slug, form.name, lines]);

  useEffect(() => {
    if (step !== 3) return;
    QRCode.toDataURL(payload, { margin: 1, width: 360, color: { dark: "#070708", light: "#ece8df" } }).then(setQr);
  }, [step, payload]);

  const set = (id: string, n: number, max: number) => setQty((q) => ({ ...q, [id]: Math.max(0, Math.min(n, max, 6)) }));

  // Saves the registration on the server (paid tickets: payment is still a demo).
  const confirm = async () => {
    setPaying(true);
    setError(null);
    const res = await registerForEvent({ slug: e.slug, tickets: qty, name: form.name, phone: form.phone, email: form.email, reg: form.reg });
    setPaying(false);
    if (!res.ok) return setError(res.error);
    setRef(res.ref);
    setStep(3);
  };

  return (
    <div className="mx-auto max-w-3xl">
      {/* Stepper */}
      <ol className="mb-10 grid grid-cols-4 gap-2">
        {STEPS.map((s, i) => {
          const label = i === 2 && free ? "Confirm" : s;
          return (
            <li key={s}>
              <div className="h-[2px] bg-line">
                <motion.div className="h-full bg-ivory" initial={false} animate={{ width: i <= step ? "100%" : "0%" }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} />
              </div>
              <p className={`label mt-2 ${i === step ? "!text-ivory" : ""}`}>
                <span className="readout mr-1.5">{String(i + 1).padStart(2, "0")}</span>
                {label}
              </p>
            </li>
          );
        })}
      </ol>

      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div key={step} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
          {step === 0 && (
            <div className="space-y-3">
              {e.tickets.map((t) => {
                const rem = ticketLeft(t);
                const n = qty[t.id] ?? 0;
                return (
                  <div key={t.id} className={`flex items-center gap-4 p-5 transition ${n ? "bg-graphite hairline-strong" : "hairline"}`} style={{ borderRadius: 3 }}>
                    <div className="min-w-0 flex-1">
                      <p className="display text-xl">{t.name}</p>
                      <p className="mt-1 text-sm text-silver">{t.perks.join(" · ")}</p>
                      <p className="label mt-2 !text-[9px] text-mute">{t.total === undefined ? "Open entry" : rem > 0 ? `${rem} remaining` : "Sold out"}</p>
                    </div>
                    <p className="readout text-xl">{inr(t.price)}</p>
                    <div className="flex items-center rounded-[2px] hairline-strong">
                      <button aria-label={`Fewer ${t.name}`} onClick={() => set(t.id, n - 1, rem)} disabled={n === 0} className="grid h-10 w-10 place-items-center disabled:opacity-30">
                        −
                      </button>
                      <span className="readout w-6 text-center">{n}</span>
                      <button aria-label={`More ${t.name}`} onClick={() => set(t.id, n + 1, rem)} disabled={n >= Math.min(rem, 6)} className="grid h-10 w-10 place-items-center disabled:opacity-30">
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {step === 1 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="sm:col-span-2">
                <span className="label mb-2 block">Full name</span>
                <input className="field" autoComplete="name" value={form.name} onChange={(ev) => setForm({ ...form, name: ev.target.value })} placeholder="As on your driving licence" />
              </label>
              <label>
                <span className="label mb-2 block">Mobile</span>
                <input className="field" inputMode="tel" autoComplete="tel" value={form.phone} onChange={(ev) => setForm({ ...form, phone: ev.target.value })} placeholder="98XXXXXXXX" />
              </label>
              <label>
                <span className="label mb-2 block">Email</span>
                <input className="field" type="email" autoComplete="email" value={form.email} onChange={(ev) => setForm({ ...form, email: ev.target.value })} placeholder="you@example.com" />
              </label>
              <label className="sm:col-span-2">
                <span className="label mb-2 block">Vehicle registration (optional)</span>
                <input className="field uppercase" value={form.reg} onChange={(ev) => setForm({ ...form, reg: ev.target.value })} placeholder="MP 09 AB 1234" />
              </label>
              <p className="text-xs text-mute sm:col-span-2">Shared only with the organiser for check-in. Never shown publicly.</p>
            </div>
          )}

          {step === 2 && (
            <div>
              {!free && (
                <div className="grid gap-3 sm:grid-cols-3">
                  {(
                    [
                      ["upi", "UPI", "GPay, PhonePe, Paytm"],
                      ["card", "Card", "Debit / credit"],
                      ["netbanking", "Netbanking", "All major banks"],
                    ] as const
                  ).map(([id, name, sub]) => (
                    <button key={id} onClick={() => setMethod(id)} className={`p-4 text-left transition ${method === id ? "bg-graphite hairline-strong" : "hairline"}`} style={{ borderRadius: 3 }} aria-pressed={method === id}>
                      <span className="flex items-center justify-between">
                        <span className="display text-lg">{name}</span>
                        <span className={`h-3 w-3 rounded-full ${method === id ? "bg-ember" : "hairline-strong"}`} />
                      </span>
                      <span className="mt-1 block text-xs text-silver">{sub}</span>
                    </button>
                  ))}
                </div>
              )}
              <div className="mt-6 flex items-start gap-3 rounded-[3px] bg-graphite p-4 text-sm text-silver">
                <Icon name="shield" size={18} className="mt-0.5 shrink-0 text-ivory" />
                <p>Demo checkout — no payment is taken. In production this step hands off to the payment gateway, and your details never touch our servers.</p>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col items-center">
              <p className="label mb-6 flex items-center gap-2 text-ember">
                <Icon name="check" size={14} /> {free ? "Spot reserved" : "Payment confirmed"}
              </p>
              {/* Digital ticket */}
              <motion.div initial={{ rotateX: 30, y: 40, opacity: 0 }} animate={{ rotateX: 0, y: 0, opacity: 1 }} transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }} className="w-full max-w-sm [perspective:1000px]">
                <div className="chamfer overflow-hidden bg-ivory text-ink" style={{ ["--cut" as string]: "18px" }}>
                  <div className="bg-ink p-5 text-ivory">
                    <p className="label !text-[9px]">{organiser}</p>
                    <p className="display mt-2 text-2xl">{e.title}</p>
                    <p className="label mt-2 text-ivory">{routeLabel}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-px bg-ink/10">
                    {[
                      ["Date", `${dayNum(e.date)} ${monthShort(e.date)}`],
                      ["Day", weekday(e.date)],
                      ["Time", e.timeTbc ? "TBA" : time(e.date)],
                    ].map(([k, val]) => (
                      <div key={k} className="bg-ivory p-3">
                        <p className="font-mono text-[9px] uppercase tracking-widest text-ink/50">{k}</p>
                        <p className="readout mt-0.5 font-semibold">{val}</p>
                      </div>
                    ))}
                  </div>
                  <div className="relative border-t border-dashed border-ink/25">
                    <span className="absolute -left-3 -top-3 h-6 w-6 rounded-full bg-ink" />
                    <span className="absolute -right-3 -top-3 h-6 w-6 rounded-full bg-ink" />
                  </div>
                  <div className="flex flex-col items-center p-6">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {qr ? <img src={qr} alt={`QR ticket ${ref}`} className="h-48 w-48" /> : <div className="h-48 w-48 animate-pulse bg-ink/10" />}
                    <p className="readout mt-3 text-sm font-semibold">{ref}</p>
                    <p className="mt-1 text-sm">{form.name || "Ticket holder"}</p>
                    <p className="font-mono text-[10px] uppercase tracking-widest text-ink/60">{lines.map((l) => `${l.n} × ${l.t.name}`).join(" · ")}</p>
                  </div>
                </div>
              </motion.div>
              <p className="mt-6 max-w-sm text-center text-sm text-silver">Show this QR at check-in. A copy has been sent to {form.email || "your email"}.</p>
              <div className="mt-6 flex gap-3">
                <Link href={`/events/${e.slug}`} className="btn btn-ghost chamfer">
                  Back to event
                </Link>
                <Link href="/garage" className="btn btn-primary chamfer">
                  My tickets
                </Link>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Summary + nav */}
      {step < 3 && (
        <div className="mt-10 border-t border-line pt-6">
          <dl className="space-y-2 text-sm">
            {lines.map((l) => (
              <div key={l.t.id} className="flex justify-between text-silver">
                <dt>
                  {l.n} × {l.t.name}
                </dt>
                <dd className="readout">{inr(l.t.price * l.n)}</dd>
              </div>
            ))}
            {!free && (
              <div className="flex justify-between text-silver">
                <dt>Platform fee ({feePct}%)</dt>
                <dd className="readout">{inr(fee)}</dd>
              </div>
            )}
            <div className="flex items-baseline justify-between border-t border-line pt-3">
              <dt className="label text-ivory">Total</dt>
              <dd className="readout text-2xl">{free ? "Free" : inr(total)}</dd>
            </div>
          </dl>
            {error && (
              <p role="alert" className="mb-3 text-sm text-ember">
                {error}
              </p>
            )}
          <div className="mt-6 flex gap-3">
            {step > 0 && (
              <button onClick={() => setStep(step - 1)} className="btn btn-ghost chamfer">
                <Icon name="arrowLeft" size={15} /> Back
              </button>
            )}
            {step === 0 && (
              <button disabled={count === 0} onClick={() => setStep(1)} className="btn btn-primary chamfer flex-1">
                Continue · {count} {count === 1 ? "ticket" : "tickets"}
              </button>
            )}
            {step === 1 && (
              <button disabled={!detailsOk} onClick={() => setStep(2)} className="btn btn-primary chamfer flex-1">
                Continue
              </button>
            )}
            {step === 2 && (
              <button disabled={paying} onClick={confirm} className="btn btn-ember chamfer flex-1">
                {paying ? "Processing…" : free ? "Confirm reservation" : `Pay ${inr(total)}`}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
