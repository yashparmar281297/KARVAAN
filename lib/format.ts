const TZ = "Asia/Kolkata";

export const inr = (n: number) =>
  n === 0 ? "Free" : "₹" + new Intl.NumberFormat("en-IN").format(Math.round(n));

export const inrCompact = (n: number) => {
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(n % 1e7 === 0 ? 0 : 1)} Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(n % 1e5 === 0 ? 0 : 1)} L`;
  return inr(n);
};

const fmt = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-IN", { timeZone: TZ, ...opts });

export const dayNum = (iso: string) => fmt({ day: "2-digit" }).format(new Date(iso));
export const monthShort = (iso: string) => fmt({ month: "short" }).format(new Date(iso)).toUpperCase();
export const weekday = (iso: string) => fmt({ weekday: "short" }).format(new Date(iso)).toUpperCase();
export const time = (iso: string) => fmt({ hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(iso));
export const longDate = (iso: string) => fmt({ weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date(iso));
export const shortDate = (iso: string) => fmt({ day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));

export const duration = (min: number) => {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h >= 10) return `${Math.round(min / 60)} HR`;
  return h ? `${h} HR${m ? ` ${m} MIN` : ""}` : `${m} MIN`;
};

export const pad = (n: number, len = 3) => String(n).padStart(len, "0");
