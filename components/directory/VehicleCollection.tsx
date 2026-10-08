"use client";

import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { VehicleCard, type VehicleCardProps } from "../cards/VehicleCard";
import { EmptyState, FilterSelect } from "../ui/FilterSelect";

export function VehicleCollection({ cards, cityNames, initialClass = "" }: { cards: VehicleCardProps[]; cityNames: Record<string, string>; initialClass?: string }) {
  const [cls, setCls] = useState(initialClass);
  const [make, setMake] = useState("");
  const [city, setCity] = useState("");
  const [sort, setSort] = useState("serial");

  const classes = [...new Set(cards.map((c) => c.v.class))];
  const makes = [...new Set(cards.map((c) => c.v.make))].sort();
  // Private owners' vehicles are excluded from city filtering so their city can't be inferred.
  const cities = [...new Set(cards.filter((c) => c.owner?.privacy !== "private").map((c) => c.v.city))];

  const shown = useMemo(() => {
    const list = cards.filter(
      (c) => (!cls || c.v.class === cls) && (!make || c.v.make === make) && (!city || (c.v.city === city && c.owner?.privacy !== "private")),
    );
    const key: Record<string, (a: VehicleCardProps, b: VehicleCardProps) => number> = {
      serial: (a, b) => a.v.serial - b.v.serial,
      power: (a, b) => b.v.spec.power - a.v.spec.power,
      newest: (a, b) => (b.v.year ?? 0) - (a.v.year ?? 0),
      oldest: (a, b) => (a.v.year ?? 0) - (b.v.year ?? 0),
    };
    return [...list].sort(key[sort]);
  }, [cards, cls, make, city, sort]);

  const reset = () => {
    setCls("");
    setMake("");
    setCity("");
  };

  return (
    <div>
      <div className="no-scrollbar -mx-4 mb-6 flex gap-2 overflow-x-auto px-4">
        <button className="chip" data-active={!cls} onClick={() => setCls("")}>
          All <span className="readout opacity-60">{cards.length}</span>
        </button>
        {classes.map((c) => (
          <button key={c} className="chip" data-active={cls === c} onClick={() => setCls(cls === c ? "" : c)}>
            {c} <span className="readout opacity-60">{cards.filter((x) => x.v.class === c).length}</span>
          </button>
        ))}
      </div>
      <div className="mb-10 grid grid-cols-2 gap-3 md:grid-cols-3">
        <FilterSelect label="Make" value={make} onChange={setMake} options={[{ value: "", label: "All makes" }, ...makes.map((m) => ({ value: m, label: m }))]} />
        <FilterSelect label="City" value={city} onChange={setCity} options={[{ value: "", label: "All cities" }, ...cities.map((c) => ({ value: c, label: cityNames[c] ?? c }))]} />
        <FilterSelect label="Sort" value={sort} onChange={setSort} options={[{ value: "serial", label: "Collection no." }, { value: "power", label: "Most powerful" }, { value: "newest", label: "Newest" }, { value: "oldest", label: "Oldest" }]} />
      </div>
      {shown.length === 0 ? (
        <EmptyState onReset={reset} />
      ) : (
        <motion.div className="card-grid">
          <AnimatePresence mode="popLayout">
            {shown.map((c, i) => (
              <motion.div key={c.v.slug} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.5, delay: Math.min(i, 8) * 0.04, ease: [0.16, 1, 0.3, 1] }}>
                <VehicleCard {...c} priority={i < 4} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
