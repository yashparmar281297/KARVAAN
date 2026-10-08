"use client";

import { openSearch } from "@/components/nav/searchBus";
import { Icon } from "@/components/ui/Icon";
import { SEARCH_EXAMPLES } from "@/lib/data";

export function SearchLauncher() {
  return (
    <div className="mt-10 max-w-2xl">
      <button onClick={() => openSearch()} className="flex h-16 w-full items-center gap-4 rounded-[3px] bg-graphite px-5 text-left text-mute transition hover:text-silver hairline-strong">
        <Icon name="search" size={20} className="text-ivory" />
        <span className="flex-1 text-[17px]">Try “Huracán Tecnica” or “Malwa Supercar Club”</span>
        <kbd className="label rounded-[2px] px-2 py-1 hairline">⌘K</kbd>
      </button>
      <div className="mt-4 flex flex-wrap gap-2">
        {SEARCH_EXAMPLES.slice(0, 4).map((q) => (
          <button key={q} onClick={() => openSearch(q)} className="chip normal-case !tracking-normal">
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}
