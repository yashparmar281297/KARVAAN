"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { Icon } from "./Icon";
import { DoubleTapLike, LikeButton, LikeablePhoto } from "./Like";
import { Rail } from "./Rail";

/**
 * Photo rail. Tap opens the full-screen viewer; double-tap likes the photo.
 * The viewer swipes between photos and has its own like control.
 */
export function Gallery({ images, alt }: { images: string[]; alt: string }) {
  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") setOpen((i) => (i === null ? i : (i + 1) % images.length));
      if (e.key === "ArrowLeft") setOpen((i) => (i === null ? i : (i - 1 + images.length) % images.length));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, images.length]);

  return (
    <>
      <Rail label={`${alt} gallery`} itemClass="w-[72vw] sm:w-[min(360px,calc((100svh-16rem)*0.8))]">
        {images.map((src, i) => (
          <LikeablePhoto key={src + i} src={src} alt={`${alt} — ${i + 1}`} sizes="(max-width: 640px) 72vw, 360px" className="aspect-[4/5] w-full rounded-[3px]" onOpen={() => setOpen(i)} />
        ))}
      </Rail>
      <AnimatePresence>
        {open !== null && (
          <motion.div className="fixed inset-0 z-[85] flex flex-col items-center justify-center bg-ink/95 backdrop-blur" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <button className="absolute inset-0 cursor-default" aria-label="Close viewer" onClick={() => setOpen(null)} />
            <motion.div
              key={open}
              className="relative h-[70vh] w-[92vw] max-w-6xl"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              onDragEnd={(_, info) => {
                if (info.offset.x < -60) setOpen((open + 1) % images.length);
                if (info.offset.x > 60) setOpen((open - 1 + images.length) % images.length);
              }}
            >
              <DoubleTapLike id={images[open]} className="h-full w-full">
                <Image src={images[open]} alt={alt} fill sizes="92vw" quality={85} className="object-contain" />
              </DoubleTapLike>
            </motion.div>
            <div className="relative mt-5 flex items-center gap-6">
              <LikeButton kind="image" id={images[open]} className="text-ivory" />
              <p className="readout text-sm text-silver">
                {open + 1} / {images.length}
              </p>
            </div>
            <button onClick={() => setOpen(null)} className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full hairline-strong" aria-label="Close">
              <Icon name="close" size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
