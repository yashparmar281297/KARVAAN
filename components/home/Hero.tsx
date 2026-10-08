"use client";

import Link from "next/link";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import { useRef } from "react";
import { Icon } from "../ui/Icon";
import { FittedImage } from "../ui/FittedImage";

/** A fixed, generic stock photo — never a member's car — so the hero never changes with the data. */
export const HERO_IMAGE = {
  src: "/media/hero.jpg",
  alt: "A motorcycle and a white BMW M4 at a car and bike meet",
  // Portrait photo: keep the bike and the BMW (just above centre) in the wide crop.
  focus: "42% 44%",
};

export function Hero({ stats }: { stats: { k: string; v: string }[] }) {
  const reduce = useReducedMotion();

  // Pointer parallax — image drifts against the cursor, type with it (mouse only).
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 60, damping: 20 });
  const sy = useSpring(my, { stiffness: 60, damping: 20 });
  const imgX = useTransform(sx, (v) => v * -6);
  const imgY = useTransform(sy, (v) => v * -4);
  const txtX = useTransform(sx, (v) => v * 6);
  const root = useRef<HTMLElement>(null);

  return (
    <section
      ref={root}
      className="on-photo relative h-[100svh] min-h-[540px] overflow-hidden bg-ink"
      onPointerMove={(e) => {
        if (e.pointerType !== "mouse" || reduce) return;
        const r = root.current!.getBoundingClientRect();
        mx.set((e.clientX - r.left) / r.width - 0.5);
        my.set((e.clientY - r.top) / r.height - 0.5);
      }}
    >
      <motion.div className="absolute -inset-2" style={{ x: imgX, y: imgY }} initial={reduce ? false : { opacity: 0, scale: 1.03 }} animate={{ opacity: 1, scale: 1 }} transition={{ opacity: { duration: 1.2 }, scale: { duration: 2.4, ease: [0.16, 1, 0.3, 1] } }}>
        <FittedImage src={HERO_IMAGE.src} alt={HERO_IMAGE.alt} preload sizes="100vw" quality={85} focus={HERO_IMAGE.focus} />
      </motion.div>
      <div className="absolute inset-0 bg-[radial-gradient(90%_70%_at_70%_40%,transparent_0%,color-mix(in_srgb,var(--color-ink)_50%,transparent)_60%,var(--color-ink)_100%)]" />
      <div className="absolute inset-0 scrim-b" />
      <div className="absolute inset-0 hidden scrim-l md:block" />

      <div className="container-x relative flex h-full flex-col justify-end pb-[calc(96px+env(safe-area-inset-bottom))] pt-[max(80px,10svh)] lg:pb-[4svh] 2xl:max-w-[1680px]">
        <motion.div style={{ x: txtX }}>
          <motion.p className="label mb-[2.2svh] flex items-center gap-3 text-ivory [@media(max-height:560px)]:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3, duration: 1 }}>
            <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-ember" /> Cars · Bikes · Clubs · Events
          </motion.p>
          <h1 className="display text-[clamp(2.1rem,min(9.4vw,11.5svh),10.5rem)]">
            {["India's", "Automotive", "Community"].map((w, k) => (
              <span key={w} className="block overflow-hidden pb-[0.04em]">
                <motion.span
                  className={`block ${k === 1 ? "display-light !font-[250] text-ivory/85" : ""}`}
                  initial={reduce ? false : { y: "105%" }}
                  animate={{ y: 0 }}
                  transition={{ duration: 1.2, delay: 0.15 + k * 0.1, ease: [0.16, 1, 0.3, 1] }}
                >
                  {w}
                </motion.span>
              </span>
            ))}
          </h1>
          <motion.div className="mt-[3.2svh] flex flex-wrap items-center gap-3" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: 1, ease: [0.16, 1, 0.3, 1] }}>
            <Link href="/explore" className="btn btn-primary chamfer">
              Explore the community <Icon name="arrow" size={15} />
            </Link>
            <Link href="/studio" className="btn btn-ghost chamfer">
              Join the community
            </Link>
          </motion.div>
        </motion.div>

        {stats.length > 0 && (
          <div className="mt-[3.5svh] flex justify-end border-t border-line pt-[2svh]">
            <dl className="flex gap-6 sm:gap-8">
              {stats.map((st) => (
                <div key={st.k} className="flex items-baseline gap-2">
                  <dd className="readout text-lg text-ivory">{st.v}</dd>
                  <dt className="label !text-[9.5px]">{st.k}</dt>
                </div>
              ))}
            </dl>
          </div>
        )}
      </div>
    </section>
  );
}
