"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, useTransition } from "react";
import { createEvent, updateEvent } from "@/app/(main)/studio/actions";
import { Icon } from "@/components/ui/Icon";
import { ImageField } from "@/components/upload/ImageField";
import { dayNum, inr, monthShort, weekday } from "@/lib/format";
import { SITE } from "@/lib/site";
import { STOP_ICON, STOP_LABEL } from "@/lib/stops";
import type { EventCategory, StopKind } from "@/lib/types";

const CATEGORIES: EventCategory[] = ["Meetup", "Drive", "Ride", "Road Trip", "Track Day", "Modification Meet", "Exhibition", "Launch", "Brand Experience", "Community"];
const ROUTED: EventCategory[] = ["Drive", "Ride", "Road Trip"];
const STOP_KINDS: StopKind[] = ["fuel", "food", "scenic", "photo"];

export interface TicketDraft {
  id: number;
  name: string;
  price: string;
  limited: boolean;
  slots: string;
  perks: string;
}
export interface StopDraft {
  id: number;
  name: string;
  kind: StopKind;
  km: string;
}

let nextId = 100;

/** An existing event, shaped for the builder (edit mode). */
export interface EventDraft {
  id: string;
  host: string;
  fields: { title: string; category: EventCategory; kind: string; date: string; start: string; end: string; city: string; venue: string; summary: string; rules: string };
  cover: string;
  route: { from: string; to: string; distance: string; duration: string };
  status: "published" | "draft";
  stops: StopDraft[];
  tickets: TicketDraft[];
}

