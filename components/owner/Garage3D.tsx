"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { pad } from "@/lib/format";
import type { Vehicle } from "@/lib/types";
import { Icon } from "../ui/Icon";
import { FittedImage } from "../ui/FittedImage";

/**
 * The owner's collection on a turntable. Drag/swipe to rotate, arrows or
 * keys to step; the bay facing you is the selected vehicle. Tap it to open.
 */
export function Garage3D({ vehicles }: { vehicles: Vehicle[] }) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const n = vehicles.length;
  const stepDeg = 360 / n;
  const rot = useMotionValue(0);
  const [active, setActive] = useState(0);
  const [radius, setRadius] = useState(520);
  const wrap = useRef<HTMLDivElement>(null);
  const dragStart = useRef<{ x: number; rot: number; moved: boolean } | null>(null);

  useEffect(() => {
    const onResize = () => {
      const w = wrap.current?.clientWidth ?? 1000;
      const cardW = w < 640 ? w * 0.62 : 300;
      // Radius that keeps neighbours from overlapping.
      setRadius(Math.max(cardW * 0.9, cardW / (2 * Math.tan(Math.PI / n)) + 40));
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [n]);

  useEffect(() => rot.on("change", (r) => setActive(((Math.round(-r / stepDeg) % n) + n) % n)), [rot, stepDeg, n]);

  const snapTo = (target: number) => animate(rot, target, reduce ? { duration: 0 } : { type: "spring", stiffness: 90, damping: 18 });
  const step = (dir: 1 | -1) => snapTo(Math.round(rot.get() / stepDeg) * stepDeg - dir * stepDeg);
  const goTo = (i: number) => {
    const current = Math.round(-rot.get() / stepDeg);
    let delta = i - (((current % n) + n) % n);
    if (delta > n / 2) delta -= n;
    if (delta < -n / 2) delta += n;
    snapTo(-(current + delta) * stepDeg);
  };

  const ringRotate = useTransform(rot, (r) => `translateZ(${-radius}px) rotateY(${r}deg)`);
  const v = vehicles[active];

  return (
    <div
      ref={wrap}
      className="relative select-none"
      tabIndex={0}
      aria-roledescription="carousel"
      aria-label="Garage"
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") step(1);
        if (e.key === "ArrowLeft") step(-1);
        if (e.key === "Enter") router.push(`/vehicles/${v.slug}`);
      }}
    >
      {/* Floor */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-[radial-gradient(50%_60%_at_50%_100%,color-mix(in_srgb,var(--color-ivory)_7%,transparent),transparent)]" />
      <div
        className="relative h-[520px] touch-pan-y [perspective:1600px]"
        onPointerDown={(e) => {
          dragStart.current = { x: e.clientX, rot: rot.get(), moved: false };
          (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        }}
        onPointerMove={(e) => {
          const d = dragStart.current;
          if (!d) return;
          const dx = e.clientX - d.x;
          if (Math.abs(dx) > 5) d.moved = true;
          rot.set(d.rot + dx * 0.25);
        }}
        onPointerUp={() => {
          const d = dragStart.current;
          if (d?.moved) snapTo(Math.round(rot.get() / stepDeg) * stepDeg);
          setTimeout(() => (dragStart.current = null), 0);
        }}
        onPointerCancel={() => {
          dragStart.current = null;
          snapTo(Math.round(rot.get() / stepDeg) * stepDeg);
        }}
      >
        <motion.div className="absolute left-1/2 top-1/2 h-0 w-0 [transform-style:preserve-3d]" style={{ transform: ringRotate }}>
          {vehicles.map((veh, i) => (
            <button
              key={veh.slug}
              onClick={() => {
                if (dragStart.current?.moved) return;
                if (i === active) router.push(`/vehicles/${veh.slug}`);
                else goTo(i);
              }}
              className="chamfer metal absolute -left-[150px] -top-[220px] h-[440px] w-[300px] p-2.5"
              style={{ transform: `rotateY(${i * stepDeg}deg) translateZ(${radius}px)`, ["--cut" as string]: "16px" }}
              aria-label={`${veh.make} ${veh.model}${i === active ? " — open" : ""}`}
            >
              <span className={`absolute inset-0 transition-opacity duration-500 ${i === active ? "opacity-0" : "opacity-60"} z-10 bg-ink`} />
              <span className="relative block aspect-[4/5] overflow-hidden rounded-[2px]">
                <FittedImage src={veh.image} alt="" sizes="300px" />
              </span>
              <span className="block px-2 pt-3 text-left">
                <span className="flex items-center justify-between">
                  <span className="label !text-[9.5px]">{veh.make}</span>
                  <span className="readout text-[10px] text-mute">No.{pad(veh.serial)}</span>
                </span>
                <span className="display mt-1 block text-lg leading-tight [overflow-wrap:anywhere]">{veh.model}</span>
                <span className="label mt-2 block !text-[9.5px] text-mute">
                  {[veh.kind === "bike" ? "Bike" : "Car", veh.year].filter(Boolean).join(" · ")}
                </span>
              </span>
            </button>
          ))}
        </motion.div>
      </div>

      {/* Selected readout */}
      <div className="relative mt-4 flex flex-col items-center gap-5 text-center">
        <AnimatePresence mode="wait">
          <motion.div key={v.slug} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.35 }}>
            <p className="label">
              {v.class} · {v.spec.power.toLocaleString("en-IN")}{v.spec.powerPlus ? "+" : ""} HP · {v.spec.engine}
            </p>
          </motion.div>
        </AnimatePresence>
        <div className="flex items-center gap-3">
          <button onClick={() => step(-1)} aria-label="Previous vehicle" className="grid h-11 w-11 place-items-center rounded-full hairline-strong transition hover:bg-ivory hover:text-ink">
            <Icon name="arrowLeft" size={16} />
          </button>
          <Link href={`/vehicles/${v.slug}`} className="btn btn-primary chamfer">
            Open {v.model} <Icon name="arrow" size={15} />
          </Link>
          <button onClick={() => step(1)} aria-label="Next vehicle" className="grid h-11 w-11 place-items-center rounded-full hairline-strong transition hover:bg-ivory hover:text-ink">
            <Icon name="arrow" size={16} />
          </button>
        </div>
        <div className="flex gap-1.5">
          {vehicles.map((x, i) => (
            <button key={x.slug} onClick={() => goTo(i)} aria-label={`Go to ${x.model}`} className={`h-1 transition-all ${i === active ? "w-8 bg-ivory" : "w-3 bg-line-strong"}`} />
          ))}
        </div>
      </div>
    </div>
  );
}
