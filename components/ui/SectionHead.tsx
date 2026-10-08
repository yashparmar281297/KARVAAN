import Link from "next/link";
import { Icon } from "./Icon";
import { LineReveal } from "./Reveal";

export function SectionHead({
  index,
  eyebrow,
  title,
  href,
  cta = "View all",
  aside,
}: {
  index?: string;
  eyebrow: string;
  title: string[];
  href?: string;
  cta?: string;
  aside?: React.ReactNode;
}) {
  return (
    <div className="mb-[clamp(1.25rem,4svh,3rem)] flex flex-col gap-[clamp(0.75rem,2.5svh,1.5rem)] md:flex-row md:items-end md:justify-between">
      <div>
        <div className="label mb-[clamp(0.5rem,1.6svh,1rem)] flex items-center gap-3">
          {index && <span className="text-ember">{index}</span>}
          <span className="h-px w-8 bg-line-strong" />
          <span>{eyebrow}</span>
        </div>
        <h2 className="display text-[clamp(2rem,min(5.2vw,6.8svh),4.25rem)]">
          <LineReveal lines={title} />
        </h2>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        {aside}
        {href && (
          <Link href={href} className="group label flex shrink-0 items-center gap-3 text-ivory">
            {cta}
            <span className="grid h-9 w-9 place-items-center rounded-full hairline-strong transition-colors group-hover:bg-ivory group-hover:text-ink">
              <Icon name="arrow" size={14} />
            </span>
          </Link>
        )}
      </div>
    </div>
  );
}
