"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState, type ReactNode } from "react";

export interface TabDef {
  id: string;
  label: string;
  count?: number;
  content: ReactNode;
}

/** Sticky underline tabs; panels are server-rendered and passed in. */
export function Tabs({ tabs, sticky = true }: { tabs: TabDef[]; sticky?: boolean }) {
  const [active, setActive] = useState(tabs[0]?.id);
  const current = tabs.find((t) => t.id === active) ?? tabs[0];
  return (
    <div>
      <div className={`${sticky ? "sticky top-0 z-30" : ""} -mx-4 border-b border-line bg-ink/85 px-4 backdrop-blur-xl md:-mx-8 md:px-8 xl:-mx-12 xl:px-12`}>
        <div role="tablist" className="no-scrollbar flex gap-1 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={t.id === active}
              onClick={() => setActive(t.id)}
              className={`label relative flex h-14 shrink-0 items-center gap-2 px-4 transition-colors ${t.id === active ? "!text-ivory" : "hover:text-ivory"}`}
            >
              {t.label}
              {t.count !== undefined && <span className="readout text-[10px] text-mute">{t.count}</span>}
              {t.id === active && <motion.span layoutId="tab-line" className="absolute inset-x-3 bottom-0 h-px bg-ember" />}
            </button>
          ))}
        </div>
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={current.id} role="tabpanel" className="pt-10" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}>
          {current.content}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
