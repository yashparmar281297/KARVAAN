"use client";

import { useMemo, useState } from "react";
import { VehicleCard, type VehicleCardProps } from "../cards/VehicleCard";
import { Rail } from "../ui/Rail";
import { SectionHead } from "../ui/SectionHead";

const TABS = [
  { id: "all", label: "All" },
  { id: "car", label: "Cars" },
  { id: "bike", label: "Bikes" },
] as const;

/**
 * Featured vehicles: section title with the Cars/Bikes filter beside it (saves
 * a row), then one row of cards. Each slot is exactly one card wide (--card-w),
 * so there are no gaps and the whole section fits one screen.
 */
export function CollectionRail({ index, cards }: { index: string; cards: VehicleCardProps[] }) {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("all");
  const shown = useMemo(() => cards.filter((c) => tab === "all" || c.v.kind === tab), [cards, tab]);
  // Only offer the filter when there is something to filter (tablet/desktop — on
  // phones the row simply scrolls through everything, keeping the section one screen tall).
  const mixed = cards.some((c) => c.v.kind === "car") && cards.some((c) => c.v.kind === "bike");
  return (
    <>
      <SectionHead
        index={index}
        eyebrow="The collection"
        title={["Featured vehicles"]}
        href="/cars"
        cta="Full collection"
        aside={
          mixed && (
            <div className="hidden gap-2 sm:flex" role="tablist" aria-label="Filter collection">
              {TABS.map((t) => (
                <button key={t.id} role="tab" aria-selected={tab === t.id} data-active={tab === t.id} onClick={() => setTab(t.id)} className="chip">
                  {t.label}
                  <span className="readout opacity-60">{cards.filter((c) => t.id === "all" || c.v.kind === t.id).length}</span>
                </button>
              ))}
            </div>
          )
        }
      />
      {/* Phones: the first four cards, two per row (the rest are in "Full collection"). */}
      <div className="card-grid sm:hidden">
        {shown.slice(0, 4).map((c, i) => (
          <VehicleCard key={c.v.slug} {...c} priority={i < 2} tilt={false} />
        ))}
      </div>
      <div className="hidden sm:block">
        <Rail key={tab} label="Featured vehicles" itemClass="w-[var(--card-w)]">
          {shown.map((c, i) => (
            <VehicleCard key={c.v.slug} {...c} priority={i < 2} tilt={false} />
          ))}
        </Rail>
      </div>
    </>
  );
}
