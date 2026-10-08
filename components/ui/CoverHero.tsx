import type { ReactNode } from "react";
import { FittedImage } from "./FittedImage";

/**
 * Detail-page header for a 16:9 cover photo. The photo keeps its exact
 * uploaded frame — never cropped: on desktop it's sized to the screen height
 * with the details over its lower part; on phones the details sit below it.
 */
export function CoverHero({ src, alt, overlay, children }: { src: string; alt: string; overlay?: ReactNode; children: ReactNode }) {
  return (
    <section className="pt-[76px] md:pt-[88px]">
      <div className="container-x">
        <div className="on-photo chamfer relative mx-auto w-full overflow-hidden bg-carbon lg:max-w-[calc((100svh-7rem)*16/9)]" style={{ ["--cut" as string]: "24px" }}>
          <div className="relative aspect-video">
            <FittedImage src={src} alt={alt} preload sizes="(max-width: 1024px) 100vw, 80vw" quality={85} />
            <div className="absolute inset-0 hidden bg-ink/25 scrim-b lg:block" />
            {overlay}
          </div>
          <div className="relative p-5 md:p-8 lg:absolute lg:inset-x-0 lg:bottom-0 lg:p-10">{children}</div>
        </div>
      </div>
    </section>
  );
}
