import Link from "next/link";
import { Icon } from "../ui/Icon";
import { LineReveal } from "../ui/Reveal";
import { FittedImage } from "../ui/FittedImage";
import { fitFont } from "@/lib/fit";

/** Closing call: a fanned hand of collectibles — "yours goes here". */
export function FinalCTA({ images }: { images: string[] }) {
  return (
    <section className="container-x mt-32 md:mt-44">
      <div className="relative overflow-hidden bg-carbon px-6 py-12 hairline md:px-16 md:py-[clamp(3rem,8svh,6rem)]" style={{ borderRadius: 4 }}>
        <div className="absolute inset-0 bg-[radial-gradient(60%_80%_at_80%_50%,color-mix(in_srgb,var(--color-ember)_8%,transparent),transparent_70%)]" />
        <div className="relative grid items-center gap-16 lg:grid-cols-2">
          <div className="min-w-0 @container">
            <p className="label mb-6 text-ember">Your turn</p>
            <h2 className="display" style={{ fontSize: fitFont("clamp(2rem, min(6vw, 7.8svh), 5.2rem)", ["Build your", "automotive", "identity"]) }}>
              <LineReveal lines={["Build your", "automotive", "identity"]} />
            </h2>
            <p className="mt-6 max-w-md leading-relaxed text-silver">
              Add your cars and bikes, request to join your club, follow the people and clubs you love, and register for drives. You decide who sees your name, your face and your city.
            </p>
            <div className="mt-[clamp(1.5rem,4svh,2.5rem)] flex flex-wrap gap-3">
              <Link href="/join" className="btn btn-primary chamfer">
                Create your card <Icon name="arrow" size={15} />
              </Link>
              <Link href="/garage" className="btn btn-ghost chamfer">
                See a garage
              </Link>
            </div>
          </div>
          <div className="relative mx-auto hidden h-[clamp(320px,calc(100svh-22rem),440px)] w-full max-w-[460px] [perspective:1400px] lg:block">
            {images.slice(0, 3).map((src, i) => (
              <div
                key={src}
                className="chamfer metal absolute left-1/2 top-1/2 w-[46%] p-2.5 shadow-[0_40px_80px_-30px_#000] transition duration-700 ease-[cubic-bezier(.16,1,.3,1)] hover:!-translate-y-[58%]"
                style={{
                  ["--cut" as string]: "14px",
                  transform: `translate(-50%, -50%) translateX(${(i - 1) * 38}%) rotate(${(i - 1) * 9}deg) rotateY(${(i - 1) * -8}deg)`,
                  zIndex: i === 1 ? 3 : 1,
                }}
              >
                <div className="relative aspect-[4/5] overflow-hidden rounded-[2px]">
                  <FittedImage src={src} alt="" sizes="240px" />
                </div>
                <div className="mt-3 space-y-2 px-1">
                  <div className="h-1.5 w-1/3 bg-mute/60" />
                  <div className="h-3 w-4/5 bg-ivory/80" />
                  <div className="grid grid-cols-3 gap-1 pt-2">
                    <div className="h-5 bg-line-strong" />
                    <div className="h-5 bg-line-strong" />
                    <div className="h-5 bg-line-strong" />
                  </div>
                </div>
              </div>
            ))}
            <div className="chamfer absolute bottom-0 right-0 flex h-28 w-24 flex-col items-center justify-center gap-2 border border-dashed border-line-strong text-silver md:right-4" style={{ ["--cut" as string]: "10px" }}>
              <Icon name="plus" size={20} />
              <span className="label !text-[9px]">Yours</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
