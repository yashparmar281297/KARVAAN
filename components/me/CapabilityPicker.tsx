"use client";

import { CAPABILITIES } from "@/lib/capabilities";

/** "What describes you?" — pick any number (one account, many roles). */
export function CapabilityPicker({ value, onChange }: { value: string[]; onChange: (caps: string[]) => void }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {CAPABILITIES.map((c) => {
        const on = value.includes(c.id);
        return (
          <label key={c.id} className={`flex cursor-pointer items-start gap-3 rounded-[3px] p-3 transition hairline ${on ? "bg-charcoal" : "bg-graphite hover:bg-charcoal"}`}>
            <input type="checkbox" checked={on} onChange={() => onChange(on ? value.filter((x) => x !== c.id) : [...value, c.id])} className="mt-1 accent-[var(--color-ember)]" />
            <span>
              <span className="block text-sm text-ivory">{c.label}</span>
              <span className="mt-0.5 block text-xs text-mute">{c.hint}</span>
            </span>
          </label>
        );
      })}
    </div>
  );
}
