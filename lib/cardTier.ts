// Game-card stats for vehicles: four stat bars and an overall rating.
import type { Vehicle } from "./types";

const clamp = (n: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, n));

/**
 * Card stats, each 0–1 for the bar plus the value to print. Cars and bikes use
 * their own scales so a superbike isn't "weak" next to a supercar.
 */
export function vehicleStats(v: Vehicle) {
  const bike = v.kind === "bike";
  const s = v.spec;
  const stats = [
    { k: "PWR", label: "Power", val: s.power ? `${s.power.toLocaleString("en-IN")}${s.powerPlus ? "+" : ""}` : "—", unit: "HP", f: clamp(s.power / (bike ? 230 : 1000)) },
    { k: "TRQ", label: "Torque", val: s.torque ? s.torque.toLocaleString("en-IN") : "—", unit: "Nm", f: clamp(s.torque / (bike ? 150 : 1000)) },
    { k: "ACC", label: "0–100 km/h", val: s.zeroToHundred ? s.zeroToHundred.toFixed(1) : "—", unit: "s", f: s.zeroToHundred ? clamp((9 - s.zeroToHundred) / 6.5) : 0 },
    { k: "TOP", label: "Top speed", val: s.topSpeed ? String(s.topSpeed) : "—", unit: "km/h", f: s.topSpeed ? clamp((s.topSpeed - 100) / (bike ? 230 : 300)) : 0 },
  ];
  // Overall rating 40–99: mostly power, helped by acceleration and top speed when known.
  const known = stats.filter((x) => x.f > 0);
  const weights = known.map((x) => (x.k === "PWR" ? 2 : 1));
  const avg = known.length ? known.reduce((sum, x, i) => sum + x.f * weights[i], 0) / weights.reduce((a, b) => a + b, 0) : 0;
  const ovr = Math.round(40 + clamp(avg) * 59);
  return { stats, ovr };
}