export function EventBuilder({ hosts, initialHost, cities, initial }: { hosts: { slug: string; name: string; city: string }[]; initialHost: string; cities: { slug: string; name: string }[]; initial?: EventDraft }) {
  const [host, setHost] = useState(initial?.host ?? initialHost);
  const router = useRouter();
  const [f, setF] = useState(() => initial?.fields ?? { title: "", category: "Drive" as EventCategory, kind: "car", date: new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10), start: "06:00", end: "11:00", city: hosts.find((h) => h.slug === initialHost)?.city ?? "indore", venue: "", summary: "", rules: "" });
  const [cover, setCover] = useState<string | undefined>(initial?.cover);
  const [route, setRoute] = useState(initial?.route ?? { from: "", to: "", distance: "", duration: "" });
  const [stops, setStops] = useState<StopDraft[]>(initial?.stops.length ? initial.stops : [{ id: 1, name: "", kind: "fuel", km: "" }]);
  const [tickets, setTickets] = useState<TicketDraft[]>(initial?.tickets.length ? initial.tickets : [{ id: 1, name: "General", price: "0", limited: false, slots: "", perks: "" }]);
  const [error, setError] = useState<string | null>(null);
  const draftRef = useRef(false); // which button submitted: publish or save as draft
  const [saving, startSaving] = useTransition();

  const routed = ROUTED.includes(f.category);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  const iso = `${f.date}T${f.start}:00+05:30`;
  const minPrice = Math.min(...tickets.map((t) => Number(t.price) || 0));
  const limitedTickets = tickets.filter((t) => t.limited);
  const totalSlots = limitedTickets.reduce((n, t) => n + (Number(t.slots) || 0), 0);
  const allOpen = limitedTickets.length === 0;
  const routeOk = !routed || (route.from.trim() && route.to.trim());
  const ticketsOk = tickets.every((t) => t.name.trim() && (!t.limited || Number(t.slots) > 0));
  const valid = f.title.trim().length > 2 && f.venue.trim() && f.summary.trim() && !!cover && !!host && routeOk && ticketsOk;

  const orderedStops = useMemo(() => [...stops].filter((s) => s.name.trim()).sort((a, b) => (Number(a.km) || 0) - (Number(b.km) || 0)), [stops]);
  const hostName = hosts.find((h) => h.slug === host)?.name;

  return (
    <div className="mt-14 grid gap-14 lg:grid-cols-[1fr_360px]">
      <form
        className="space-y-12"
        onSubmit={(e) => {
          e.preventDefault();
          if (!valid) return;
          setError(null);
          const status = draftRef.current ? "draft" : "published";
          startSaving(async () => {
            const input = {
              host,
              status,
              ...f,
              cover,
              rules: f.rules,
              route: routed ? { from: route.from, to: route.to, distance: route.distance, duration: route.duration, stops: orderedStops.map((s) => ({ name: s.name, kind: s.kind, km: s.km })) } : undefined,
              tickets: tickets.map((t) => ({ name: t.name, price: t.price, limited: t.limited, slots: t.slots, perks: t.perks })),
            };
            const res = initial ? await updateEvent(initial.id, input) : await createEvent(input);
            if (res.ok) router.push(res.href);
            else setError(res.error);
          });
        }}
      >
        {/* 01 Host */}
        <fieldset>
          <legend className="label mb-4">01 · Host</legend>
          <select className="field" value={host} onChange={(e) => setHost(e.target.value)} aria-label="Organised by">
            {hosts.map((h) => (
              <option key={h.slug} value={h.slug}>
                {h.name}
              </option>
            ))}
          </select>
          <p className="mt-2 text-xs text-mute">You&apos;re the organiser either way. Hosting it for a club you run puts it on the club&apos;s page too.</p>
        </fieldset>

        {/* 02 Basics */}
        <fieldset className="space-y-5">
          <legend className="label mb-4">02 · The event</legend>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button type="button" key={c} className="chip" data-active={f.category === c} onClick={() => setF({ ...f, category: c })}>
                {c}
              </button>
            ))}
          </div>
          <label className="block">
            <span className="label mb-2 block !text-[9.5px] text-mute">Title</span>
            <input className="field" value={f.title} onChange={set("title")} placeholder="Sunday Supercar Drive" required />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label>
              <span className="label mb-2 block !text-[9.5px] text-mute">For</span>
              <select className="field" value={f.kind} onChange={set("kind")}>
                <option value="car">Cars</option>
                <option value="bike">Bikes</option>
                <option value="mixed">Cars & bikes</option>
              </select>
            </label>
            <label>
              <span className="label mb-2 block !text-[9.5px] text-mute">City</span>
              <select className="field" value={f.city} onChange={set("city")}>
                {cities.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="label mb-2 block !text-[9.5px] text-mute">Date</span>
              <input type="date" className="field" value={f.date} onChange={set("date")} />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label>
                <span className="label mb-2 block !text-[9.5px] text-mute">Starts</span>
                <input type="time" className="field" value={f.start} onChange={set("start")} />
              </label>
              <label>
                <span className="label mb-2 block !text-[9.5px] text-mute">Ends</span>
                <input type="time" className="field" value={f.end} onChange={set("end")} />
              </label>
            </div>
          </div>
          <label className="block">
            <span className="label mb-2 block !text-[9.5px] text-mute">{routed ? "Meeting point" : "Venue"}</span>
            <input className="field" value={f.venue} onChange={set("venue")} placeholder={routed ? "Rajwada, Indore" : "Phoenix Citadel Rooftop"} required />
          </label>
          <ImageField kind="cover" value={cover} onChange={setCover} required />
          <label className="block">
            <span className="label mb-2 block !text-[9.5px] text-mute">What&apos;s the plan</span>
            <textarea className="field !h-28 py-3" required value={f.summary} onChange={set("summary")} placeholder="Convoy of 40 cars down the ghat, breakfast at the fort…" />
          </label>
          <label className="block">
            <span className="label mb-2 block !text-[9.5px] text-mute">Rules (one per line)</span>
            <textarea className="field !h-24 py-3" value={f.rules} onChange={set("rules")} placeholder={"Driver briefing at 5:30 AM\nNo overtaking on the ghat"} />
          </label>
        </fieldset>

        {/* 03 Route — only for drives/rides */}
        {routed && (
          <fieldset className="space-y-5">
            <legend className="label mb-4">03 · Route</legend>
            <p className="-mt-2 text-sm text-silver">The route is part of this event — it appears on the event page, the club&apos;s Drives tab and in search.</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <label>
                <span className="label mb-2 block !text-[9.5px] text-mute">Start</span>
                <input className="field" value={route.from} onChange={(e) => setRoute({ ...route, from: e.target.value })} placeholder="Indore" />
              </label>
              <label>
                <span className="label mb-2 block !text-[9.5px] text-mute">Destination</span>
                <input className="field" value={route.to} onChange={(e) => setRoute({ ...route, to: e.target.value })} placeholder="Mandu" />
              </label>
              <label>
                <span className="label mb-2 block !text-[9.5px] text-mute">Distance (km, optional)</span>
                <input className="field" inputMode="numeric" value={route.distance} onChange={(e) => setRoute({ ...route, distance: e.target.value.replace(/\D/g, "") })} placeholder="97" />
              </label>
              <label>
                <span className="label mb-2 block !text-[9.5px] text-mute">Drive time (min, optional)</span>
                <input className="field" inputMode="numeric" value={route.duration} onChange={(e) => setRoute({ ...route, duration: e.target.value.replace(/\D/g, "") })} placeholder="130" />
              </label>
            </div>
            <div>
              <p className="label mb-3 !text-[9.5px] text-mute">Stops</p>
              <div className="space-y-2">
                {stops.map((s) => (
                  <div key={s.id} className="grid grid-cols-[1fr_110px_70px_40px] gap-2">
                    <input className="field !h-11 text-sm" value={s.name} onChange={(e) => setStops(stops.map((x) => (x.id === s.id ? { ...x, name: e.target.value } : x)))} placeholder="Manpur Dhaba" aria-label="Stop name" />
                    <select className="field !h-11 text-sm" value={s.kind} onChange={(e) => setStops(stops.map((x) => (x.id === s.id ? { ...x, kind: e.target.value as StopKind } : x)))} aria-label="Stop type">
                      {STOP_KINDS.map((k) => (
                        <option key={k} value={k}>
                          {STOP_LABEL[k]}
                        </option>
                      ))}
                    </select>
                    <input className="field !h-11 text-sm" inputMode="numeric" value={s.km} onChange={(e) => setStops(stops.map((x) => (x.id === s.id ? { ...x, km: e.target.value.replace(/\D/g, "") } : x)))} placeholder="km" aria-label="Kilometre" />
                    <button type="button" onClick={() => setStops(stops.filter((x) => x.id !== s.id))} className="grid place-items-center text-mute hover:text-ivory" aria-label="Remove stop">
                      <Icon name="close" size={15} />
                    </button>
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => setStops([...stops, { id: nextId++, name: "", kind: "food", km: "" }])} className="chip mt-3">
                <Icon name="plus" size={12} /> Add stop
              </button>
              <p className="mt-3 text-xs text-mute">Stops are shown in order of distance from the start.</p>
            </div>
          </fieldset>
        )}

        {/* 04 Tickets */}
        <fieldset className="space-y-4">
          <legend className="label mb-4">{routed ? "04" : "03"} · Tickets</legend>
          {tickets.map((t) => {
            const upd = (patch: Partial<TicketDraft>) => setTickets(tickets.map((x) => (x.id === t.id ? { ...x, ...patch } : x)));
            return (
              <div key={t.id} className="space-y-3 bg-graphite p-4 hairline" style={{ borderRadius: 3 }}>
                <div className="grid grid-cols-[1fr_130px_40px] gap-2">
                  <input className="field !h-11 text-sm" value={t.name} onChange={(e) => upd({ name: e.target.value })} placeholder="Driver" aria-label="Ticket name" />
                  <label className="relative">
                    <span className="readout pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-mute">₹</span>
                    <input className="field !h-11 pl-7 text-sm" inputMode="numeric" value={t.price} onChange={(e) => upd({ price: e.target.value.replace(/\D/g, "") })} aria-label="Price, 0 for free" />
                  </label>
                  <button type="button" disabled={tickets.length === 1} onClick={() => setTickets(tickets.filter((x) => x.id !== t.id))} className="grid place-items-center text-mute hover:text-ivory disabled:opacity-30" aria-label="Remove ticket type">
                    <Icon name="close" size={15} />
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <button type="button" onClick={() => upd({ limited: !t.limited })} data-active={t.limited} aria-pressed={t.limited} className="chip">
                    {t.limited ? <Icon name="check" size={12} /> : null} Limit slots
                  </button>
                  {t.limited ? (
                    <input className="field !h-9 !w-28 text-sm" inputMode="numeric" value={t.slots} onChange={(e) => upd({ slots: e.target.value.replace(/\D/g, "") })} placeholder="Slots" aria-label="Number of slots" />
                  ) : (
                    <span className="text-xs text-mute">Open entry — no slot limit</span>
                  )}
                </div>
                <input className="field !h-11 text-sm" value={t.perks} onChange={(e) => upd({ perks: e.target.value })} placeholder="Perks, comma separated — Breakfast, Radio, Photos" aria-label="Perks" />
              </div>
            );
          })}
          <button type="button" onClick={() => setTickets([...tickets, { id: nextId++, name: "", price: "0", limited: false, slots: "", perks: "" }])} className="chip">
            <Icon name="plus" size={12} /> Add ticket type
          </button>
          <p className="text-xs text-mute">Paid tickets: buyers see a {SITE.platformFeePct}% platform fee at checkout. Free tickets have no fee.</p>
        </fieldset>

        {error && <p className="text-sm text-ember">{error}</p>}
        <div className="flex flex-wrap gap-3">
          <button disabled={!valid || saving} onClick={() => (draftRef.current = false)} className="btn btn-primary chamfer flex-1 disabled:opacity-50 sm:flex-none">
            {saving ? "Saving…" : initial && initial.status === "published" ? "Save changes" : "Publish event"} <Icon name="arrow" size={15} />
          </button>
          <button disabled={!valid || saving} onClick={() => (draftRef.current = true)} className="btn btn-ghost chamfer flex-1 disabled:opacity-50 sm:flex-none">
            {initial?.status === "published" ? "Unpublish (draft)" : "Save as draft"}
          </button>
        </div>
        {!valid && <p className="text-xs text-mute">Needs a title, venue, cover photo and description{routed ? ", plus route start and destination" : ""}.</p>}
      </form>

      {/* Live preview */}
      <div className="lg:sticky lg:top-24 lg:self-start">
        <p className="label mb-4 flex items-center gap-2">
          <Icon name="eye" size={13} /> Preview
        </p>
        <div className="overflow-hidden bg-graphite hairline" style={{ borderRadius: 3 }}>
          <div className="relative aspect-video">
            {cover ? (
              <Image src={cover} alt="" fill sizes="360px" className="object-cover" />
            ) : (
              <div className="absolute inset-0 grid place-items-center bg-[radial-gradient(circle_at_50%_40%,var(--color-charcoal),var(--color-ink))] text-mute">
                <Icon name="camera" size={28} />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/20 to-ink/30" />
            <span className="label absolute left-4 top-4 rounded-full bg-ink/70 px-2.5 py-1 text-ivory">{f.category}</span>
            <div className="absolute bottom-4 left-4 flex items-end gap-3">
              <span className="display text-[2.6rem] leading-[0.8]">{dayNum(iso)}</span>
              <span className="pb-1">
                <span className="label block text-ivory">{monthShort(iso)}</span>
                <span className="label block">
                  {weekday(iso)} · {f.start}
                </span>
              </span>
            </div>
          </div>
          <div className="p-5">
            <p className="display text-xl">{f.title || "Event title"}</p>
            <p className="label mt-2 flex items-center gap-1.5 text-ivory">
              {routed && route.from && route.to ? (
                <>
                  {route.from} <Icon name="arrow" size={12} className="text-ember" /> {route.to}
                </>
              ) : (
                cities.find((c) => c.slug === f.city)?.name
              )}
            </p>
            <p className="label mt-1.5 text-mute">By {hostName}</p>

            {routed && (
              <div className="mt-5">
                {/* Schematic route strip — stops placed by distance */}
                <div className="relative h-10">
                  <span className="absolute inset-x-2 top-1/2 h-[2px] -translate-y-1/2 bg-ember/60" />
                  <span className="absolute left-0 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-ink ring-2 ring-ivory" />
                  <span className="absolute right-0 top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full bg-ember" />
                  {orderedStops.map((s) => {
                    const pct = Math.min(94, Math.max(6, ((Number(s.km) || 0) / (Number(route.distance) || 100)) * 100));
                    return (
                      <span key={s.id} title={s.name} className="absolute top-1/2 grid h-6 w-6 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-ink text-silver hairline-strong" style={{ left: `${pct}%` }}>
                        <Icon name={STOP_ICON[s.kind]} size={11} />
                      </span>
                    );
                  })}
                </div>
                <p className="readout mt-1 text-sm">
                  {route.distance || "—"} <span className="label">km</span> · {route.duration || "—"} <span className="label">min</span>
                </p>
              </div>
            )}

            <div className="mt-5 flex items-end justify-between border-t border-line pt-4">
              <div>
                <p className="label !text-[9px] text-mute">{minPrice === 0 ? "Entry" : "From"}</p>
                <p className="readout text-xl">{inr(minPrice)}</p>
              </div>
              <div className="text-right">
                <p className="label !text-[9px] text-mute">{allOpen ? "Capacity" : "Slots"}</p>
                <p className="readout text-xl">{allOpen ? "Open entry" : totalSlots || "—"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
