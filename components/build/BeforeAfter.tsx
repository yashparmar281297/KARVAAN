"use client";

import Image from "next/image";
import { useRef, useState } from "react";

/** Drag the divider to compare stock vs built. Keyboard: arrow keys. */
export function BeforeAfter({ before, after, alt, sameShot }: { before: string; after: string; alt: string; sameShot?: boolean }) {
  const [pos, setPos] = useState(50);
  const box = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const update = (clientX: number) => {
    const r = box.current!.getBoundingClientRect();
    setPos(Math.min(100, Math.max(0, ((clientX - r.left) / r.width) * 100)));
  };
  return (
    <div
      ref={box}
      className="relative aspect-[16/9] cursor-ew-resize touch-pan-y select-none overflow-hidden bg-graphite"
      style={{ borderRadius: 3 }}
      onPointerDown={(e) => {
        dragging.current = true;
        update(e.clientX);
      }}
      onPointerMove={(e) => dragging.current && update(e.clientX)}
      onPointerUp={() => (dragging.current = false)}
      onPointerLeave={() => (dragging.current = false)}
    >
      <Image src={after} alt={`${alt} — after`} fill sizes="(max-width: 1024px) 100vw, 70vw" className="object-cover" draggable={false} />
      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        {/* Same photo on both sides? Render "before" as the stock, unlit car. */}
        <Image src={before} alt={`${alt} — before`} fill sizes="(max-width: 1024px) 100vw, 70vw" className={`object-cover ${sameShot ? "brightness-[.55] contrast-[.9] grayscale" : ""}`} draggable={false} />
      </div>
      <span className="label absolute left-4 top-4 rounded-full bg-ink/70 px-2.5 py-1 text-ivory backdrop-blur">Stock</span>
      <span className="label absolute right-4 top-4 rounded-full bg-ember px-2.5 py-1 !text-ink">Built</span>
      <div className="absolute inset-y-0 w-px bg-ivory" style={{ left: `${pos}%` }}>
        <button
          role="slider"
          aria-label="Compare before and after"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(pos)}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") setPos((p) => Math.max(0, p - 5));
            if (e.key === "ArrowRight") setPos((p) => Math.min(100, p + 5));
          }}
          className="absolute left-1/2 top-1/2 grid h-12 w-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-ivory text-ink shadow-xl"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
            <path d="M9 6 3 12l6 6M15 6l6 6-6 6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
