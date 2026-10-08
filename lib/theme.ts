"use client";

import { useSyncExternalStore } from "react";

import { THEME_KEY, THEMES, type ThemeId } from "./themes";

export { THEMES, type ThemeId };
const EVENT = "karvaan:theme-change";

const read = (): ThemeId => (document.documentElement.getAttribute("data-theme") as ThemeId) || "night";
const subscribe = (l: () => void) => {
  window.addEventListener(EVENT, l);
  return () => window.removeEventListener(EVENT, l);
};

export function useTheme() {
  return useSyncExternalStore(subscribe, read, () => "night" as ThemeId);
}

export function setTheme(id: ThemeId) {
  document.documentElement.setAttribute("data-theme", id);
  try {
    localStorage.setItem(THEME_KEY, id);
  } catch {
    /* storage unavailable — applies to this page only */
  }
  window.dispatchEvent(new Event(EVENT));
}
