"use client";

import { THEMES, setTheme, useTheme } from "@/lib/theme";

/** Switches between the Night and Concours themes. */
export function ThemeToggle() {
  const theme = useTheme();
  const next = THEMES[(THEMES.findIndex((t) => t.id === theme) + 1) % THEMES.length];
  return (
    <button
      onClick={() => setTheme(next.id)}
      aria-label={`Switch to ${next.label} theme`}
      title={`Switch to ${next.label} (${next.note})`}
      className="grid h-10 w-10 place-items-center rounded-[3px] text-silver transition hover:text-ivory hairline"
    >
      {theme === "night" ? (
        // Sun: go light
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" aria-hidden>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      ) : (
        // Moon: go dark
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" aria-hidden>
          <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />
        </svg>
      )}
    </button>
  );
}
