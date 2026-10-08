"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import type { OwnerView } from "@/lib/data";
import { pad } from "@/lib/format";
import type { Vehicle } from "@/lib/types";
import { PrivateField } from "../cards/VehicleCard";
import { Icon } from "../ui/Icon";
import { FittedImage } from "../ui/FittedImage";

type Side = "owner" | "vehicle";

/**
 * Signature interaction: the profile opens on the owner's portrait, then the
 * card turns over to reveal the vehicle. Owner and vehicle are two faces of
 * one object — use the toggle to turn it back. Both photos keep their
 * standard 4:5 frame; stacked on phones, side by side on desktop.
 */

const FACE = "chamfer col-start-1 row-start-1 grid overflow-hidden bg-carbon [backface-visibility:hidden] lg:h-[max(min(calc(100svh-190px),860px),480px)] lg:grid-cols-[auto_minmax(0,1fr)]";
// Phone/tablet: full width but never taller than the screen allows. Desktop: full stage height, width from 4:5.
const PHOTO = "relative mx-auto aspect-[4/5] w-full max-w-[max(170px,calc((100svh-414px)*0.8))] overflow-hidden bg-ink lg:mx-0 lg:h-full lg:w-[calc(max(min(calc(100svh-190px),860px),480px)*0.8)] lg:max-w-none";
export function OwnerVehicleStage({
  v,
  owner,
  rto,
  clubName,
  location,
  garageCount,
}: {
  v: Vehicle;
  owner: OwnerView | null;
  rto: string;
  clubName?: string;
  location: string;
  garageCount?: number;
}) {
  const reduce = useReducedMotion();
  // Private owners skip the reveal — there's no identity to lead with.
  const intro = !!owner?.revealed && !reduce;
  const [side, setSide] = useState<Side>(intro ? "owner" : "vehicle");
  const [flips, setFlips] = useState(0);

  useEffect(() => {
    if (!intro) return;
    const t = setTimeout(() => {
      setSide("vehicle");
      setFlips((f) => f + 1);
    }, 1700);
    return () => clearTimeout(t);
  }, [intro]);

  const turn = (to?: Side) => {
    const nextSide = to ?? (side === "vehicle" ? "owner" : "vehicle");
    if (nextSide === side) return;
    setSide(nextSide);
    setFlips((f) => f + 1);
  };

  return (
    <section className="relative pt-[68px] lg:pt-24">
      <div className="container-x">
        <div className="relative [perspective:2200px]">
          <motion.div
            className="relative grid [transform-style:preserve-3d]"
            initial={false}
            animate={{ rotateY: side === "vehicle" ? 0 : 180, scale: flips > 0 && !reduce ? [1, 0.9, 1] : 1 }}
            transition={{ rotateY: { duration: reduce ? 0 : 1.25, ease: [0.83, 0, 0.17, 1] }, scale: { duration: 1.25, times: [0, 0.5, 1], ease: "easeInOut" } }}
          >
            {/* VEHICLE FACE — photo in its standard 4:5 frame, details beside it */}
            <div className={FACE} style={{ ["--cut" as string]: "28px" }} aria-hidden={side !== "vehicle"}>
              <div className={PHOTO}>
                <FittedImage src={v.image} alt={[v.year, v.make, v.model].filter(Boolean).join(" ")} preload sizes="(max-width: 1024px) 90vw, 50vw" quality={85} />
                <div className="ticks absolute inset-3" />
              </div>
              <div className="flex flex-col justify-between gap-3 p-4 md:p-8 lg:gap-8 lg:p-10">
                <div className="flex items-center gap-2">
                  <span className="readout text-xs text-silver">No.{pad(v.serial)}</span>
                  <span className="rounded-[2px] bg-ivory px-1.5 py-[3px] font-mono text-[10px] font-semibold leading-none text-ink">{rto}</span>
                  <span className="label ml-2">{v.class}</span>
                </div>
                <div>
                  <p className="label !tracking-[0.3em] text-ivory">{v.make}</p>
                  <h1 className="display mt-1 text-[clamp(1.6rem,min(5.5vw,8svh),6.5rem)] leading-[1] [overflow-wrap:anywhere] lg:mt-2">{v.model}</h1>
                  <p className="label mt-2 text-ivory/80 lg:mt-4">{[location, v.year, clubName].filter(Boolean).join(" · ")}</p>
                  <div className="mt-3 flex flex-wrap gap-6 border-t border-line pt-3 lg:mt-8 lg:gap-8 lg:pt-6">
                    <div>
                      <p className="readout text-[clamp(1.8rem,min(3.4vw,5svh),3.4rem)] leading-none">
                        {v.spec.power.toLocaleString("en-IN")}
                        {v.spec.powerPlus ? "+" : ""}
                      </p>
                      <p className="label mt-1">HP</p>
                    </div>
                    {v.spec.torque > 0 && (
                      <div>
                        <p className="readout text-[clamp(1.8rem,min(3.4vw,5svh),3.4rem)] leading-none">{v.spec.torque.toLocaleString("en-IN")}</p>
                        <p className="label mt-1">NM</p>
                      </div>
                    )}
                    {v.spec.zeroToHundred && (
                      <div>
                        <p className="readout text-[clamp(1.8rem,min(3.4vw,5svh),3.4rem)] leading-none text-ember">{v.spec.zeroToHundred}</p>
                        <p className="label mt-1">SEC · 0–100</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* OWNER FACE — portrait in the same 4:5 frame */}
            <div className={`${FACE} [transform:rotateY(180deg)]`} style={{ ["--cut" as string]: "28px" }} aria-hidden={side !== "owner"}>
              <div className={PHOTO}>{owner?.portrait ? <Image src={owner.portrait} alt={owner.name} fill preload sizes="(max-width: 1024px) 90vw, 50vw" className="object-cover" /> : <PrivateField />}</div>
              <div className="flex flex-col justify-end p-4 md:p-8 lg:p-10">
                <p className="label flex items-center gap-2 text-ember">
                  {owner?.revealed ? "Owner" : <><Icon name="lock" size={12} /> {owner?.privacy === "private" ? "Private owner" : "Visible to club members"}</>}
                </p>
                <h2 className="display mt-1 text-[clamp(1.6rem,min(4.6vw,7svh),5rem)] leading-[1] [overflow-wrap:anywhere] lg:mt-3">{owner?.name ?? "Unknown"}</h2>
                <p className="label mt-2 text-ivory lg:mt-4">{owner?.location}</p>
                {owner?.revealed && (
                  <div className="mt-3 flex gap-8 border-t border-line pt-3 lg:mt-8 lg:gap-10 lg:pt-6">
                    <div>
                      <p className="readout text-3xl lg:text-4xl">{pad(garageCount ?? 0, 2)}</p>
                      <p className="label">In garage</p>
                    </div>
                    {clubName && (
                      <div className="min-w-0">
                        <p className="mt-2 text-lg leading-tight [overflow-wrap:anywhere]">{clubName}</p>
                        <p className="label mt-1.5">Club</p>
                      </div>
                    )}
                  </div>
                )}
                {!owner?.revealed && (
                  <p className="mt-3 max-w-sm text-sm leading-relaxed text-silver lg:mt-6">
                    This owner keeps their identity, photograph, exact location and contact details private. You&apos;re seeing the vehicle and region only.
                  </p>
                )}
                {owner?.href && (
                  <Link href={owner.href} className="btn btn-primary chamfer mt-3 !h-11 self-stretch lg:mt-8 lg:self-start" tabIndex={side === "owner" ? 0 : -1}>
                    Enter garage <Icon name="arrow" size={15} />
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Face toggle */}
        <div className="mt-3 flex items-center justify-between lg:mt-5">
          <div role="tablist" aria-label="Card side" className="relative flex rounded-[3px] p-1 hairline">
            {(["owner", "vehicle"] as Side[]).map((s) => (
              <button key={s} role="tab" aria-selected={side === s} onClick={() => turn(s)} className={`label relative z-10 h-9 w-28 transition-colors ${side === s ? "!text-ink" : ""}`}>
                {side === s && <motion.span layoutId="face" className="absolute inset-0 -z-10 rounded-[2px] bg-ivory" transition={{ type: "spring", stiffness: 400, damping: 34 }} />}
                {s}
              </button>
            ))}
          </div>
          <p className="label hidden items-center gap-2 text-mute sm:flex">
            <Icon name="swap" size={13} /> Turn the card
          </p>
        </div>
      </div>
    </section>
  );
}
