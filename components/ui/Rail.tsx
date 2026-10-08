"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Icon } from "./Icon";

/**
 * Horizontal collection rail. Native scroll-snap for touch, mouse-drag
 * for desktop, arrow controls + progress hairline. Items bleed to the
 * viewport edge on the right like a physical shelf.
 */
export function Rail({ children, label, itemClass = "w-[78vw] sm:w-[340px]" }: { children: ReactNode[]; label: string; itemClass?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [edges, setEdges] = useState({ start: true, end: false });
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onScroll = () => {
      const max = el.scrollWidth - el.clientWidth;
      setProgress(max > 0 ? el.scrollLeft / max : 0);
      setEdges({ start: el.scrollLeft < 8, end: el.scrollLeft > max - 8 });
    };
    onScroll();
    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const step = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    const item = el.querySelector<HTMLElement>("[data-rail-item]");
    el.scrollBy({ left: dir * ((item?.offsetWidth ?? 320) + 20) * 2, behavior: "smooth" });
  };

  return (
    <div className="min-w-0">
      <div
        ref={ref}
        role="region"
        aria-label={label}
        className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 pb-4 pt-2 md:-mx-8 md:gap-5 md:scroll-px-8 md:px-8 xl:-mx-12 xl:scroll-px-12 xl:px-12"
        onPointerDown={(e) => {
          if (e.pointerType !== "mouse" || !ref.current) return;
          drag.current = { x: e.clientX, left: ref.current.scrollLeft, moved: false };
        }}
        onPointerMove={(e) => {
          const d = drag.current;
          if (!d || !ref.current) return;
          const dx = e.clientX - d.x;
          if (Math.abs(dx) > 4) {
            d.moved = true;
            ref.current.style.scrollSnapType = "none";
            ref.current.scrollLeft = d.left - dx;
          }
        }}
        onPointerUp={() => {
          if (ref.current) ref.current.style.scrollSnapType = "";
          setTimeout(() => (drag.current = null), 0);
        }}
        onPointerLeave={() => {
          if (ref.current) ref.current.style.scrollSnapType = "";
          drag.current = null;
        }}
        onClickCapture={(e) => {
          if (drag.current?.moved) {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
      >
        {children.map((child, i) => (
          <div key={i} data-rail-item className={`shrink-0 snap-start ${itemClass}`}>
            {child}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-6">
        <div className="relative h-px flex-1 bg-line">
          <div className="absolute inset-y-0 left-0 bg-ivory transition-[width] duration-300" style={{ width: `${Math.max(8, progress * 100)}%` }} />
        </div>
        <div className="hidden gap-2 md:flex">
          <button aria-label="Previous" disabled={edges.start} onClick={() => step(-1)} className="grid h-8 w-8 place-items-center rounded-full hairline-strong transition hover:bg-ivory hover:text-ink disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-ivory">
            <Icon name="arrowLeft" size={15} />
          </button>
          <button aria-label="Next" disabled={edges.end} onClick={() => step(1)} className="grid h-8 w-8 place-items-center rounded-full hairline-strong transition hover:bg-ivory hover:text-ink disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-ivory">
            <Icon name="arrow" size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
