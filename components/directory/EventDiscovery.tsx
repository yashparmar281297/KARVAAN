"use client";

import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { fromPrice } from "@/lib/data";
import type { Brand, City, Club, Event, EventCategory } from "@/lib/types";
import { EventCard, type EventCardMeta } from "../cards/EventCard";
import { EmptyState, FilterSelect } from "../ui/FilterSelect";

const CATS: EventCategory[] = ["Meetup", "Drive", "Ride", "Track Day", "Brand Experience", "Launch", "Exhibition", "Modification Meet", "Road Trip", "Community"];
const monthKey = (iso: string) => new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", month: "long", year: "numeric" }).format(new Date(iso));

export function EventDiscovery({ events, meta, cities, clubs, brands, initialCategory = "" }: { events: Event[]; meta: Record<string, EventCardMeta>; cities: City[]; clubs: Club[]; brands: Brand[]; initialCategory?: string }) {
  const [cat, setCat] = useState<string>(initialCategory);
  const [city, setCity] = useState("");
  const [month, setMonth] = useState("");
  const [kind, setKind] = useState("");
  const [price, setPrice] = useState("");
  const [club, setClub] = useState("");
  const [brand, setBrand] = useState("");

  const months = [...new Set(events.map((e) => monthKey(e.date)))];
  const shown = useMemo(
    () =>
      events.filter(
        (e) =>
          (!cat || (cat === "routed" ? !!e.route : e.category === cat)) &&
          (!city || e.city === city) &&
          (!month || monthKey(e.date) === month) &&
          (!kind || e.kind === kind || e.kind === "mixed") &&
          (!price || (price === "free" ? fromPrice(e) === 0 : fromPrice(e) > 0)) &&
          (!club || e.organizer === club) &&
          (!brand || e.sponsors.includes(brand)),
      ),
    [events, cat, city, month, kind, price, club, brand],
  );
  const grouped = months.map((m) => [m, shown.filter((e) => monthKey(e.date) === m)] as const).filter(([, list]) => list.length);
  const usedCats = CATS.filter((c) => events.some((e) => e.category === c));
  const reset = () => {
    setCat("");
    setCity("");
    setMonth("");
    setKind("");
    setPrice("");
    setClub("");
    setBrand("");
  };

  return (
    <div>
      <div className="no-scrollbar -mx-4 mb-6 flex gap-2 overflow-x-auto px-4">
        <button className="chip" data-active={!cat} onClick={() => setCat("")}>
          All
        </button>
        <button className="chip" data-active={cat === "routed"} onClick={() => setCat(cat === "routed" ? "" : "routed")}>
          Drives &amp; rides
        </button>
        {usedCats.map((c) => (
          <button key={c} className="chip" data-active={cat === c} onClick={() => setCat(cat === c ? "" : c)}>
            {c}
          </button>
        ))}
      </div>
      <div className="mb-8 grid grid-cols-3 gap-2 md:gap-3 xl:grid-cols-6">
        <FilterSelect label="City" value={city} onChange={setCity} options={[{ value: "", label: "Anywhere" }, ...cities.filter((c) => events.some((e) => e.city === c.slug)).map((c) => ({ value: c.slug, label: c.name }))]} />
        <FilterSelect label="Date" value={month} onChange={setMonth} options={[{ value: "", label: "Any time" }, ...months.map((m) => ({ value: m, label: m }))]} />
        <FilterSelect label="Car / Bike" value={kind} onChange={setKind} options={[{ value: "", label: "Both" }, { value: "car", label: "Cars" }, { value: "bike", label: "Bikes" }]} />
        <FilterSelect label="Price" value={price} onChange={setPrice} options={[{ value: "", label: "Free & paid" }, { value: "free", label: "Free" }, { value: "paid", label: "Paid" }]} />
        <FilterSelect label="Club" value={club} onChange={setClub} options={[{ value: "", label: "Any club" }, ...clubs.filter((c) => events.some((e) => e.organizer === c.slug)).map((c) => ({ value: c.slug, label: c.name }))]} />
        <FilterSelect label="Brand" value={brand} onChange={setBrand} options={[{ value: "", label: "Any brand" }, ...brands.filter((b) => events.some((e) => e.sponsors.includes(b.slug))).map((b) => ({ value: b.slug, label: b.name }))]} />
      </div>

      {grouped.length === 0 ? (
        <EmptyState onReset={reset} />
      ) : (
        grouped.map(([m, list]) => (
          <div key={m} className="mb-10">
            <div className="mb-6 flex items-baseline gap-3 sm:gap-4">
              <h2 className="display min-w-0 text-[clamp(1.4rem,7vw,1.875rem)]">{m.split(" ")[0]}</h2>
              <span className="label shrink-0">{m.split(" ")[1]}</span>
              <span className="h-px min-w-4 flex-1 bg-line" />
              <span className="label shrink-0">
                {list.length} {list.length === 1 ? "event" : "events"}
              </span>
            </div>
            <motion.div className="card-grid">
              <AnimatePresence mode="popLayout">
                {list.map((e) => (
                  <motion.div key={e.slug} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}>
                    <EventCard e={e} meta={meta[e.slug]} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          </div>
        ))
      )}
    </div>
  );
}
