// Tiny event bus so any component (header, hero, mobile nav) can open the
// global command palette without threading context through server pages.
export const SEARCH_EVENT = "karvaan:open-search";

export function openSearch(query?: string | unknown) {
  window.dispatchEvent(new CustomEvent(SEARCH_EVENT, { detail: typeof query === "string" ? query : "" }));
}
