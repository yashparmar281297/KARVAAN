"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useRef, useState, type ReactNode } from "react";
import { useLoginHref } from "@/lib/session";
import { useLike, useLikeTotal, type LikeKind } from "@/lib/follows";

const fmt = (n: number) => (n >= 10000 ? `${(n / 1000).toFixed(1)}K` : n.toLocaleString("en-IN"));

export function Heart({ filled, size = 18 }: { filled: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden className={filled ? "text-ember" : ""}>
      <path
        d="M12 20.5s-8-4.9-8-10.6A4.6 4.6 0 0 1 12 7a4.6 4.6 0 0 1 8 2.9c0 5.7-8 10.6-8 10.6Z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Heart + count, Instagram style. `base` is the stored count before this viewer. */
export function LikeButton({ kind, id, base = 0, className = "", showCount = true }: { kind: LikeKind; id: string; base?: number; className?: string; showCount?: boolean }) {
  const { liked, toggle, signedIn } = useLike(kind, id);
  const count = base + useLikeTotal(kind, id);
  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(); // visitors: "create your free account", then the like is applied automatically
      }}
      title={signedIn ? undefined : "Create a free account to like"}
      aria-pressed={liked}
      aria-label={liked ? "Unlike" : "Like"}
      className={`group inline-flex items-center gap-1.5 ${className}`}
    >
      <motion.span key={String(liked)} initial={{ scale: liked ? 0.6 : 1 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 14 }} className="grid place-items-center transition group-hover:opacity-80">
        <Heart filled={liked} />
      </motion.span>
      {showCount && <span className="readout text-sm">{fmt(count)}</span>}
    </button>
  );
}

/** Big heart that bursts on double-tap. */
function Burst({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.span
          className="pointer-events-none absolute inset-0 z-20 grid place-items-center text-ivory drop-shadow-[0_4px_20px_#0009]"
          initial={{ opacity: 0, scale: 0.4 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.2 }}
          transition={{ type: "spring", stiffness: 400, damping: 16 }}
        >
          <svg width="96" height="96" viewBox="0 0 24 24" aria-hidden>
            <path d="M12 20.5s-8-4.9-8-10.6A4.6 4.6 0 0 1 12 7a4.6 4.6 0 0 1 8 2.9c0 5.7-8 10.6-8 10.6Z" fill="currentColor" />
          </svg>
        </motion.span>
      )}
    </AnimatePresence>
  );
}

/**
 * Wraps any media so a double-tap / double-click likes it (never unlikes,
 * like Instagram). A single tap still reaches `onTap` after a short delay.
 */
export function DoubleTapLike({ id, children, onTap, className = "", style }: { id: string; children: ReactNode; onTap?: () => void; className?: string; style?: React.CSSProperties }) {
  const { like, signedIn } = useLike("image", id);
  const [burst, setBurst] = useState(0);
  const [hint, setHint] = useState(false);
  const loginLink = useLoginHref();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  return (
    <div
      className={`relative ${className}`}
      style={style}
      onClick={() => {
        if (timer.current) {
          clearTimeout(timer.current);
          timer.current = null;
          if (!signedIn) {
            setHint(true);
            setTimeout(() => setHint(false), 2200);
            return;
          }
          like();
          setBurst((b) => b + 1);
          setTimeout(() => setBurst(0), 700);
          return;
        }
        timer.current = setTimeout(() => {
          timer.current = null;
          onTap?.();
        }, 260);
      }}
    >
      {children}
      <Burst show={burst > 0} />
      {hint && (
        <Link
          href={loginLink}
          onClick={(e) => e.stopPropagation()}
          className="label absolute left-1/2 top-1/2 z-30 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-ink/90 px-4 py-2.5 text-ivory hairline-strong"
        >
          Log in to like
        </Link>
      )}
    </div>
  );
}

/** A photo tile with double-tap like and a heart/count bar — the feed unit. */
export function LikeablePhoto({ src, alt, sizes, className = "", style, onOpen, priority }: { src: string; alt: string; sizes: string; className?: string; style?: React.CSSProperties; onOpen?: () => void; priority?: boolean }) {
  return (
    <DoubleTapLike id={src} onTap={onOpen} style={style} className={`group cursor-pointer overflow-hidden bg-graphite hairline ${className}`}>
      <Image src={src} alt={alt} fill sizes={sizes} preload={priority} className="object-cover transition duration-1000 group-hover:scale-105" />
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-ink/80 to-transparent p-3">
        <LikeButton kind="image" id={src} />
        <span className="label !text-[9px] text-ivory/70">Double-tap to like</span>
      </div>
    </DoubleTapLike>
  );
}
