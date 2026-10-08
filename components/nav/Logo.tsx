import Link from "next/link";
import { SITE } from "@/lib/site";

/** Mark: three receding chevrons — a convoy (karvaan) seen from above. */
export function LogoMark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size * 1.5} height={size} viewBox="0 0 36 24" aria-hidden>
      <path d="M2 3h6l8 9-8 9H2l8-9Z" className="fill-ivory" />
      <path d="M13 3h5l8 9-8 9h-5l8-9Z" className="fill-ivory" opacity=".55" />
      <path d="M23 3h4l8 9-8 9h-4l8-9Z" className="fill-ember" />
    </svg>
  );
}

export function Logo({ compact }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex min-w-0 items-center gap-2 sm:gap-2.5" aria-label={`${SITE.name} home`}>
      <LogoMark />
      {!compact && <span className="display text-[15px] tracking-[0.04em] min-[360px]:text-[17px] min-[360px]:tracking-[0.06em]">{SITE.name}</span>}
    </Link>
  );
}
