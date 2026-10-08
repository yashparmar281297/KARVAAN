"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { SEARCH_EXAMPLES } from "@/lib/data";
import type { SearchKind, SearchResult } from "@/lib/types";
import { BROWSE, KIND_LABEL, ResultBody } from "../search/ResultRow";
import { Icon } from "../ui/Icon";
import { SEARCH_EVENT } from "./searchBus";

/**
 * Global search: ⌘K / Ctrl+K or "/" anywhere, or the search button.
 * Full screen on phones, a centred panel on bigger screens. Type → results
 * appear instantly, grouped by kind, with tabs to narrow them down.
 */
export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<SearchKind | "all">("all");
  const [cursor, setCursor] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const dq = useDeferredValue(q);

  // Results come from the server (where the data lives), keyed by the query they answer.
  const [found, setFound] = useState<{ q: string; list: SearchResult[] }>({ q: "", list: [] });
  useEffect(() => {
    if (!dq.trim()) return;
    const ctrl = new AbortController();
    fetch(`/api/search?q=${encodeURIComponent(dq)}`, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : []))
      .then((list: SearchResult[]) => setFound({ q: dq, list }))
      .catch(() => {});
    return () => ctrl.abort();
  }, [dq]);
  const all = useMemo(() => (dq.trim() && found.q === dq ? found.list : []), [dq, found]);
  const kinds = useMemo(() => [...new Set(all.map((r) => r.kind))], [all]);
  const activeTab = tab !== "all" && kinds.includes(tab) ? tab : "all";
  const results = useMemo(() => (activeTab === "all" ? all : all.filter((r) => r.kind === activeTab)), [all, activeTab]);

  useEffect(() => {
    const onOpen = (e: Event) => {
      setQ((e as CustomEvent<string>).detail ?? "");
      setTab("all");
      setCursor(0);
      setOpen(true);
    };
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof Element && e.target.closest("input, textarea, [contenteditable]");
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener(SEARCH_EVENT, onOpen);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener(SEARCH_EVENT, onOpen);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    document.documentElement.style.overflow = "hidden";
    const t = setTimeout(() => input.current?.focus(), 60);
    return () => {
      clearTimeout(t);
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  const go = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router],
  );

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => Math.min(c + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => Math.max(c - 1, 0));
    } else if (e.key === "Enter") {
      if (results[cursor]) go(results[cursor].href);
      else if (q.trim()) go(`/search?q=${encodeURIComponent(q.trim())}`);
    }
  };

  // Group while preserving global order for keyboard navigation.
  const groups = useMemo(() => {
    const g = new Map<SearchKind, { r: SearchResult; i: number }[]>();
    results.forEach((r, i) => {
      if (!g.has(r.kind)) g.set(r.kind, []);
      g.get(r.kind)!.push({ r, i });
    });
    return [...g.entries()];
  }, [results]);

  const typed = q.trim().length > 0;
  // Still waiting for the answer to what's typed.
  const waiting = typed && found.q !== q;

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[80] flex items-start justify-center md:px-4 md:pt-[10vh]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          <div className="absolute inset-0 bg-ink/85 backdrop-blur-md" onClick={() => setOpen(false)} />
          <motion.div
            role="dialog"
            aria-modal
            aria-label="Search"
            className="relative flex h-[100dvh] w-full flex-col overflow-hidden bg-carbon md:h-auto md:max-h-[80vh] md:max-w-2xl md:rounded-[10px] md:shadow-[0_40px_120px_-20px_#000] md:hairline-strong"
            initial={{ y: 16, opacity: 0.6 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 10, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Search box */}
            <div className="flex shrink-0 items-center gap-2 border-b border-line px-3 pt-[env(safe-area-inset-top)] transition-colors focus-within:border-ivory/40 focus-within:bg-graphite/40 md:px-4">
              <button onClick={() => setOpen(false)} className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-silver hover:text-ivory md:hidden" aria-label="Close search">
                <Icon name="arrowLeft" size={18} />
              </button>
              <Icon name="search" size={18} className="hidden shrink-0 text-silver md:block" />
              <input
                ref={input}
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setCursor(0);
                }}
                onKeyDown={onKeyDown}
                placeholder="Search cars, bikes, clubs, events…"
                enterKeyHint="search"
                className="h-16 min-w-0 flex-1 bg-transparent text-[16px] text-ivory outline-none placeholder:text-mute md:text-[17px]"
                aria-label="Search query"
                role="combobox"
                aria-expanded={results.length > 0}
                aria-controls="palette-results"
              />
              {q && (
                <button
                  onClick={() => {
                    setQ("");
                    input.current?.focus();
                  }}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-charcoal text-silver hover:text-ivory"
                  aria-label="Clear search"
                >
                  <Icon name="close" size={13} />
                </button>
              )}
              <button onClick={() => setOpen(false)} className="label ml-1 hidden shrink-0 rounded-[3px] px-2 py-1 hairline md:block" aria-label="Close search">
                Esc
              </button>
            </div>

            {/* Tabs — only the kinds that have results */}
            {typed && kinds.length > 1 && (
              <div className="no-scrollbar flex shrink-0 gap-2 overflow-x-auto border-b border-line px-4 py-2.5">
                {(["all", ...kinds] as const).map((k) => (
                  <button
                    key={k}
                    onClick={() => {
                      setTab(k);
                      setCursor(0);
                    }}
                    data-active={activeTab === k}
                    className="chip shrink-0"
                  >
                    {k === "all" ? "All" : KIND_LABEL[k]}
                    <span className="readout opacity-60">{k === "all" ? all.length : all.filter((r) => r.kind === k).length}</span>
                  </button>
                ))}
              </div>
            )}

            <div id="palette-results" role="listbox" className="no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pb-4 pt-2">
              {/* Nothing typed yet: popular searches + quick links */}
              {!typed && (
                <div className="px-2 pt-2">
                  <p className="label mb-3 text-mute">Popular searches</p>
                  <div className="flex flex-wrap gap-2">
                    {SEARCH_EXAMPLES.map((ex) => (
                      <button key={ex} onClick={() => setQ(ex)} className="chip normal-case !tracking-normal">
                        <Icon name="search" size={11} /> {ex}
                      </button>
                    ))}
                  </div>
                  <p className="label mb-3 mt-8 text-mute">Browse</p>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                    {BROWSE.map((b) => (
                      <Link key={b.href} href={b.href} onClick={() => setOpen(false)} className="flex flex-col items-center gap-2 rounded-[8px] bg-graphite px-2 py-4 text-silver transition hover:bg-charcoal hover:text-ivory">
                        <Icon name={b.icon} size={20} className="text-ember" />
                        <span className="text-[13px]">{b.label}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {waiting && results.length === 0 && (
                <div className="space-y-2 p-2" aria-label="Searching">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="flex items-center gap-4 p-2">
                      <span className="h-14 w-14 animate-pulse rounded-[6px] bg-graphite" />
                      <span className="flex-1 space-y-2">
                        <span className="block h-3 w-2/3 animate-pulse rounded bg-graphite" />
                        <span className="block h-2.5 w-1/3 animate-pulse rounded bg-graphite" />
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {typed && !waiting && results.length === 0 && (
                <div className="px-4 py-14 text-center">
                  <Icon name="search" size={26} className="mx-auto text-mute" />
                  <p className="mt-4 text-ivory">No results for “{q}”</p>
                  <p className="mt-1 text-sm text-silver">Try a car make, a city or a club name.</p>
                </div>
              )}

              {groups.map(([kind, items]) => (
                <div key={kind} className="mb-1">
                  {activeTab === "all" && <p className="label px-3 pb-1 pt-3 !text-[9.5px] text-mute">{KIND_LABEL[kind]}</p>}
                  {items.map(({ r, i }) => (
                    <button
                      key={r.href}
                      role="option"
                      aria-selected={i === cursor}
                      onMouseEnter={() => setCursor(i)}
                      onClick={() => go(r.href)}
                      className={`flex w-full items-center gap-3 rounded-[8px] p-2 text-left transition-colors active:bg-charcoal md:gap-4 ${i === cursor ? "md:bg-charcoal" : ""}`}
                    >
                      <ResultBody r={r} active={i === cursor} />
                    </button>
                  ))}
                </div>
              ))}
            </div>

            {typed && results.length > 0 && (
              <button onClick={() => go(`/search?q=${encodeURIComponent(q)}`)} className="flex shrink-0 items-center justify-between border-t border-line px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 text-sm text-ivory hover:bg-graphite md:pb-4">
                See all results for “{q}” <Icon name="arrow" size={14} />
              </button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
