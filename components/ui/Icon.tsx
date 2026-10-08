import type { SVGProps } from "react";

// Hairline icon set (1.25 stroke) drawn for this UI — keeps weight consistent
// with the mono labels instead of mixing in a generic icon library.
const PATHS = {
  search: "M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13ZM15.2 15.2 20 20",
  arrow: "M4 12h15M14 7l5 5-5 5",
  arrowUpRight: "M7 17 17 7M8 7h9v9",
  arrowLeft: "M20 12H5M10 7l-5 5 5 5",
  close: "M6 6l12 12M18 6 6 18",
  home: "M4 11 12 4l8 7M6 9.5V20h12V9.5",
  compass: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM15.5 8.5l-2 5-5 2 2-5 5-2Z",
  calendar: "M4 6h16v14H4zM4 10h16M8 3v4M16 3v4",
  garage: "M3 20V9l9-5 9 5v11M7 20v-7h10v7M7 16h10",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21a8 8 0 0 1 16 0",
  users: "M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 6.5M18 14a6.5 6.5 0 0 1 3.5 6",
  pin: "M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21ZM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
  fuel: "M5 20V5a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v15M4 20h11M5 10h9M14 9l3 1.5V17a1.5 1.5 0 0 0 3 0V8l-3-3",
  food: "M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10M16 21V3c-2.5 1.5-3 5-3 8h3",
  camera: "M4 8h3.5L9 5.5h6L16.5 8H20v11H4zM12 16.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  mountain: "M3 19 9.5 8l4 6.5L16 11l5 8H3Z",
  flag: "M5 21V4M5 4h12l-2 4 2 4H5",
  play: "M8 5v14l11-7L8 5Z",
  check: "M5 12.5 10 17 19 7",
  lock: "M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3",
  eye: "M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12ZM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  shield: "M12 3 4.5 6v6c0 4.5 3.2 7.8 7.5 9 4.3-1.2 7.5-4.5 7.5-9V6L12 3Z",
  star: "m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.8 6.8 19.6l1-5.8-4.3-4.1 5.9-.8L12 3.5Z",
  heart: "M12 20s-7.5-4.6-7.5-10A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 7.5 3c0 5.4-7.5 10-7.5 10Z",
  instagram: "M4 4h16v16H4zM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM17 7h.01",
  globe: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM3 12h18M12 3c2.5 2.7 3.5 5.7 3.5 9s-1 6.3-3.5 9c-2.5-2.7-3.5-5.7-3.5-9s1-6.3 3.5-9Z",
  phone: "M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1Z",
  filter: "M4 6h16M7 12h10M10 18h4",
  plus: "M12 5v14M5 12h14",
  minus: "M5 12h14",
  upload: "M12 16V4M7 9l5-5 5 5M4 16v4h16v-4",
  trash: "M5 7h14M10 7V4.5h4V7M7 7l1 13h8l1-13",
  ticket: "M3 7h18v3a2 2 0 0 0 0 4v3H3v-3a2 2 0 0 0 0-4V7ZM14 7v10",
  gauge: "M4.5 17a8.5 8.5 0 1 1 15 0M12 13l4-5",
  wrench: "M14.5 5.5a4 4 0 0 0-5.3 5.3L4 16l4 4 5.2-5.2a4 4 0 0 0 5.3-5.3L16 12l-4-4 2.5-2.5Z",
  route: "M6 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM18 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM6 15V9a3 3 0 0 1 3-3h1M18 9v6a3 3 0 0 1-3 3h-1",
  bolt: "M13 3 5 14h6l-1 7 8-11h-6l1-7Z",
  swap: "M7 7h12l-3-3M17 17H5l3 3",
  menu: "M4 7h16M4 12h16M4 17h10",
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 18, ...rest }: { name: IconName; size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...rest}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
