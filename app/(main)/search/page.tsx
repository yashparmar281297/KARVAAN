import type { Metadata } from "next";
import Link from "next/link";
import { BROWSE, KIND_LABEL, ResultBody } from "@/components/search/ResultRow";
import { Icon } from "@/components/ui/Icon";
import { SEARCH_EXAMPLES, search } from "@/lib/data";
import type { SearchKind } from "@/lib/types";

export const metadata: Metadata = { title: "Search", robots: { index: false } };

/** Full search results: the same simple rows as the search panel, with tabs per kind. */
export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const all = q ? search(q, 60) : [];
  const kinds = [...new Set(all.map((r) => r.kind))];
  const tab = typeof sp.kind === "string" && kinds.includes(sp.kind as SearchKind) ? (sp.kind as SearchKind) : null;
  const results = tab ? all.filter((r) => r.kind === tab) : all;
  const href = (k: SearchKind | null) => `/search?q=${encodeURIComponent(q)}${k ? `&kind=${k}` : ""}`;

  return (
    <section className="container-x mx-auto max-w-3xl pb-16 pt-24 md:pt-32">
      <h1 className="display text-[clamp(2rem,6vw,3rem)]">Search</h1>
      <form action="/search" className="mt-6 flex h-14 items-center gap-3 rounded-[10px] bg-graphite px-4 hairline-strong focus-within:ring-1 focus-within:ring-ivory/40">
        <Icon name="search" size={18} className="shrink-0 text-silver" />
        <input name="q" defaultValue={q} enterKeyHint="search" placeholder="Search cars, bikes, clubs, events…" className="h-full min-w-0 flex-1 bg-transparent text-[16px] outline-none placeholder:text-mute" aria-label="Search" />
        <button className="btn btn-primary chamfer !h-9 shrink-0 !px-4">Search</button>
      </form>

      {!q && (
        <>
          <p className="label mb-3 mt-10 text-mute">Popular searches</p>
          <div className="flex flex-wrap gap-2">
            {SEARCH_EXAMPLES.map((ex) => (
              <Link key={ex} href={`/search?q=${encodeURIComponent(ex)}`} className="chip normal-case !tracking-normal">
                <Icon name="search" size={11} /> {ex}
              </Link>
            ))}
          </div>
          <p className="label mb-3 mt-10 text-mute">Browse</p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {BROWSE.map((b) => (
              <Link key={b.href} href={b.href} className="flex flex-col items-center gap-2 rounded-[8px] bg-graphite px-2 py-4 text-silver transition hover:bg-charcoal hover:text-ivory">
                <Icon name={b.icon} size={20} className="text-ember" />
                <span className="text-[13px]">{b.label}</span>
              </Link>
            ))}
          </div>
        </>
      )}

      {q && all.length > 0 && (
        <>
          <p className="mt-6 text-sm text-silver">
            {all.length} {all.length === 1 ? "result" : "results"} for <span className="text-ivory">“{q}”</span>
          </p>
          {kinds.length > 1 && (
            <div className="no-scrollbar -mx-4 mt-4 flex gap-2 overflow-x-auto px-4">
              <Link href={href(null)} data-active={!tab} className="chip shrink-0">
                All <span className="readout opacity-60">{all.length}</span>
              </Link>
              {kinds.map((k) => (
                <Link key={k} href={href(k)} data-active={tab === k} className="chip shrink-0">
                  {KIND_LABEL[k]} <span className="readout opacity-60">{all.filter((r) => r.kind === k).length}</span>
                </Link>
              ))}
            </div>
          )}
          <div className="mt-4 divide-y divide-line overflow-hidden rounded-[10px] bg-graphite/40 hairline">
            {results.map((r) => (
              <Link key={r.href} href={r.href} className="flex items-center gap-3 p-3 transition-colors hover:bg-charcoal md:gap-4">
                <ResultBody r={r} />
              </Link>
            ))}
          </div>
        </>
      )}

      {q && all.length === 0 && (
        <div className="py-20 text-center">
          <Icon name="search" size={28} className="mx-auto text-mute" />
          <p className="mt-4 text-lg text-ivory">No results for “{q}”</p>
          <p className="mt-1 text-silver">Try a car make, a city or a club name.</p>
        </div>
      )}
    </section>
  );
}
