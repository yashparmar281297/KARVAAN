import Link from "next/link";
import { SITE } from "@/lib/site";
import { LogoMark } from "./Logo";

const COLS = [
  { title: "Discover", links: [["Cars", "/cars"], ["Bikes", "/bikes"], ["Drives & rides", "/events?category=routed"]] },
  { title: "Community", links: [["Clubs", "/clubs"], ["Events", "/events"], ["Businesses", "/businesses"], ["Search", "/search"]] },
  { title: "You", links: [["Your garage", "/garage"], ["Join", "/join"], ["Login", "/login"]] },
  { title: "Partners", links: [["Advertise", "/explore#partners"], ["Host an event", "/events/new"], ["List a business", "/businesses"]] },
];

export function Footer() {
  return (
    <footer className="relative mt-24 overflow-hidden border-t border-line pb-24 pt-16 lg:pb-12">
      <div className="container-x">
        <div className="grid gap-12 md:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div>
            <LogoMark size={28} />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-silver">{SITE.description}</p>
          </div>
          {COLS.map((c) => (
            <div key={c.title}>
              <p className="label mb-4 text-mute">{c.title}</p>
              <ul className="space-y-2.5">
                {c.links.map(([l, h]) => (
                  <li key={l}>
                    <Link href={h} className="text-sm text-silver transition hover:text-ivory">
                      {l}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <p aria-hidden className="display pointer-events-none mt-16 select-none whitespace-nowrap text-center text-[21vw] leading-[0.75] text-transparent [-webkit-text-stroke:1px_color-mix(in_srgb,var(--color-ivory)_12%,transparent)]">
        {SITE.name}
      </p>
      <div className="container-x mt-8 flex flex-col justify-between gap-3 border-t border-line pt-6 md:flex-row">
        <p className="label text-mute">© 2026 {SITE.name} · Made in India</p>
        <p className="label text-mute">Privacy-first by design · Owners control what you see</p>
      </div>
    </footer>
  );
}
