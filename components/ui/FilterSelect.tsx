"use client";

export function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block min-w-0">
      <span className="label mb-2 block !text-[9.5px] text-mute">{label}</span>
      <select className="field !h-11 text-sm" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="py-24 text-center">
      <p className="display text-2xl">Nothing on this road yet</p>
      <p className="mt-3 text-silver">Try widening your filters.</p>
      <button onClick={onReset} className="btn btn-ghost chamfer mt-6">
        Reset filters
      </button>
    </div>
  );
}
