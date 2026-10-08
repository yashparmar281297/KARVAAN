"use client";

import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import type { City, Club, ClubCategory, State } from "@/lib/types";
import { ClubCard } from "../cards/ClubCard";
import { Icon } from "../ui/Icon";
import { EmptyState, FilterSelect } from "../ui/FilterSelect";

const CATEGORIES: ClubCategory[] = ["Supercar", "Superbike", "Car", "Bike", "Modification", "Classic", "JDM", "Performance"];

export function ClubDirectory({ clubs, cities, states, initialCategory = "" }: { clubs: Club[]; cities: City[]; states: State[]; initialCategory?: string }) {
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [category, setCategory] = useState(initialCategory);
  const [kind, setKind] = useState("");
  const [verified, setVerified] = useState(false);

  const cityOf = (slug: string) => cities.find((c) => c.slug === slug);
  const statesWithClubs = states.filter((s) => clubs.some((c) => cityOf(c.city)?.state === s.code));
  const citiesInState = cities.filter((c) => (!state || c.state === state) && clubs.some((cl) => cl.city === c.slug));

  const shown = useMemo(
    () =>
      clubs.filter((c) => {
        const ci = cityOf(c.city);
        return (
          (!state || ci?.state === state) &&
          (!city || c.city === city) &&
          (!category || c.category === category) &&
          (!kind || c.kind === kind || c.kind === "mixed") &&
          (!verified || c.verified)
        );
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [clubs, state, city, category, kind, verified],
  );

  const reset = () => {
    setState("");
    setCity("");
    setCategory("");
    setKind("");
    setVerified(false);
  };

  const stateName = states.find((s) => s.code === state)?.name;
  const cityName = cityOf(city)?.name;

  return (
    <div>
      {/* Geographic breadcrumb — India → State → City */}
      <nav aria-label="Location" className="label mb-6 flex flex-wrap items-center gap-2 text-ivory">
        <button onClick={() => { setState(""); setCity(""); }} className={state ? "text-silver hover:text-ivory" : ""}>
          India
        </button>
        {stateName && (
          <>
            <Icon name="arrow" size={11} className="text-ember" />
            <button onClick={() => setCity("")} className={city ? "text-silver hover:text-ivory" : ""}>
              {stateName}
            </button>
          </>
        )}
        {cityName && (
          <>
            <Icon name="arrow" size={11} className="text-ember" />
            <span>{cityName}</span>
          </>
        )}
        <span className="ml-2 text-mute">· {shown.length} clubs</span>
      </nav>

      <div className="no-scrollbar -mx-4 mb-6 flex gap-2 overflow-x-auto px-4">
        <button className="chip" data-active={!category} onClick={() => setCategory("")}>
          All
        </button>
        {CATEGORIES.map((c) => (
          <button key={c} className="chip" data-active={category === c} onClick={() => setCategory(category === c ? "" : c)}>
            {c}
          </button>
        ))}
      </div>

      <div className="mb-10 grid grid-cols-2 gap-3 md:grid-cols-4">
        <FilterSelect label="State" value={state} onChange={(v) => { setState(v); setCity(""); }} options={[{ value: "", label: "All states" }, ...statesWithClubs.map((s) => ({ value: s.code, label: s.name }))]} />
        <FilterSelect label="City" value={city} onChange={setCity} options={[{ value: "", label: "All cities" }, ...citiesInState.map((c) => ({ value: c.slug, label: c.name }))]} />
        <FilterSelect label="Vehicle" value={kind} onChange={setKind} options={[{ value: "", label: "Cars & bikes" }, { value: "car", label: "Cars" }, { value: "bike", label: "Bikes" }]} />
        <label className="block">
          <span className="label mb-2 block !text-[9.5px] text-mute">Status</span>
          <button onClick={() => setVerified((v) => !v)} data-active={verified} className="chip !h-11 w-full justify-center" aria-pressed={verified}>
            <Icon name="check" size={13} /> Verified only
          </button>
        </label>
      </div>

      {shown.length === 0 ? (
        <EmptyState onReset={reset} />
      ) : (
        <motion.div className="card-grid">
          <AnimatePresence mode="popLayout">
            {shown.map((c) => (
              <motion.div key={c.slug} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
                <ClubCard c={c} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
