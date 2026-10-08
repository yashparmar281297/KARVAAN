"use client";

import { useMemo, useState } from "react";
import type { Business, BusinessCategory, City } from "@/lib/types";
import { BusinessCard } from "../cards/BusinessCard";
import { Icon } from "../ui/Icon";
import { EmptyState, FilterSelect } from "../ui/FilterSelect";

const CATS: BusinessCategory[] = ["Detailing", "PPF", "Ceramic Coating", "Performance Tuning", "Modification", "Servicing", "Luxury Dealership", "Supercar Rental", "Photography", "Insurance", "Accessories", "Workshop"];

export function BusinessDirectory({ businesses, cities, initialCategory = "" }: { businesses: Business[]; cities: City[]; initialCategory?: string }) {
  const [cat, setCat] = useState(initialCategory);
  const [city, setCity] = useState("");
  const [verified, setVerified] = useState(false);
  const [sort, setSort] = useState("rating");
  const shown = useMemo(
    () =>
      businesses
        .filter((b) => (!cat || b.categories.includes(cat as BusinessCategory)) && (!city || b.city === city) && (!verified || b.verified))
        .sort((a, b) => (sort === "rating" ? b.rating - a.rating : b.reviewCount - a.reviewCount)),
    [businesses, cat, city, verified, sort],
  );
  return (
    <div>
      <div className="no-scrollbar -mx-4 mb-6 flex gap-2 overflow-x-auto px-4">
        <button className="chip" data-active={!cat} onClick={() => setCat("")}>
          All
        </button>
        {CATS.map((c) => {
          const n = businesses.filter((b) => b.categories.includes(c)).length;
          return (
            <button key={c} className="chip" data-active={cat === c} onClick={() => setCat(cat === c ? "" : c)} disabled={n === 0} style={{ opacity: n ? 1 : 0.35 }}>
              {c}
            </button>
          );
        })}
      </div>
      <div className="mb-10 grid grid-cols-2 gap-3 md:grid-cols-3">
        <FilterSelect label="City" value={city} onChange={setCity} options={[{ value: "", label: "All cities" }, ...cities.filter((c) => businesses.some((b) => b.city === c.slug)).map((c) => ({ value: c.slug, label: c.name }))]} />
        <FilterSelect label="Sort" value={sort} onChange={setSort} options={[{ value: "rating", label: "Top rated" }, { value: "reviews", label: "Most reviewed" }]} />
        <label className="col-span-2 block md:col-span-1">
          <span className="label mb-2 block !text-[9.5px] text-mute">Status</span>
          <button onClick={() => setVerified((v) => !v)} data-active={verified} aria-pressed={verified} className="chip !h-11 w-full justify-center">
            <Icon name="check" size={13} /> Verified only
          </button>
        </label>
      </div>
      {shown.length ? (
        <div className="card-grid">
          {shown.map((b) => (
            <BusinessCard key={b.slug} b={b} />
          ))}
        </div>
      ) : (
        <EmptyState onReset={() => { setCat(""); setCity(""); setVerified(false); }} />
      )}
    </div>
  );
}
