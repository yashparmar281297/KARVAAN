import Image from "next/image";
import type { ReactNode } from "react";
import { LineReveal } from "./Reveal";

/** Opening band for index pages: oversized title over a dimmed backdrop. */
export function PageIntro({ eyebrow, title, blurb, image, children }: { eyebrow: string; title: string[]; blurb?: string; image?: string; children?: ReactNode }) {
  return (
    <section className="relative overflow-hidden pb-10 pt-32 md:pb-14 md:pt-40">
      {image && (
        <>
          <Image src={image} alt="" fill preload sizes="100vw" className="object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-b from-ink/40 via-ink/70 to-ink" />
        </>
      )}
      <div className="container-x relative">
        <p className="label mb-6 flex items-center gap-3">
          <span className="h-1.5 w-1.5 rounded-full bg-ember" /> {eyebrow}
        </p>
        <h1 className="display text-[clamp(2rem,min(9vw,11.7svh),8rem)] [overflow-wrap:anywhere]">
          <LineReveal lines={title} />
        </h1>
        {blurb && <p className="mt-6 max-w-xl leading-relaxed text-silver">{blurb}</p>}
        {children}
      </div>
    </section>
  );
}
