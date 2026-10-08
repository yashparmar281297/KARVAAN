// Theme definitions shared by the server layout and client toggle.
export const THEMES = [
  { id: "night", label: "Night", note: "Dark metallic" },
  { id: "concours", label: "Concours", note: "Light editorial" },
] as const;
export type ThemeId = (typeof THEMES)[number]["id"];

export const THEME_KEY = "karvaan:theme";

/**
 * Runs in <head> before first paint: `?theme=` in the URL wins (and is
 * remembered), otherwise the saved choice. Keeps the page from flashing.
 */
export const THEME_BOOT_SCRIPT = `(function(){try{var ok=${JSON.stringify(THEMES.map((t) => t.id))};var q=new URLSearchParams(location.search).get("theme");if(q&&ok.indexOf(q)>-1){localStorage.setItem("${THEME_KEY}",q)}var t=localStorage.getItem("${THEME_KEY}");if(t&&ok.indexOf(t)>-1)document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`;
