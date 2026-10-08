// Brand identity lives here so renaming the platform is a one-line change.
export const SITE = {
  name: "KARVAAN",
  tagline: "India's Automotive Community",
  description:
    "Cars. Bikes. Clubs. Events. The digital home of India's automotive culture — owners, clubs, drives, rides and the people who build them.",
  url: "https://karvaan.in",
  platformFeePct: 1.5,
};

export const NAV_LINKS = [
  { href: "/explore", label: "Explore" },
  { href: "/cars", label: "Cars" },
  { href: "/bikes", label: "Bikes" },
  { href: "/clubs", label: "Clubs" },
  { href: "/events", label: "Events" },
  { href: "/businesses", label: "Businesses" },
] as const;

/** The signed-in demo viewer until Supabase auth is wired up. */
export const DEMO_VIEWER = "yash-parmar";
