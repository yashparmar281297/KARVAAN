"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { useEffect, useState } from "react";
import { signOut, useSession } from "@/lib/session";
import { NAV_LINKS } from "@/lib/site";
import { Icon, type IconName } from "../ui/Icon";
import { Logo } from "./Logo";
import { openSearch } from "./searchBus";
import { ThemeToggle } from "./ThemeToggle";

const NAV_ICON: Record<string, IconName> = {
  "/explore": "compass",
  "/cars": "gauge",
  "/bikes": "bolt",
  "/clubs": "users",
  "/events": "calendar",
  "/businesses": "pin",
};

/**
 * Site header. Always visible while scrolling. Under 1024px it's a solid bar
 * flush with the top of the screen, and every link lives in a full-screen
 * menu that grows out of the hamburger (like the AG7 Cars site).
 */
export function SiteHeader() {
  const pathname = usePathname();
  const session = useSession();
  const { scrollY } = useScroll();
  const [solid, setSolid] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useMotionValueEvent(scrollY, "change", (y) => setSolid(y > 40));

  // Close the menu whenever the page changes.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setMenuOpen(false);
  }

  // Pin the page behind the open menu (plain overflow:hidden isn't enough on iOS Safari).
  useEffect(() => {
    if (!menuOpen) return;
    const y = window.scrollY;
    const { style } = document.body;
    Object.assign(style, { position: "fixed", top: `-${y}px`, left: "0", right: "0", overflow: "hidden" });
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      Object.assign(style, { position: "", top: "", left: "", right: "", overflow: "" });
      window.scrollTo(0, y);
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const active = (href: string) => pathname === href || pathname.startsWith(href + "/");
  const initials = session?.name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2);

  return (
    <header
      // Over a photo hero the transparent desktop header takes the dark palette (see globals.css).
      data-header
      data-solid={solid}
      className="fixed inset-x-0 top-0 z-50 lg:px-5 lg:pt-4"
    >
      <div
        className={`mx-auto flex h-14 max-w-[1440px] items-center justify-between gap-2 border-b border-line bg-carbon/95 px-4 backdrop-blur-xl transition-[background-color,box-shadow,border-color] duration-500 sm:gap-4 lg:h-[60px] lg:gap-6 lg:rounded-[4px] lg:border-b-0 lg:px-5 ${
          solid ? "lg:bg-carbon/80 lg:shadow-[0_20px_60px_-20px_#000] lg:ring-1 lg:ring-line" : "lg:bg-transparent lg:backdrop-blur-none"
        }`}
      >
        <Logo />

        <nav aria-label="Primary" className="hidden items-center xl:flex">
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className={`label relative px-3 py-2 transition-colors hover:text-ivory ${active(l.href) ? "!text-ivory" : ""}`}>
              {l.label}
              <AnimatePresence>
                {active(l.href) && <motion.span layoutId="nav-active" className="absolute inset-x-3 -bottom-0.5 h-px bg-ember" />}
              </AnimatePresence>
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <button onClick={openSearch} className="flex h-10 items-center gap-3 rounded-[3px] px-3 text-silver transition hover:text-ivory hairline md:w-44 2xl:w-56" aria-label="Search">
            <Icon name="search" size={16} />
            <span className="label hidden md:inline">Search</span>
            <kbd className="label ml-auto hidden rounded-[2px] px-1.5 py-0.5 !text-[9px] hairline md:inline">⌘K</kbd>
          </button>
          <ThemeToggle />
          {/* Desktop account links */}
          <div className="hidden items-center gap-2 xl:flex">
            {session ? (
              <>
                {session.role === "admin" && (
                  <Link href="/studio" className="label flex h-10 items-center px-3 text-ember hover:text-ivory">
                    Studio
                  </Link>
                )}
                {session.id && (
                  <>
                    <Link href="/feed" className="label flex h-10 items-center px-3 text-ivory hover:text-white">
                      Feed
                    </Link>
                    <Link href="/me" aria-label="My account" title="My account" className="grid h-10 w-10 place-items-center rounded-full bg-ivory font-mono text-[11px] font-semibold text-ink">
                      {initials}
                    </Link>
                  </>
                )}
                {!session.id && (
                  <Link href="/login" className="label flex h-10 items-center px-3 text-ivory hover:text-white">
                    My account login
                  </Link>
                )}
              </>
            ) : (
              <>
                <Link href="/login" className="label flex h-10 items-center px-3 text-ivory hover:text-white">
                  Login
                </Link>
                <Link href="/join" className="btn btn-primary chamfer !h-10 !px-4">
                  Join
                </Link>
              </>
            )}
          </div>
          {/* Mobile / tablet: hamburger */}
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            aria-expanded={menuOpen}
            aria-controls="site-menu"
            className="grid h-10 w-10 place-items-center rounded-full hairline-strong transition active:scale-95 xl:hidden"
          >
            <span className="flex flex-col gap-[5px]">
              <span className="h-px w-4 bg-ivory" />
              <span className="h-px w-4 bg-ivory" />
              <span className="h-px w-4 bg-ivory" />
            </span>
          </button>
        </div>
      </div>

      {/* Full-screen menu — grows out of the hamburger as a circle. */}
      <div
        id="site-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        aria-hidden={!menuOpen}
        inert={!menuOpen}
        className={`fixed inset-0 z-[100] flex flex-col overflow-y-auto bg-ink transition-[clip-path] duration-700 ease-[cubic-bezier(0.65,0,0.35,1)] xl:hidden ${menuOpen ? "pointer-events-auto" : "pointer-events-none"}`}
        style={{ clipPath: menuOpen ? "circle(150% at calc(100% - 36px) 28px)" : "circle(0% at calc(100% - 36px) 28px)" }}
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-line px-4">
          <Logo />
          <button type="button" onClick={() => setMenuOpen(false)} aria-label="Close menu" className="grid h-10 w-10 place-items-center rounded-full hairline-strong text-ivory">
            <Icon name="close" size={16} />
          </button>
        </div>

        <nav aria-label="Site" className={`flex-1 px-6 py-8 transition-all duration-500 ${menuOpen ? "translate-y-0 opacity-100 delay-200" : "translate-y-4 opacity-0"}`}>
          <ul className="space-y-1">
            {NAV_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} onClick={() => setMenuOpen(false)} className={`flex items-center gap-4 py-3 ${active(l.href) ? "text-ivory" : "text-silver hover:text-ivory"}`}>
                  <Icon name={NAV_ICON[l.href] ?? "arrow"} size={20} className={active(l.href) ? "text-ember" : "text-mute"} />
                  <span className="display text-[1.9rem] leading-none">{l.label}</span>
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-8 border-t border-line pt-6">
            {session ? (
              <ul className="space-y-1">
                {session.role === "admin" && (
                  <li>
                    <Link href="/studio" onClick={() => setMenuOpen(false)} className="label flex items-center gap-3 py-3 !text-[12px] text-ember">
                      <Icon name="upload" size={16} /> Studio
                    </Link>
                  </li>
                )}
                {session.id ? (
                  <>
                    <li>
                      <Link href="/feed" onClick={() => setMenuOpen(false)} className="label flex items-center gap-3 py-3 !text-[12px] text-ivory">
                        <Icon name="compass" size={16} /> Feed
                      </Link>
                    </li>
                    <li>
                      <Link href="/me" onClick={() => setMenuOpen(false)} className="label flex items-center gap-3 py-3 !text-[12px] text-ivory">
                        <Icon name="user" size={16} /> My account · {session.name}
                      </Link>
                    </li>
                  </>
                ) : (
                  <li>
                    <Link href="/login" onClick={() => setMenuOpen(false)} className="label flex items-center gap-3 py-3 !text-[12px] text-ivory">
                      <Icon name="user" size={16} /> Log into my account
                    </Link>
                  </li>
                )}
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      signOut();
                      setMenuOpen(false);
                    }}
                    className="label flex items-center gap-3 py-3 !text-[12px] text-silver"
                  >
                    <Icon name="arrowLeft" size={16} /> Log out
                  </button>
                </li>
              </ul>
            ) : (
              <div className="flex gap-3">
                <Link href="/login" onClick={() => setMenuOpen(false)} className="btn btn-ghost chamfer flex-1">
                  Login
                </Link>
                <Link href="/join" onClick={() => setMenuOpen(false)} className="btn btn-primary chamfer flex-1">
                  Join
                </Link>
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
