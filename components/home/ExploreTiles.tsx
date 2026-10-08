import Link from "next/link";
import { EXPLORE_TILES } from "@/lib/explore";
import { fitFont } from "@/lib/fit";
import { Icon } from "../ui/Icon";
import { FittedImage } from "../ui/FittedImage";

/**
 * "Choose your corner": four equal square boxes on every screen size
 * (2 across on phones, 4 across from tablets up). `counts` adds a small line
 * like "2 on the grid" — left out when there's nothing to count yet.
 */
export function ExploreTiles({ counts = {} }: { counts?: Record<string, string | undefined> }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
      {EXPLORE_TILES.map((t, i) => (
        <Link key={t.href} href={t.href} className="group relative block aspect-square overflow-hidden rounded-[3px] bg-graphite @container hairline">
          <FittedImage src={t.image} alt="" sizes="(max-width: 768px) 46vw, 25vw" focus={t.focus} className="transition duration-700 ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.04]" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/20 to-transparent" />
          <span className="readout absolute left-3 top-3 text-[11px] text-silver md:left-4 md:top-4">{String(i + 1).padStart(2, "0")}</span>
          <div className="absolute inset-x-0 bottom-0 p-3 md:p-4">
            {counts[t.href] && <p className="label !text-[9px] text-ember md:!text-[10px]">{counts[t.href]}</p>}
            <h3 className="display mt-1 whitespace-nowrap leading-[1.02]" style={{ fontSize: fitFont("clamp(1.1rem, 2.2vw, 2rem)", [t.title], "1.5rem") }}>
              {t.title}
            </h3>
            <span className="label mt-2 hidden items-center gap-2 text-ivory opacity-0 transition duration-500 group-hover:opacity-100 md:flex">
              Enter <Icon name="arrow" size={13} />
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
